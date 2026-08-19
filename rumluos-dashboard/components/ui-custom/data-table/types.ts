import React from "react"

export type SortDirection = "asc" | "desc"

export interface SortState {
  columnId: string
  direction: SortDirection
}

export type FilterValue = string | number | boolean | (string | number)[]

export interface FilterState {
  [columnId: string]: FilterValue
}

export interface FilterOption {
  label: string
  value: string | number | boolean
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
  icon?: React.ReactNode
  color?: string
}

export interface ColumnDef<T> {
  id: string
  header: string | React.ReactNode
  /** Icon displayed next to header label (e.g., Sparkles, IP, Mail, Settings) */
  headerIcon?: React.ReactNode
  /** Field name on data object */
  accessorKey?: keyof T | string
  /** Custom getter function for column value */
  accessorFn?: (row: T) => any
  /** Enable sorting on this column */
  sortable?: boolean
  /** Custom sort function for client-side sorting */
  sortFn?: (a: T, b: T, direction: SortDirection) => number
  /** Enable filtering on this column */
  filterable?: boolean
  filterType?: "text" | "select" | "boolean" | "date" | "badge"
  filterOptions?: FilterOption[]
  /** Custom search function for global search match */
  searchFn?: (row: T, query: string) => boolean
  /** Custom cell renderer */
  cell?: (props: { row: T; value: any; index: number }) => React.ReactNode
  width?: string
  align?: "left" | "center" | "right"
  hideable?: boolean
  defaultHidden?: boolean
}

export interface RowAction<T> {
  label: string
  icon?: React.ReactNode
  variant?: "default" | "destructive" | "ghost" | "outline"
  onClick: (row: T) => void
  hidden?: (row: T) => boolean
  disabled?: (row: T) => boolean
}

export interface PresetView {
  id: string
  label: string
  badge?: string
  filterState?: FilterState
  sortState?: SortState
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  /** Unique key for each row item (defaults to 'id' or row index) */
  getRowId?: (row: T, index: number) => string
  /** Title of table or view header (e.g. "All Users") */
  title?: string
  presetViews?: PresetView[]
  activePresetId?: string
  onPresetChange?: (preset: PresetView) => void

  /** Search configuration */
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void

  /** Actions top right */
  onCreateNew?: () => void
  createButtonLabel?: string
  createButtonIcon?: React.ReactNode
  onImport?: (data: any[]) => void
  onExport?: (selectedOnly: boolean) => void
  exportFilename?: string

  /** Row selection */
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (selectedIds: string[], selectedRows: T[]) => void

  /** Row level actions */
  onEditRow?: (row: T) => void
  onDeleteRow?: (row: T) => void
  onViewRow?: (row: T) => void
  customRowActions?: RowAction<T>[]
  actionColumnLabel?: string

  /** Server-side or controlled mode override */
  manualPagination?: boolean
  totalCount?: number
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]

  manualSorting?: boolean
  sortState?: SortState | null
  onSortChange?: (sortState: SortState | null) => void

  manualFiltering?: boolean
  filterState?: FilterState
  onFilterChange?: (filters: FilterState) => void

  /** Styling and State */
  isLoading?: boolean
  density?: "compact" | "normal" | "spacious"
  emptyState?: React.ReactNode
  className?: string

  /** Table Refresh Callback */
  onRefresh?: () => void
  /** Enable full-screen table expansion mode */
  enableFullscreen?: boolean
  /** Controlled column visibility override */
  columnVisibilityState?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void

  /** Clickable row */
  onRowClick?: (row: T) => void
}
