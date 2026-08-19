"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { rolesApi, permissionsApi } from "@/lib/api/endpoints"
import { Role } from "@/lib/types"
import {
  getRoleTotalPermissionsCount,
  getRoleModuleBreakdown,
  getRolePriorityConfig,
} from "@/lib/role-utils"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  ShieldCheck,
  ShieldAlert,
  Crown,
  Shield,
  Layers,
  LayoutGrid,
  List,
  Eye,
  Plus,
  Search,
  Sparkles,
  Calendar,
  MoreVertical,
  CheckCircle2,
  Trash2,
  Edit,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DataTable,
  ColumnDef,
  RowAction,
} from "@/components/ui-custom/data-table"
import {
  ModernModal,
  ModernModalFooter,
  ModernModalCancelButton,
  ModernModalSubmitButton,
} from "@/components/ui-custom/modal"
import {
  ModernInput,
  ModernTextarea,
} from "@/components/ui-custom/form-controls"
import { PermissionSelector } from "@/components/ui-custom/permission-selector"
import { RoleMatrixModal } from "@/components/ui-custom/role-matrix-modal"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  displayName: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().optional(),
  permissionIds: z.array(z.string()),
})

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Matrix Detail Modal State
  const [matrixRole, setMatrixRole] = useState<Role | null>(null)

  // Dialog state for Role Create/Edit
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  // Dialog state for Role Permission Exclusions
  const [excludeRole, setExcludeRole] = useState<Role | null>(null)
  const [excludedPermissionIds, setExcludedPermissionIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ["roles", { page, pageSize, search }],
    queryFn: () => rolesApi.list({ page, limit: pageSize, search }),
  })

  const { data: permissionsData = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsApi.list,
  })

  const rolesList: Role[] = data?.items || []

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      priority: 2,
      permissionIds: [],
    },
  })

  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => {
      toast.success("Role created successfully")
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string | number; body: any }) =>
      rolesApi.update(id, body),
    onSuccess: () => {
      toast.success("Role updated successfully")
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setIsDialogOpen(false)
      setEditingRole(null)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const excludeMutation = useMutation({
    mutationFn: ({ id, permissionIds }: { id: string | number; permissionIds: string[] }) =>
      rolesApi.excludePermissions(id, permissionIds),
    onSuccess: () => {
      toast.success("Role permission exclusions updated")
      queryClient.invalidateQueries({ queryKey: ["roles"] })
      setExcludeRole(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: rolesApi.remove,
    onSuccess: () => {
      toast.success("Role deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["roles"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openCreate = () => {
    setEditingRole(null)
    form.reset({ name: "", displayName: "", description: "", priority: 2, permissionIds: [] })
    setIsDialogOpen(true)
  }

  const openEdit = (role: Role) => {
    setEditingRole(role)
    const initialPermIds = new Set<string>(role.permissionIds || [])

    if (role.permissions && typeof role.permissions === "object" && !Array.isArray(role.permissions)) {
      Object.entries(role.permissions).forEach(([modName, items]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const isEnabled = item.enabled !== undefined ? Boolean(item.enabled) : true
            if (isEnabled) {
              if (item.id) initialPermIds.add(String(item.id))
              if (item.grantId) initialPermIds.add(String(item.grantId))
              if (item.name) {
                initialPermIds.add(item.name)
                initialPermIds.add(`${modName.toLowerCase()}.${item.name}`)
                initialPermIds.add(`${modName}.${item.name}`)
              }
            }
          })
        }
      })
    }

    form.reset({
      name: role.name,
      displayName: role.displayName || "",
      description: role.description || "",
      priority: role.priority ?? 2,
      permissionIds: Array.from(initialPermIds),
    })
    setIsDialogOpen(true)
  }

  const openExcludeModal = (role: Role) => {
    setExcludeRole(role)
    setExcludedPermissionIds(role.excludedPermissionIds || [])
  }

  const saveExclusions = () => {
    if (excludeRole) {
      excludeMutation.mutate({ id: excludeRole.id, permissionIds: excludedPermissionIds })
    }
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, body: values })
    } else {
      createMutation.mutate({ ...values, description: values.description || "" })
    }
  }

  // Summary Metrics calculations
  const stats = useMemo(() => {
    const totalRoles = data?.total || rolesList.length
    const topTierCount = rolesList.filter((r) => r.priority === 0 || r.name === "VILLA_ADMIN").length
    const moduleSet = new Set<string>()
    rolesList.forEach((r) => {
      const breakdown = getRoleModuleBreakdown(r)
      breakdown.forEach((b) => moduleSet.add(b.module))
    })
    return {
      totalRoles,
      topTierCount,
      activeModulesCount: moduleSet.size,
    }
  }, [rolesList, data?.total])

  const renderPriorityBadge = (priority?: number) => {
    const conf = getRolePriorityConfig(priority)
    return (
      <Badge variant="outline" className={cn("text-[10px] gap-1 font-semibold px-2 py-0.5 shrink-0", conf.badgeClass)}>
        {conf.iconName === "crown" && <Crown className="size-3 text-rose-500" />}
        {conf.iconName === "shield-check" && <ShieldCheck className="size-3 text-purple-500" />}
        {conf.iconName === "shield-alert" && <ShieldAlert className="size-3 text-blue-500" />}
        {conf.iconName === "shield" && <Shield className="size-3 text-emerald-500" />}
        {conf.shortLabel}
      </Badge>
    )
  }

  const columns: ColumnDef<Role>[] = [
    {
      id: "roleInfo",
      header: "Role & Priority Tier",
      accessorKey: "displayName",
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-start gap-3 py-1">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/60 dark:to-purple-900/40 border border-purple-200/80 dark:border-purple-800 text-purple-700 dark:text-purple-300 shrink-0 shadow-2xs">
            <ShieldCheck className="size-4" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-sm leading-none">
                {row.displayName || row.name}
              </span>
              {renderPriorityBadge(row.priority)}
              {row.isSystem && (
                <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  System
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-200/60 dark:border-purple-800">
                {row.name}
              </span>
              {row.createdAt && (
                <span className="text-[11px] text-muted-foreground">
                  • {new Date(row.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ value }) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">
          {value ? String(value).trim() : "—"}
        </span>
      ),
    },
    {
      id: "permissions",
      header: "Module Scopes & Actions",
      accessorFn: (r) => getRoleTotalPermissionsCount(r),
      sortable: true,
      cell: ({ row }) => {
        const breakdown = getRoleModuleBreakdown(row)
        const total = getRoleTotalPermissionsCount(row)

        return (
          <div className="space-y-1 py-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {breakdown.length > 0 ? (
                breakdown.slice(0, 3).map((item) => (
                  <Badge
                    key={item.module}
                    variant="outline"
                    className="text-[10px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-foreground font-medium px-2 py-0.5 capitalize"
                  >
                    {item.module} ({item.enabledCount})
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No custom module matrix</span>
              )}
              {breakdown.length > 3 && (
                <Badge variant="secondary" className="text-[10px] font-semibold px-1.5 py-0.5">
                  +{breakdown.length - 3} more
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-semibold border-purple-300 text-purple-700 dark:border-purple-800 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20">
                {total} Active Actions
              </Badge>
              <button
                type="button"
                onClick={() => setMatrixRole(row)}
                className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-0.5"
              >
                <Eye className="size-3" /> Matrix
              </button>
            </div>
          </div>
        )
      },
    },
    {
      id: "exclusions",
      header: "Exclusions",
      accessorFn: (r) => r.excludedPermissionIds?.length || 0,
      cell: ({ value }) => (
        value > 0 ? (
          <Badge variant="outline" className="text-xs font-semibold border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/20">
            -{value} Excluded
          </Badge>
        ) : (
          <span className="text-xs text-slate-400 italic">—</span>
        )
      ),
    },
  ]

  const customActions: RowAction<Role>[] = [
    {
      label: "Edit Role Definition",
      icon: <Edit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />,
      onClick: (role) => openEdit(role),
    },
    {
      label: "Inspect Permission Matrix",
      icon: <Eye className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />,
      onClick: (role) => setMatrixRole(role),
    },
    {
      label: "Exclude Permissions",
      icon: <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />,
      onClick: (role) => openExcludeModal(role),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & Analytics Header */}
      <div className="rounded-2xl border border-purple-200/60 dark:border-purple-900/40 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white shadow-md relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute -right-12 -bottom-12 size-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200 border border-white/10">
              <Sparkles className="size-3.5 text-amber-300" />
              Role Access & Permission Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Roles & Permissions Catalogue
            </h1>
            <p className="text-sm text-purple-200/90 leading-relaxed">
              Define security roles, inspect real-time module permissions response data, and manage administrative priority tiers across your organization.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-xs text-purple-200 font-medium">Total Roles</span>
              <span className="text-xl sm:text-2xl font-black">{stats.totalRoles}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-xs text-purple-200 font-medium">Top Tier (P0/1)</span>
              <span className="text-xl sm:text-2xl font-black text-rose-300">{stats.topTierCount}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
              <span className="text-xs text-purple-200 font-medium">Modules Covered</span>
              <span className="text-xl sm:text-2xl font-black text-purple-300">{stats.activeModulesCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Toolbar & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Filters */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search roles by display name, system code, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-9 h-10 bg-card text-xs shadow-2xs"
          />
        </div>

        {/* Controls: View Switcher + Create Role Button */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-card p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                viewMode === "table"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-3.5" /> Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                viewMode === "grid"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" /> Grid Cards
            </button>
          </div>

          <Button
            type="button"
            onClick={openCreate}
            className="h-10 px-4 text-xs font-bold gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Plus className="size-4" /> Create Role
          </Button>
        </div>
      </div>

      {/* Grid Cards View Mode */}
      {viewMode === "grid" ? (
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading roles catalogue...</div>
          ) : rolesList.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">No roles found matching query.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rolesList.map((role) => {
                const breakdown = getRoleModuleBreakdown(role)
                const totalActions = getRoleTotalPermissionsCount(role)

                return (
                  <div
                    key={role.id}
                    className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-card overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Role Header Banner */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 via-purple-50/40 to-slate-50 dark:from-slate-900 dark:via-purple-950/20 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="size-9 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0 border border-purple-200 dark:border-purple-800">
                            <ShieldCheck className="size-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-foreground leading-tight">
                              {role.displayName || role.name}
                            </h3>
                            <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                              {role.name}
                            </span>
                          </div>
                        </div>

                        {renderPriorityBadge(role.priority)}
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                        {role.description || "No description provided."}
                      </p>
                    </div>

                    {/* Module Permissions Breakdown */}
                    <div className="p-4 space-y-3 flex-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground border-b pb-2">
                        <span className="flex items-center gap-1.5">
                          <Layers className="size-3.5 text-purple-600 dark:text-purple-400" />
                          Module Access Matrix
                        </span>
                        <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700 dark:border-purple-800 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20">
                          {totalActions} Actions
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {breakdown.length > 0 ? (
                          breakdown.map((item) => (
                            <Badge
                              key={item.module}
                              variant="secondary"
                              className="text-[11px] font-medium px-2 py-0.5 capitalize bg-slate-100 dark:bg-slate-800 text-foreground"
                            >
                              {item.module}: <strong className="ml-1 text-purple-600 dark:text-purple-400">{item.enabledCount}</strong>
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No custom permission matrix</span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-3 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMatrixRole(role)}
                        className="h-8 text-xs gap-1.5 font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-100/50 dark:hover:bg-purple-950/40"
                      >
                        <Eye className="size-3.5" /> Inspect Matrix
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openExcludeModal(role)}
                          className="h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Exclude permissions"
                        >
                          <ShieldAlert className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(role)}
                          className="h-8 px-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Edit Role"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(role.id)}
                          className="h-8 px-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Role"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Reusable Data Table Component View */
        <DataTable<Role>
          data={rolesList}
          columns={columns}
          getRowId={(r) => String(r.id)}
          title="Role Access Matrix & Governance"
          searchPlaceholder="Search roles by display name or system code..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          createButtonLabel="Create Role"
          onCreateNew={openCreate}
          manualPagination={true}
          totalCount={data?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isLoading={isLoading}
          onEditRow={(r) => openEdit(r)}
          onDeleteRow={(r) => deleteMutation.mutate(r.id)}
          customRowActions={customActions}
          exportFilename="roles-permissions-catalogue"
        />
      )}

      {/* Role Matrix Detail Modal */}
      <RoleMatrixModal
        role={matrixRole}
        isOpen={!!matrixRole}
        onClose={() => setMatrixRole(null)}
      />

      {/* Role Create / Edit Modal */}
      <ModernModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.displayName || editingRole.name}` : "Create New Role"}
        subtitle={editingRole ? "Update role specifications, display name, priority, and permissions matrix." : "Define a new security role and configure its module permission matrix."}
        icon={<ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        size="xl"
        isLoading={createMutation.isPending || updateMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsDialogOpen(false)} />
            <ModernModalSubmitButton
              form="role-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save Role Definition
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="role-form" onSubmit={form.handleSubmit((values: any) => onSubmit(values))} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModernInput
              label="Role Code Name"
              placeholder="e.g. MANAGER or REAL_ESTATE_OFFICER"
              {...form.register("name")}
              error={form.formState.errors.name?.message}
              required
            />
            <ModernInput
              label="Display Name"
              placeholder="e.g. Real Estate Loan Officer"
              {...form.register("displayName")}
            />
            <ModernInput
              label="Priority Level (0 = High, 1 = Admin, 2 = Officer)"
              type="number"
              min={0}
              max={10}
              placeholder="2"
              {...form.register("priority")}
            />
          </div>

          <ModernTextarea
            label="Role Description"
            placeholder="Describe responsibilities, e.g. Manages property financing and villa loans..."
            rows={2}
            {...form.register("description")}
          />

          <PermissionSelector
            permissions={permissionsData}
            selectedIds={form.watch("permissionIds") || []}
            onChange={(ids) => form.setValue("permissionIds", ids)}
            title="Assigned Permissions Matrix"
            description="Toggle actions allowed for users holding this role across system modules."
            badgeVariant="purple"
          />
        </form>
      </ModernModal>

      {/* Role Excluded Permissions Modal */}
      <ModernModal
        isOpen={!!excludeRole}
        onClose={() => setExcludeRole(null)}
        title={`Permission Exclusions for ${excludeRole?.displayName || excludeRole?.name}`}
        subtitle="Explicitly revoke specific module actions from this role."
        icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
        size="xl"
        isLoading={excludeMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setExcludeRole(null)} />
            <ModernModalSubmitButton
              onClick={saveExclusions}
              isLoading={excludeMutation.isPending}
            >
              Save Exclusions
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <PermissionSelector
          permissions={permissionsData}
          selectedIds={excludedPermissionIds}
          onChange={setExcludedPermissionIds}
          title="Excluded Permissions"
          description="Select actions that must be strictly blocked for users holding this role."
          badgeVariant="rose"
        />
      </ModernModal>
    </div>
  )
}
