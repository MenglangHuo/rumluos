import { Role, RolePermissionItem, RolePermissionsMap } from "@/lib/types"

/**
 * Formats system role names like "REAL_ESTATE_OFFICER" into human-readable "Real Estate Officer".
 */
export function formatRoleName(name: string): string {
  if (!name) return ""
  // If it's already mixed/lower case with spaces, preserve it
  if (name.includes(" ") || /[a-z]/.test(name)) return name
  return name
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Normalizes raw backend role object to ensure all UI components receive consistent fields.
 */
export function normalizeRole(raw: any): Role {
  if (!raw) {
    return {
      id: "",
      name: "",
      displayName: "",
      description: "",
      priority: 99,
      permissions: {},
      permissionIds: [],
      isSystem: false,
      createdAt: "",
    }
  }

  const name = String(raw.name || raw.displayName || "").trim()
  const displayName = raw.displayName || formatRoleName(name)
  const description = String(raw.description || "").trim()
  const priority = typeof raw.priority === "number" ? raw.priority : 99
  const isSystem = Boolean(raw.isSystem === true)

  let permissionsMap: RolePermissionsMap = {}
  let derivedPermissionIds: string[] = Array.isArray(raw.permissionIds) ? [...raw.permissionIds] : []

  if (raw.permissions && typeof raw.permissions === "object" && !Array.isArray(raw.permissions)) {
    permissionsMap = raw.permissions
    Object.entries(permissionsMap).forEach(([moduleName, items]) => {
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          if (item) {
            const isEnabled = item.enabled !== undefined ? Boolean(item.enabled) : true
            if (isEnabled) {
              if (item.id) derivedPermissionIds.push(String(item.id))
              if (item.grantId) derivedPermissionIds.push(String(item.grantId))
              if (item.name) {
                derivedPermissionIds.push(item.name)
                derivedPermissionIds.push(`${moduleName.toLowerCase()}.${item.name}`)
                derivedPermissionIds.push(`${moduleName}.${item.name}`)
              }
            }
          }
        })
      }
    })
  }

  return {
    id: raw.id,
    companyId: raw.companyId || null,
    name,
    displayName,
    description,
    priority,
    permissions: permissionsMap,
    permissionIds: derivedPermissionIds,
    excludedPermissionIds: Array.isArray(raw.excludedPermissionIds) ? raw.excludedPermissionIds : [],
    isSystem,
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt || null,
  }
}

export interface ModulePermissionSummary {
  module: string
  permissions: RolePermissionItem[]
  enabledCount: number
  totalCount: number
}

/**
 * Extracts structured module permission breakdown from a role object.
 */
export function getRoleModuleBreakdown(role: Role): ModulePermissionSummary[] {
  const result: ModulePermissionSummary[] = []
  if (!role) return result

  if (role.permissions && typeof role.permissions === "object" && !Array.isArray(role.permissions)) {
    Object.entries(role.permissions).forEach(([moduleKey, items]) => {
      if (Array.isArray(items) && items.length > 0) {
        const enabledCount = items.filter((i) => i.enabled).length
        result.push({
          module: moduleKey,
          permissions: items,
          enabledCount,
          totalCount: items.length,
        })
      }
    })
  }

  // If no permissions map, check permissionIds
  if (result.length === 0 && Array.isArray(role.permissionIds) && role.permissionIds.length > 0) {
    const groups: Record<string, RolePermissionItem[]> = {}
    role.permissionIds.forEach((id) => {
      const parts = id.split(".")
      const mod = parts.length > 1 ? parts[0] : "general"
      const permName = parts.length > 1 ? parts.slice(1).join(".") : id
      if (!groups[mod]) groups[mod] = []
      groups[mod].push({ name: permName, enabled: true })
    })

    Object.entries(groups).forEach(([mod, items]) => {
      result.push({
        module: mod,
        permissions: items,
        enabledCount: items.length,
        totalCount: items.length,
      })
    })
  }

  return result.sort((a, b) => a.module.localeCompare(b.module))
}

/**
 * Calculates total active permissions for a role.
 */
export function getRoleTotalPermissionsCount(role: Role): number {
  if (!role) return 0
  const breakdown = getRoleModuleBreakdown(role)
  if (breakdown.length > 0) {
    return breakdown.reduce((acc, curr) => acc + curr.enabledCount, 0)
  }
  return role.permissionIds?.length || 0
}

export interface PriorityConfig {
  label: string
  shortLabel: string
  badgeVariant: "rose" | "purple" | "blue" | "emerald" | "amber" | "outline"
  badgeClass: string
  iconName: "crown" | "shield-check" | "shield-alert" | "shield" | "user-check"
}

/**
 * Get display styling and priority indicator configuration for a role.
 */
export function getRolePriorityConfig(priority?: number): PriorityConfig {
  switch (priority) {
    case 0:
      return {
        label: "Priority 0 • High / Manager Tier",
        shortLabel: "P0 • High",
        badgeVariant: "rose",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        iconName: "crown",
      }
    case 1:
      return {
        label: "Priority 1 • Admin / Executive Tier",
        shortLabel: "P1 • Admin",
        badgeVariant: "purple",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
        iconName: "shield-check",
      }
    case 2:
      return {
        label: "Priority 2 • Operational Officer Tier",
        shortLabel: "P2 • Officer",
        badgeVariant: "blue",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
        iconName: "shield-alert",
      }
    default:
      return {
        label: priority !== undefined && priority < 99 ? `Priority ${priority}` : "Custom Role",
        shortLabel: priority !== undefined && priority < 99 ? `P${priority}` : "Custom",
        badgeVariant: "emerald",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        iconName: "shield",
      }
  }
}
