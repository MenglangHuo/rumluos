"use client"

import { useState, useMemo } from "react"
import { Permission } from "@/lib/types"
import { Search, CheckSquare, Square, Layers, ShieldCheck, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface PermissionSelectorProps {
  permissions: Permission[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  title?: string
  description?: string
  badgeVariant?: "default" | "emerald" | "rose" | "purple"
  maxHeight?: string
}

export function PermissionSelector({
  permissions = [],
  selectedIds = [],
  onChange,
  disabled = false,
  title = "Permissions Assignment",
  description = "Search and select specific permissions grouped by system module.",
  badgeVariant = "purple",
  maxHeight = "max-h-[420px]",
}: PermissionSelectorProps) {
  const [search, setSearch] = useState("")
  const [selectedModule, setSelectedModule] = useState<string>("ALL")

  // Group permissions by module
  const { modules, groupedPermissions, filteredPermissions } = useMemo(() => {
    const searchLower = search.toLowerCase().trim()

    const filtered = permissions.filter((p) => {
      const matchesSearch =
        !searchLower ||
        p.name.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower)) ||
        (p.module && p.module.toLowerCase().includes(searchLower))
      const matchesModule = selectedModule === "ALL" || (p.module || "General") === selectedModule
      return matchesSearch && matchesModule
    })

    const groups: Record<string, Permission[]> = {}
    filtered.forEach((p) => {
      const mod = p.module || "General"
      if (!groups[mod]) groups[mod] = []
      groups[mod].push(p)
    })

    const allModules = Array.from(new Set(permissions.map((p) => p.module || "General"))).sort()

    return {
      modules: allModules,
      groupedPermissions: groups,
      filteredPermissions: filtered,
    }
  }, [permissions, search, selectedModule])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const isPermSelected = (p: Permission) => {
    if (!p) return false
    if (selectedSet.has(String(p.id))) return true
    if (p.name && selectedSet.has(p.name)) return true
    if (p.name && selectedSet.has(p.name.toLowerCase())) return true
    if (p.module && p.name) {
      const formattedKey = `${p.module.toLowerCase()}.${p.name}`
      if (selectedSet.has(formattedKey)) return true
    }
    return false
  }

  const activeSelectedCount = useMemo(() => {
    return permissions.filter((p) => isPermSelected(p)).length
  }, [permissions, selectedSet])

  const toggleSingle = (p: Permission) => {
    if (disabled) return
    const next = new Set(selectedSet)
    const isChecked = isPermSelected(p)

    if (isChecked) {
      next.delete(String(p.id))
      if (p.name) next.delete(p.name)
      if (p.name) next.delete(p.name.toLowerCase())
      if (p.module && p.name) next.delete(`${p.module.toLowerCase()}.${p.name}`)
    } else {
      next.add(String(p.id))
      if (p.name) next.add(p.name)
    }
    onChange(Array.from(next))
  }

  const toggleModule = (modulePerms: Permission[]) => {
    if (disabled) return
    const allSelected = modulePerms.every((p) => isPermSelected(p))
    const next = new Set(selectedSet)

    if (allSelected) {
      modulePerms.forEach((p) => {
        next.delete(String(p.id))
        if (p.name) next.delete(p.name)
        if (p.name) next.delete(p.name.toLowerCase())
        if (p.module && p.name) next.delete(`${p.module.toLowerCase()}.${p.name}`)
      })
    } else {
      modulePerms.forEach((p) => {
        next.add(String(p.id))
        if (p.name) next.add(p.name)
      })
    }
    onChange(Array.from(next))
  }

  const selectAllFiltered = () => {
    if (disabled) return
    const next = new Set(selectedSet)
    filteredPermissions.forEach((p) => {
      next.add(String(p.id))
      if (p.name) next.add(p.name)
    })
    onChange(Array.from(next))
  }

  const clearAllFiltered = () => {
    if (disabled) return
    const next = new Set(selectedSet)
    filteredPermissions.forEach((p) => {
      next.delete(String(p.id))
      if (p.name) next.delete(p.name)
      if (p.name) next.delete(p.name.toLowerCase())
      if (p.module && p.name) next.delete(`${p.module.toLowerCase()}.${p.name}`)
    })
    onChange(Array.from(next))
  }

  const badgeStyles = {
    default: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    rose: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  }

  return (
    <div className="space-y-3 w-full">
      {/* Header & Quick Action Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h4>
            <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5", badgeStyles[badgeVariant])}>
              {activeSelectedCount} / {permissions.length} Selected
            </Badge>
          </div>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>

        {/* Global Select/Clear Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAllFiltered}
            disabled={disabled || filteredPermissions.length === 0}
            className="h-8 text-xs gap-1.5"
          >
            <CheckSquare className="size-3.5 text-emerald-600" />
            Select All ({filteredPermissions.length})
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAllFiltered}
            disabled={disabled || selectedIds.length === 0}
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Square className="size-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Search Bar & Module Tabs */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search permissions code, description or module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs bg-slate-50/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {/* Module Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedModule("ALL")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0",
              selectedModule === "ALL"
                ? "bg-purple-600 text-white font-semibold shadow-2xs dark:bg-purple-500"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            All Modules ({modules.length})
          </button>
          {modules.map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => setSelectedModule(mod)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0",
                selectedModule === mod
                  ? "bg-purple-600 text-white font-semibold shadow-2xs dark:bg-purple-500"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Content Area */}
      <ScrollArea className={cn("pr-3 rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-950/40", maxHeight)}>
        {Object.keys(groupedPermissions).length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            No permissions matching search query "{search}".
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([modName, perms]) => {
              const allSelected = perms.every((p) => isPermSelected(p))
              const someSelected = perms.some((p) => isPermSelected(p))
              const selectedCount = perms.filter((p) => isPermSelected(p)).length

              return (
                <div key={modName} className="rounded-xl border border-slate-200/90 dark:border-slate-800/90 bg-card overflow-hidden shadow-2xs">
                  {/* Module Header */}
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Layers className="size-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="font-semibold text-xs text-foreground uppercase tracking-wider">{modName}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                        {selectedCount} / {perms.length}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleModule(perms)}
                      disabled={disabled}
                      className="h-7 px-2 text-[11px] font-medium text-purple-700 hover:text-purple-800 hover:bg-purple-100/60 dark:text-purple-300 dark:hover:bg-purple-950/40"
                    >
                      {allSelected ? "Deselect Module" : someSelected ? "Select Rest" : "Select All Module"}
                    </Button>
                  </div>

                  {/* Permissions Grid */}
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {perms.map((p) => {
                      const isChecked = isPermSelected(p)
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleSingle(p)}
                          className={cn(
                            "flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer select-none",
                            isChecked
                              ? "border-purple-300 bg-purple-50/50 dark:border-purple-800/80 dark:bg-purple-950/30"
                              : "border-slate-200/70 bg-background hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700",
                            disabled && "opacity-60 pointer-events-none"
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleSingle(p)}
                            disabled={disabled}
                            className="mt-0.5 shrink-0 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="font-mono text-xs font-bold text-foreground truncate">{p.name}</div>
                            {p.description && (
                              <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
