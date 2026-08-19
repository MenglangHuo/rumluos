"use client"

import { useState } from "react"
import { Role } from "@/lib/types"
import {
  getRoleModuleBreakdown,
  getRolePriorityConfig,
  getRoleTotalPermissionsCount,
} from "@/lib/role-utils"
import {
  ShieldCheck,
  Crown,
  ShieldAlert,
  Shield,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Lock,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ModernModal } from "@/components/ui-custom/modal"
import { cn } from "@/lib/utils"

interface RoleMatrixModalProps {
  role: Role | null
  isOpen: boolean
  onClose: () => void
}

export function RoleMatrixModal({ role, isOpen, onClose }: RoleMatrixModalProps) {
  const [search, setSearch] = useState("")

  if (!role) return null

  const breakdown = getRoleModuleBreakdown(role)
  const totalPerms = getRoleTotalPermissionsCount(role)
  const priorityConfig = getRolePriorityConfig(role.priority)

  const renderPriorityIcon = () => {
    switch (priorityConfig.iconName) {
      case "crown":
        return <Crown className="size-3.5 text-rose-500" />
      case "shield-check":
        return <ShieldCheck className="size-3.5 text-purple-500" />
      case "shield-alert":
        return <ShieldAlert className="size-3.5 text-blue-500" />
      default:
        return <Shield className="size-3.5 text-emerald-500" />
    }
  }

  // Filter modules/permissions based on search
  const searchLower = search.toLowerCase().trim()
  const filteredBreakdown = breakdown.filter((item) => {
    if (!searchLower) return true
    const matchModule = item.module.toLowerCase().includes(searchLower)
    const matchPerm = item.permissions.some((p) => p.name.toLowerCase().includes(searchLower))
    return matchModule || matchPerm
  })

  const formattedDate = role.createdAt
    ? new Date(role.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={role.displayName || role.name}
      subtitle={`Detailed security profile, module permissions, and priority tier for ${role.name}`}
      icon={<ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
      size="xl"
    >
      <div className="space-y-5">
        {/* Top Summary Card */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-slate-50/80 via-white to-purple-50/30 dark:from-slate-900/80 dark:via-slate-900 dark:to-purple-950/20 p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-foreground">
                  {role.displayName || role.name}
                </span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {role.name}
                </span>
                <Badge variant="outline" className={cn("text-xs gap-1 font-semibold px-2.5 py-0.5", priorityConfig.badgeClass)}>
                  {renderPriorityIcon()}
                  {priorityConfig.shortLabel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {role.description || "No specific description provided for this role."}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex flex-col items-center justify-center px-3.5 py-2 rounded-xl bg-card border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <span className="text-xs text-muted-foreground font-medium">Modules</span>
                <span className="text-base font-extrabold text-foreground">{breakdown.length}</span>
              </div>
              <div className="flex flex-col items-center justify-center px-3.5 py-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800 shadow-2xs">
                <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">Active Actions</span>
                <span className="text-base font-extrabold text-purple-700 dark:text-purple-300">{totalPerms}</span>
              </div>
            </div>
          </div>

          {/* Additional details bar */}
          <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4 flex-wrap">
              {formattedDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-slate-400" />
                  <span>Created: {formattedDate}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-slate-400" />
                <span>Role ID: #{role.id}</span>
              </div>
            </div>
            {role.isSystem && (
              <Badge variant="secondary" className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                System Managed
              </Badge>
            )}
          </div>
        </div>

        {/* Search Bar & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Module Access Matrix
            </h4>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search module or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs bg-card"
            />
          </div>
        </div>

        {/* Permissions Breakdown Matrix Grid */}
        <div className="max-h-[380px] overflow-y-auto pr-1 space-y-3 scrollbar-thin">
          {filteredBreakdown.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-2">
              <Sparkles className="size-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">
                {search ? `No permission modules match "${search}"` : "No custom matrix permissions assigned to this role."}
              </p>
            </div>
          ) : (
            filteredBreakdown.map((item) => (
              <div
                key={item.module}
                className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-card overflow-hidden shadow-2xs"
              >
                {/* Module Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                      {item.module}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                      {item.enabledCount} / {item.totalCount} Enabled
                    </Badge>
                  </div>
                </div>

                {/* Actions Chips Grid */}
                <div className="p-3 flex flex-wrap gap-2">
                  {item.permissions.map((perm) => (
                    <div
                      key={perm.name}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                        perm.enabled
                          ? "bg-emerald-50/80 text-emerald-800 border-emerald-200/90 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100/60 text-slate-400 border-slate-200/60 dark:bg-slate-900/60 dark:text-slate-500 dark:border-slate-800 line-through"
                      )}
                    >
                      {perm.enabled ? (
                        <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="size-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="capitalize">{perm.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ModernModal>
  )
}
