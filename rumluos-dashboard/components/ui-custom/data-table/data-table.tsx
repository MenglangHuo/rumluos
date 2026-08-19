"use client"

import React, { useState, useMemo } from "react"
import {
  Search,
  Plus,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Upload,
  Columns,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  Sparkles,
  Layers,
  Trash2,
  MoreVertical,
  Loader2,
  Filter,
  Maximize2,
  Minimize2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import {
  ColumnDef,
  DataTableProps,
  FilterState,
  PresetView,
  SortDirection,
  SortState,
} from "./types"
import { RowActionsCell } from "./cell-renderers"
import { ExportModal, ImportModal } from "./export-import-modal"

export function DataTable<T extends Record<string, any>>({
  data = [],
  columns = [],
  getRowId = (row: T, index: number) => (row && row.id ? String(row.id) : String(index)),
  title = "All Items",
  presetViews = [],
  activePresetId,
  onPresetChange,

  searchable = true,
  searchPlaceholder = "Search...",
  searchValue: controlledSearch,
  onSearchChange,

  onCreateNew,
  createButtonLabel = "Add Record",
  createButtonIcon = <Plus className="h-4 w-4" />,
  onImport,
  onExport,
  exportFilename = "data-table",

  selectable = true,
  selectedIds: controlledSelectedIds,
  onSelectionChange,

  onEditRow,
  onDeleteRow,
  onViewRow,
  customRowActions = [],
  actionColumnLabel = "Action",

  manualPagination = false,
  totalCount,
  page: controlledPage,
  pageSize: controlledPageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],

  manualSorting = false,
  sortState: controlledSortState,
  onSortChange,

  manualFiltering = false,
  filterState: controlledFilterState,
  onFilterChange,

  isLoading = false,
  density: initialDensity = "normal",
  emptyState,
  className,
  onRowClick,

  onRefresh,
  enableFullscreen = true,
  columnVisibilityState: controlledColumnVisibility,
  onColumnVisibilityChange,
}: DataTableProps<T>) {
  // State management (supporting both controlled and uncontrolled modes)
  const [uncontrolledSearch, setUncontrolledSearch] = useState("")
  const search = controlledSearch !== undefined ? controlledSearch : uncontrolledSearch

  const [uncontrolledPage, setUncontrolledPage] = useState(1)
  const page = controlledPage !== undefined ? controlledPage : uncontrolledPage

  const [uncontrolledPageSize, setUncontrolledPageSize] = useState(pageSizeOptions[0] || 10)
  const pageSize = controlledPageSize !== undefined ? controlledPageSize : uncontrolledPageSize

  const [uncontrolledSort, setUncontrolledSort] = useState<SortState | null>(null)
  const sortState = controlledSortState !== undefined ? controlledSortState : uncontrolledSort

  const [uncontrolledFilter, setUncontrolledFilter] = useState<FilterState>({})
  const filterState = controlledFilterState !== undefined ? controlledFilterState : uncontrolledFilter

  const [uncontrolledSelected, setUncontrolledSelected] = useState<string[]>([])
  const selectedIds = controlledSelectedIds !== undefined ? controlledSelectedIds : uncontrolledSelected

  const [uncontrolledColumnVisibility, setUncontrolledColumnVisibility] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    columns.forEach((col) => {
      initial[col.id] = !col.defaultHidden
    })
    return initial
  })

  const columnVisibility = controlledColumnVisibility !== undefined ? controlledColumnVisibility : uncontrolledColumnVisibility

  const handleColumnVisibilityChange = (nextVisibility: Record<string, boolean>) => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(nextVisibility)
    } else {
      setUncontrolledColumnVisibility(nextVisibility)
    }
  }

  // Ensure columnVisibility stays in sync if columns prop changes dynamically
  React.useEffect(() => {
    setUncontrolledColumnVisibility((prev) => {
      const updated = { ...prev }
      let changed = false
      columns.forEach((col) => {
        if (updated[col.id] === undefined) {
          updated[col.id] = !col.defaultHidden
          changed = true
        }
      })
      return changed ? updated : prev
    })
  }, [columns])

  const [density, setDensity] = useState<"compact" | "normal" | "spacious">(initialDensity)
  const [wrapText, setWrapText] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [columnSearchQuery, setColumnSearchQuery] = useState("")

  // ESC key listener to exit fullscreen
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFullscreen])

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Handlers for state updates
  const handleSearchChange = (val: string) => {
    if (onSearchChange) onSearchChange(val)
    else setUncontrolledSearch(val)

    if (!manualPagination) {
      if (onPageChange) onPageChange(1)
      else setUncontrolledPage(1)
    }
  }

  const handleSortToggle = (columnId: string) => {
    let nextSort: SortState | null = null
    if (!sortState || sortState.columnId !== columnId) {
      nextSort = { columnId, direction: "asc" }
    } else if (sortState.direction === "asc") {
      nextSort = { columnId, direction: "desc" }
    } else {
      nextSort = null
    }

    if (onSortChange) onSortChange(nextSort)
    else setUncontrolledSort(nextSort)
  }

  const handleFilterChange = (colId: string, val: any) => {
    const nextFilters = { ...filterState }
    if (val === "" || val === null || val === undefined || (Array.isArray(val) && val.length === 0)) {
      delete nextFilters[colId]
    } else {
      nextFilters[colId] = val
    }

    if (onFilterChange) onFilterChange(nextFilters)
    else setUncontrolledFilter(nextFilters)

    if (!manualPagination) {
      if (onPageChange) onPageChange(1)
      else setUncontrolledPage(1)
    }
  }

  const clearAllFilters = () => {
    if (onFilterChange) onFilterChange({})
    else setUncontrolledFilter({})
    handleSearchChange("")
  }

  const showAllColumns = () => {
    const next: Record<string, boolean> = {}
    columns.forEach((col) => {
      next[col.id] = true
    })
    handleColumnVisibilityChange(next)
  }

  const hideAllColumns = () => {
    const next: Record<string, boolean> = {}
    columns.forEach((col, idx) => {
      // Keep at least the first column visible
      next[col.id] = idx === 0
    })
    handleColumnVisibilityChange(next)
  }

  const resetColumns = () => {
    const next: Record<string, boolean> = {}
    columns.forEach((col) => {
      next[col.id] = !col.defaultHidden
    })
    handleColumnVisibilityChange(next)
  }

  // Filtered & Sorted Data (client side calculations if not manual)
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => columnVisibility[col.id] !== false)
  }, [columns, columnVisibility])

  const filteredData = useMemo(() => {
    if (manualFiltering && manualSorting) return data

    let result = [...data]

    // Global Search
    if (!manualFiltering && search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter((row) => {
        return visibleColumns.some((col) => {
          if (col.searchFn) return col.searchFn(row, q)
          const val = col.accessorFn ? col.accessorFn(row) : col.accessorKey ? row[col.accessorKey] : null
          if (val === null || val === undefined) return false
          return String(val).toLowerCase().includes(q)
        })
      })
    }

    // Column Filters
    if (!manualFiltering && Object.keys(filterState).length > 0) {
      result = result.filter((row) => {
        return Object.entries(filterState).every(([colId, filterVal]) => {
          const col = columns.find((c) => c.id === colId)
          if (!col) return true
          const val = col.accessorFn ? col.accessorFn(row) : col.accessorKey ? row[col.accessorKey] : null

          if (col.filterType === "select" || col.filterType === "badge") {
            return String(val).toLowerCase() === String(filterVal).toLowerCase()
          } else if (col.filterType === "boolean") {
            return Boolean(val) === Boolean(filterVal)
          } else {
            return String(val ?? "").toLowerCase().includes(String(filterVal).toLowerCase())
          }
        })
      })
    }

    // Sorting
    if (!manualSorting && sortState) {
      const { columnId, direction } = sortState
      const col = columns.find((c) => c.id === columnId)
      if (col) {
        result.sort((a, b) => {
          if (col.sortFn) return col.sortFn(a, b, direction)
          const valA = col.accessorFn ? col.accessorFn(a) : col.accessorKey ? a[col.accessorKey] : ""
          const valB = col.accessorFn ? col.accessorFn(b) : col.accessorKey ? b[col.accessorKey] : ""

          if (typeof valA === "number" && typeof valB === "number") {
            return direction === "asc" ? valA - valB : valB - valA
          }

          if (typeof valA === "boolean" || typeof valB === "boolean") {
            const bA = Boolean(valA)
            const bB = Boolean(valB)
            if (bA === bB) return 0
            return direction === "asc" ? (bA ? -1 : 1) : (bA ? 1 : -1)
          }

          const strA = valA !== null && valA !== undefined ? String(valA) : ""
          const strB = valB !== null && valB !== undefined ? String(valB) : ""

          return direction === "asc"
            ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" })
            : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: "base" })
        })
      }
    }

    return result
  }, [data, columns, visibleColumns, search, filterState, sortState, manualFiltering, manualSorting])

  // Pagination calculation
  const effectiveTotalCount = manualPagination ? (totalCount ?? data.length) : filteredData.length
  const totalPages = Math.max(1, Math.ceil(effectiveTotalCount / pageSize))

  const paginatedData = useMemo(() => {
    if (manualPagination) return filteredData
    const start = (page - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, page, pageSize, manualPagination])

  // Selection handlers
  const allCurrentRowIds = useMemo(() => {
    return paginatedData.map((row, idx) => getRowId(row, idx))
  }, [paginatedData, getRowId])

  const isAllSelected = useMemo(() => {
    if (!allCurrentRowIds.length) return false
    return allCurrentRowIds.every((id) => selectedIds.includes(id))
  }, [allCurrentRowIds, selectedIds])

  const isSomeSelected = useMemo(() => {
    return allCurrentRowIds.some((id) => selectedIds.includes(id)) && !isAllSelected
  }, [allCurrentRowIds, selectedIds, isAllSelected])

  const handleSelectAll = (checked: boolean) => {
    let nextIds: string[] = []
    if (checked) {
      const added = allCurrentRowIds.filter((id) => !selectedIds.includes(id))
      nextIds = [...selectedIds, ...added]
    } else {
      nextIds = selectedIds.filter((id) => !allCurrentRowIds.includes(id))
    }

    if (onSelectionChange) {
      const selectedRowObjects = data.filter((row, idx) => nextIds.includes(getRowId(row, idx)))
      onSelectionChange(nextIds, selectedRowObjects)
    } else {
      setUncontrolledSelected(nextIds)
    }
  }

  const handleSelectRow = (id: string, row: T, checked: boolean) => {
    let nextIds: string[] = []
    if (checked) {
      nextIds = [...selectedIds, id]
    } else {
      nextIds = selectedIds.filter((i) => i !== id)
    }

    if (onSelectionChange) {
      const selectedRowObjects = data.filter((r, idx) => nextIds.includes(getRowId(r, idx)))
      onSelectionChange(nextIds, selectedRowObjects)
    } else {
      setUncontrolledSelected(nextIds)
    }
  }

  // Active filter count indicator
  const activeFilterCount = Object.keys(filterState).length + (search ? 1 : 0)

  // Cell padding based on density
  const cellPaddingClass =
    density === "compact"
      ? "py-1.5 px-3"
      : density === "spacious"
      ? "py-4 px-4"
      : "py-3 px-3"

  return (
    <div
      className={cn(
        "w-full space-y-3.5 transition-all",
        isFullscreen && "fixed inset-0 z-50 bg-background/95 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200",
        className
      )}
    >
      {/* Fullscreen Banner Mode Indicator */}
      {isFullscreen && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl text-xs font-semibold text-primary">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Fullscreen Table View — Press ESC or click exit to restore</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="h-7 px-3 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
          >
            Exit Fullscreen
          </Button>
        </div>
      )}

      {/* Top Header / Action Bar (matching screenshot top navigation style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Preset Selector Dropdown */}
          {presetViews.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="h-9 px-3 font-semibold text-lg hover:bg-muted text-foreground gap-2 rounded-lg">
                    <Layers className="h-4 w-4 text-primary" />
                    <span>{presetViews.find((p) => p.id === activePresetId)?.label || title}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-56 shadow-lg">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold">Switch View</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {presetViews.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onClick={() => {
                      onPresetChange?.(preset)
                      if (preset.filterState) setUncontrolledFilter(preset.filterState)
                      if (preset.sortState) setUncontrolledSort(preset.sortState)
                    }}
                    className="flex items-center justify-between cursor-pointer text-sm"
                  >
                    <span>{preset.label}</span>
                    {preset.badge && <Badge variant="secondary" className="text-[10px]">{preset.badge}</Badge>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 px-1">
              <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
              <Badge variant="secondary" className="text-xs font-medium rounded-md px-2 py-0.5">
                {effectiveTotalCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Create and Import / Export Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onCreateNew && (
            <Button
              onClick={onCreateNew}
              className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-sm gap-2 transition-all"
            >
              {createButtonIcon}
              <span>{createButtonLabel}</span>
            </Button>
          )}

          {/* Import / Export Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" className="h-9 px-3 text-sm font-medium gap-2 rounded-lg border-border hover:bg-muted">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>Import / Export</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48 shadow-lg">
              <DropdownMenuItem onClick={() => setIsExportOpen(true)} className="cursor-pointer gap-2">
                <Download className="h-4 w-4 text-primary" /> Export Data (CSV/JSON)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportOpen(true)} className="cursor-pointer gap-2">
                <Upload className="h-4 w-4 text-emerald-500" /> Import File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Toolbar (Search, Filter popover, Sort popover, Columns menu, Density & Tools) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-2.5 rounded-xl border border-border">
        {/* Search input */}
        {searchable && (
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm rounded-lg border-border bg-background focus-visible:ring-primary/40"
            />
            {search && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Sort By Popover / Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={sortState ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-xs font-medium rounded-lg border-border"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Sort</span>
                  {sortState && (
                    <Badge variant="default" className="ml-1 h-4 px-1 text-[10px] bg-primary">
                      {sortState.direction.toUpperCase()}
                    </Badge>
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 shadow-lg">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold flex items-center justify-between">
                <span>Sort By Column</span>
                {sortState && (
                  <button
                    onClick={() => handleSortToggle(sortState.columnId)}
                    className="text-primary hover:underline text-[10px]"
                  >
                    Clear Sort
                  </button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns
                .filter((col) => col.sortable !== false)
                .map((col) => {
                  const isSorted = sortState?.columnId === col.id
                  return (
                    <DropdownMenuItem
                      key={col.id}
                      onClick={() => handleSortToggle(col.id)}
                      className="flex items-center justify-between cursor-pointer text-xs"
                    >
                      <span className="flex items-center gap-1.5">
                        {col.headerIcon}
                        <span>{typeof col.header === "string" ? col.header : col.id}</span>
                      </span>
                      {isSorted && (
                        <span className="text-primary font-bold">
                          {sortState.direction === "asc" ? "↑ ASC" : "↓ DESC"}
                        </span>
                      )}
                    </DropdownMenuItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filter Popover / Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={activeFilterCount > 0 ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-xs font-medium rounded-lg border-border"
                >
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="default" className="ml-1 h-4 w-4 p-0 flex items-center justify-center rounded-full text-[10px] bg-primary">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-72 p-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b mb-2">
                <span className="font-semibold text-xs text-foreground uppercase tracking-wider">Filter Columns</span>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset
                  </Button>
                )}
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {columns
                  .filter((col) => col.filterable !== false && (col.filterOptions || col.filterType))
                  .map((col) => {
                    const currentVal = filterState[col.id] || ""
                    return (
                      <div key={col.id} className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          {col.headerIcon}
                          <span>{typeof col.header === "string" ? col.header : col.id}</span>
                        </Label>
                        {col.filterOptions ? (
                          <select
                            value={String(currentVal)}
                            onChange={(e) => handleFilterChange(col.id, e.target.value)}
                            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2.5 py-1 focus:ring-1 focus:ring-primary"
                          >
                            <option value="">All options</option>
                            {col.filterOptions.map((opt) => (
                              <option key={String(opt.value)} value={String(opt.value)}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            placeholder={`Filter by ${typeof col.header === "string" ? col.header : col.id}...`}
                            value={String(currentVal)}
                            onChange={(e) => handleFilterChange(col.id, e.target.value)}
                            className="h-8 text-xs rounded-md"
                          />
                        )}
                      </div>
                    )
                  })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Visibility Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={visibleColumns.length < columns.length ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-xs font-medium rounded-lg border-border"
                >
                  <Columns className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">Columns</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "ml-0.5 px-1.5 py-0 h-4 text-[10px] font-bold rounded-md",
                      visibleColumns.length < columns.length ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {visibleColumns.length}/{columns.length}
                  </Badge>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-64 p-3 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                <div className="flex items-center gap-1.5">
                  <Columns className="h-4 w-4 text-primary" />
                  <span className="font-bold text-xs text-foreground uppercase tracking-wider">Columns</span>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {visibleColumns.length} of {columns.length} active
                </span>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={showAllColumns}
                  className="h-6 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10 rounded-md"
                >
                  Show All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hideAllColumns}
                  className="h-6 px-2 text-[11px] font-semibold text-muted-foreground hover:bg-muted rounded-md"
                >
                  Hide All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetColumns}
                  className="h-6 px-2 text-[11px] font-semibold text-muted-foreground hover:bg-muted rounded-md"
                >
                  Reset
                </Button>
              </div>

              {/* Search Column Input */}
              {columns.length > 4 && (
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Filter column list..."
                    value={columnSearchQuery}
                    onChange={(e) => setColumnSearchQuery(e.target.value)}
                    className="pl-8 pr-7 h-7 text-xs rounded-md bg-muted/40 border-border"
                  />
                  {columnSearchQuery && (
                    <button
                      onClick={() => setColumnSearchQuery("")}
                      className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Column List with Checkboxes */}
              <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
                {columns
                  .filter((col) => {
                    if (!columnSearchQuery) return true
                    const label = typeof col.header === "string" ? col.header : col.id
                    return label.toLowerCase().includes(columnSearchQuery.toLowerCase())
                  })
                  .map((col) => {
                    const isVisible = columnVisibility[col.id] !== false
                    const headerLabel = typeof col.header === "string" ? col.header : col.id

                    return (
                      <div
                        key={col.id}
                        onClick={() => {
                          handleColumnVisibilityChange({
                            ...columnVisibility,
                            [col.id]: !isVisible,
                          })
                        }}
                        className={cn(
                          "flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer select-none transition-colors",
                          isVisible
                            ? "bg-primary/5 text-foreground hover:bg-primary/10"
                            : "text-muted-foreground hover:bg-muted/60"
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <Checkbox
                            checked={isVisible}
                            onCheckedChange={(checked) => {
                              handleColumnVisibilityChange({
                                ...columnVisibility,
                                [col.id]: Boolean(checked),
                              })
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {col.headerIcon && <span className="shrink-0">{col.headerIcon}</span>}
                          <span className="font-medium truncate">{headerLabel}</span>
                        </div>

                        {isVisible && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                    )
                  })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Settings & Layout Menu (Right of Columns) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant={isFullscreen || wrapText || density !== "normal" ? "secondary" : "outline"}
                  size="sm"
                  className="h-9 px-3 gap-1.5 text-xs font-medium rounded-lg border-border"
                  title="View Settings & Layout Options"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="hidden sm:inline">View</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 p-3 shadow-xl space-y-3">
              {/* Section 1: Row Density */}
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Row Density
                </span>
                <div className="grid grid-cols-3 gap-1 bg-muted/50 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDensity("compact")}
                    className={cn(
                      "py-1 text-[11px] font-semibold rounded-md transition-all text-center cursor-pointer",
                      density === "compact"
                        ? "bg-background text-primary shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => setDensity("normal")}
                    className={cn(
                      "py-1 text-[11px] font-semibold rounded-md transition-all text-center cursor-pointer",
                      density === "normal"
                        ? "bg-background text-primary shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setDensity("spacious")}
                    className={cn(
                      "py-1 text-[11px] font-semibold rounded-md transition-all text-center cursor-pointer",
                      density === "spacious"
                        ? "bg-background text-primary shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Spacious
                  </button>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Section 2: Display Modes */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Display Options
                </span>

                {/* Text Wrap Toggle */}
                <div
                  onClick={() => setWrapText(!wrapText)}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Wrap Cell Text</span>
                  </span>
                  <Checkbox checked={wrapText} onCheckedChange={(c) => setWrapText(!!c)} />
                </div>

                {/* Fullscreen Table Mode Toggle */}
                {enableFullscreen && (
                  <div
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-muted transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}</span>
                    </span>
                    <Badge variant={isFullscreen ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                      {isFullscreen ? "On" : "Off"}
                    </Badge>
                  </div>
                )}
              </div>

              <DropdownMenuSeparator />

              {/* Section 3: Reset Table State */}
              <div className="space-y-1">
                {onRefresh && (
                  <DropdownMenuItem
                    onClick={onRefresh}
                    className="flex items-center gap-2 text-xs cursor-pointer font-medium text-foreground hover:bg-muted"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-primary" />
                    <span>Refresh Data</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => {
                    clearAllFilters()
                    resetColumns()
                    setDensity("normal")
                    setWrapText(false)
                  }}
                  className="flex items-center gap-2 text-xs cursor-pointer font-medium text-destructive hover:bg-destructive/10"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Table View</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Standalone Refresh Button (if onRefresh prop is passed) */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-9 px-2.5 text-xs font-medium rounded-lg border-border hover:bg-muted"
              title="Refresh table data"
            >
              <RotateCcw className={cn("h-3.5 w-3.5 text-muted-foreground", isLoading && "animate-spin text-primary")} />
            </Button>
          )}
        </div>
      </div>

      {/* Selected Items Batch Action Banner */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-2.5 px-4 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 text-primary">
            <Check className="h-4 w-4 rounded-full bg-primary text-primary-foreground p-0.5" />
            <span className="font-semibold">{selectedIds.length} row(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportOpen(true)}
              className="h-7 px-2.5 text-xs bg-background hover:bg-muted"
            >
              <Download className="h-3 w-3 mr-1" /> Export Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSelectAll(false)}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40 border-b border-border">
              <TableRow className="hover:bg-transparent">
                {selectable && (
                  <TableHead className="w-10 px-3 py-3 align-middle">
                    <Checkbox
                      checked={Boolean(isAllSelected || isSomeSelected)}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all rows"
                      className="translate-y-[1px]"
                    />
                  </TableHead>
                )}

                {visibleColumns.map((col) => {
                  const isSorted = sortState?.columnId === col.id
                  const canSort = col.sortable !== false

                  return (
                    <TableHead
                      key={col.id}
                      style={{ width: col.width }}
                      className={cn(
                        "font-semibold text-xs text-foreground/90 py-3 whitespace-nowrap select-none",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        canSort && "cursor-pointer hover:text-primary transition-colors"
                      )}
                      onClick={() => canSort && handleSortToggle(col.id)}
                    >
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5",
                          col.align === "right" && "justify-end w-full",
                          col.align === "center" && "justify-center w-full"
                        )}
                      >
                        {col.headerIcon}
                        <span>{typeof col.header === "string" ? col.header : col.header}</span>
                        {canSort && (
                          <span className="text-muted-foreground shrink-0 ml-0.5">
                            {isSorted ? (
                              sortState.direction === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  )
                })}

                {(onEditRow || onDeleteRow || onViewRow || customRowActions.length > 0) && (
                  <TableHead className="w-16 px-3 py-3 text-right font-semibold text-xs text-foreground/90">
                    <div className="inline-flex items-center justify-end gap-1">
                      <span>{actionColumnLabel}</span>
                    </div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: pageSize > 10 ? 5 : pageSize }).map((_, rIdx) => (
                  <TableRow key={rIdx} className="animate-pulse">
                    {selectable && <TableCell className="px-3"><div className="h-4 w-4 bg-muted rounded" /></TableCell>}
                    {visibleColumns.map((c) => (
                      <TableCell key={c.id} className="px-3">
                        <div className="h-5 bg-muted rounded w-3/4" />
                      </TableCell>
                    ))}
                    <TableCell className="px-3 text-right"><div className="h-6 w-6 bg-muted rounded-full ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (selectable ? 1 : 0) + 1}
                    className="h-48 text-center"
                  >
                    {emptyState || (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Sparkles className="h-10 w-10 mb-3 opacity-20 text-primary" />
                        <p className="text-sm font-medium text-foreground">No matching records found</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          Try adjusting your search criteria or clear active filters.
                        </p>
                        {activeFilterCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllFilters}
                            className="mt-4 h-8 px-3 text-xs gap-1.5"
                          >
                            <RotateCcw className="h-3 w-3" /> Clear Filters
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, idx) => {
                  const rowId = getRowId(row, idx)
                  const isSelected = selectedIds.includes(rowId)

                  return (
                    <TableRow
                      key={rowId}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        "transition-colors hover:bg-muted/40 group",
                        isSelected && "bg-primary/5 hover:bg-primary/10",
                        onRowClick && "cursor-pointer"
                      )}
                    >
                      {selectable && (
                        <TableCell className={cn("w-10 px-3 align-middle", cellPaddingClass)}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(rowId, row, !!checked)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select row ${rowId}`}
                          />
                        </TableCell>
                      )}

                      {visibleColumns.map((col) => {
                        const rawValue = col.accessorFn
                          ? col.accessorFn(row)
                          : col.accessorKey
                          ? row[col.accessorKey]
                          : null

                        return (
                          <TableCell
                            key={col.id}
                            style={{ width: col.width }}
                            className={cn(
                              "align-middle text-sm text-foreground/90 font-normal",
                              cellPaddingClass,
                              !wrapText && "whitespace-nowrap",
                              wrapText && "break-words",
                              col.align === "right" && "text-right",
                              col.align === "center" && "text-center"
                            )}
                          >
                            {col.cell ? col.cell({ row, value: rawValue, index: idx }) : String(rawValue ?? "—")}
                          </TableCell>
                        )
                      })}

                      {(onEditRow || onDeleteRow || onViewRow || customRowActions.length > 0) && (
                        <TableCell
                          className={cn("w-16 px-3 text-right align-middle", cellPaddingClass)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActionsCell
                            row={row}
                            onView={onViewRow}
                            onEdit={onEditRow}
                            onDelete={onDeleteRow}
                            customActions={customRowActions}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-card shrink-0 text-xs">
          {/* Page size selector & entry counter */}
          <div className="flex items-center gap-4 text-muted-foreground w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const size = Number(e.target.value)
                  if (onPageSizeChange) onPageSizeChange(size)
                  else setUncontrolledPageSize(size)

                  if (onPageChange) onPageChange(1)
                  else setUncontrolledPage(1)
                }}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium focus:ring-1 focus:ring-primary"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <span>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {effectiveTotalCount === 0 ? 0 : (page - 1) * pageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(page * pageSize, effectiveTotalCount)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{effectiveTotalCount}</span> entries
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page <= 1 || isLoading}
              onClick={() => {
                if (onPageChange) onPageChange(1)
                else setUncontrolledPage(1)
              }}
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page <= 1 || isLoading}
              onClick={() => {
                const prev = Math.max(1, page - 1)
                if (onPageChange) onPageChange(prev)
                else setUncontrolledPage(prev)
              }}
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="px-2 font-medium text-foreground">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page >= totalPages || isLoading}
              onClick={() => {
                const next = Math.min(totalPages, page + 1)
                if (onPageChange) onPageChange(next)
                else setUncontrolledPage(next)
              }}
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page >= totalPages || isLoading}
              onClick={() => {
                if (onPageChange) onPageChange(totalPages)
                else setUncontrolledPage(totalPages)
              }}
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
        data={data.map((r, idx) => ({ ...r, _selected: selectedIds.includes(getRowId(r, idx)) }))}
        selectedCount={selectedIds.length}
        filename={exportFilename}
        onExportDone={onExport ? () => onExport(selectedIds.length > 0) : undefined}
      />

      {/* Import Modal */}
      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportData={(rows) => {
          if (onImport) onImport(rows)
        }}
      />
    </div>
  )
}
