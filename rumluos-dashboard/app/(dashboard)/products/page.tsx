"use client"

import { useState, useMemo, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productsApi, categoriesApi, brandsApi, uploadFile, uploadFileWithAttachment, fileUrl, storageApi } from "@/lib/api/endpoints"
import { Product, Category, Brand } from "@/lib/types"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuickActions } from "@/components/quick-action-modal-context"
import { RowAction } from "@/components/ui-custom/data-table"
import { MediaPickerModal } from "@/components/attachments/media-picker-modal"
import {
  Loader2,
  Package,
  Tags,
  Bookmark,
  Sparkles,
  ListPlus,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Eye,
  DollarSign,
  TrendingUp,
  Boxes,
  Layers,
  LayoutGrid,
  LayoutList,
  Upload,
  Image as ImageIcon,
  FileImage,
  Pencil,
  ExternalLink,
  FolderOpen,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DataTable,
  ColumnDef,
  StatusBadgeCell,
  UserDetailCell,
} from "@/components/ui-custom/data-table"
import {
  ModernModal,
  ModernModalFooter,
  ModernModalCancelButton,
  ModernModalSubmitButton,
} from "@/components/ui-custom/modal"
import {
  ModernInput,
  ModernSelect,
  ModernTextarea,
  ModernSwitch,
} from "@/components/ui-custom/form-controls"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// ============================================================
// Schemas
// ============================================================

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  brandId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  year: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().nullable().optional()
  ),
  condition: z.string().default("NEW"),
  basePrice: z.coerce.number().min(0, "Base price must be greater than or equal to 0"),
  sellPrice: z.coerce.number().min(0, "Sell price must be greater than or equal to 0"),
  currency: z.string().default("USD"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.string().default("AVAILABLE"),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
})

const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  isActive: z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productSchema>
type CategoryFormValues = z.infer<typeof categorySchema>
type BrandFormValues = z.infer<typeof brandSchema>

// ============================================================
// Main Page Component
// ============================================================

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Products & Inventory</h2>
        <p className="text-muted-foreground text-sm">
          Manage your products, categories, and brand catalog.
        </p>
      </div>

      <Tabs defaultValue="products" className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="brands" className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Brands
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>

        <TabsContent value="brands">
          <BrandsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// 1. PRODUCTS TAB
// ============================================================

function ProductsTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null)

  // Media Picker & Image Upload State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Batch Import State
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false)
  const [batchDefaultBrandId, setBatchDefaultBrandId] = useState("")
  const [batchDefaultCategoryId, setBatchDefaultCategoryId] = useState("")
  const [batchDefaultCurrency, setBatchDefaultCurrency] = useState("USD")
  const [batchRows, setBatchRows] = useState<
    { id: string; name: string; model: string; serialNumber: string; basePrice: number; sellPrice: number; condition: string }[]
  >([
    { id: "1", name: "", model: "", serialNumber: "", basePrice: 0, sellPrice: 0, condition: "NEW" },
    { id: "2", name: "", model: "", serialNumber: "", basePrice: 0, sellPrice: 0, condition: "NEW" },
  ])
  const [batchImportResult, setBatchImportResult] = useState<any>(null)

  // Fetch Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", { page, pageSize, search }],
    queryFn: () => productsApi.list({ page, limit: pageSize, search }),
  })

  // Fetch Brands & Categories for select dropdowns & table labels
  const { data: brandsData } = useQuery({
    queryKey: ["brands-all"],
    queryFn: () => brandsApi.list({ limit: 100 }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
  })

  const brandMap = useMemo(() => {
    const map = new Map<string, string>()
    brandsData?.items?.forEach((b) => map.set(b.id, b.name))
    return map
  }, [brandsData])

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    categoriesData?.items?.forEach((c) => map.set(c.id, c.name))
    return map
  }, [categoriesData])

  // Summary Metrics Calculation
  const metrics = useMemo(() => {
    const items = productsData?.items || []
    const totalCount = productsData?.total || items.length
    const availableCount = items.filter((p) => p.status === "AVAILABLE" || !p.status).length
    const reservedCount = items.filter((p) => p.status === "RESERVED" || p.status === "IN_LOAN").length
    const totalValue = items.reduce((sum, p) => sum + (p.sellPrice || p.basePrice || 0), 0)
    return {
      totalCount,
      availableCount,
      reservedCount,
      totalValue,
    }
  }, [productsData])

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const attachment = await uploadFileWithAttachment(file, {
        isPublic: true,
        category: "PRODUCTS",
        description: `Product asset image: ${file.name}`,
      })
      let finalUrl = fileUrl(attachment.fileKey) || ""
      try {
        const res = await storageApi.getDownloadUrl(attachment.fileKey)
        if (res?.downloadUrl) {
          finalUrl = res.downloadUrl
        }
      } catch (ignored) {}
      form.setValue("imageUrl", finalUrl)
      queryClient.invalidateQueries({ queryKey: ["attachments"] })
      toast.success("Image uploaded to AWS S3 & saved to Attachments Library!")
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to upload image to S3")
    } finally {
      setUploadingImage(false)
      if (e.target) e.target.value = ""
    }
  }

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema as any),
    defaultValues: {
      name: "",
      brandId: "",
      categoryId: "",
      model: "",
      serialNumber: "",
      year: null,
      condition: "NEW",
      basePrice: 0,
      sellPrice: 0,
      currency: "USD",
      description: "",
      imageUrl: "",
      status: "AVAILABLE",
      isActive: true,
      notes: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      toast.success("Product created successfully")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Product> }) =>
      productsApi.update(id, body),
    onSuccess: () => {
      toast.success("Product updated successfully")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      setIsDialogOpen(false)
      setEditingProduct(null)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => {
      toast.success("Product deleted")
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const batchImportMutation = useMutation({
    mutationFn: productsApi.importBatch,
    onSuccess: (res) => {
      setBatchImportResult(res)
      if (res.successCount > 0) {
        toast.success(`Batch import completed: ${res.successCount} items created`, {
          description: res.failedCount > 0 ? `${res.failedCount} failed validation.` : "All items imported cleanly.",
        })
        queryClient.invalidateQueries({ queryKey: ["products"] })
      } else {
        toast.error(`Batch import failed. ${res.failedCount} items failed.`)
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const addBatchRow = () => {
    setBatchRows((prev) => [
      ...prev,
      { id: Math.random().toString(), name: "", model: "", serialNumber: "", basePrice: 0, sellPrice: 0, condition: "NEW" },
    ])
  }

  const removeBatchRow = (id: string) => {
    setBatchRows((prev) => prev.filter((r) => r.id !== id))
  }

  const updateBatchRow = (id: string, field: string, value: any) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validProducts = batchRows
      .filter((r) => r.name.trim() && r.serialNumber.trim())
      .map((r) => ({
        name: r.name.trim(),
        model: r.model.trim() || undefined,
        serialNumber: r.serialNumber.trim(),
        brandId: batchDefaultBrandId ? Number(batchDefaultBrandId) : null,
        categoryId: batchDefaultCategoryId ? Number(batchDefaultCategoryId) : null,
        currency: batchDefaultCurrency,
        basePrice: Number(r.basePrice) || 0,
        sellPrice: Number(r.sellPrice) || 0,
        condition: r.condition || "NEW",
        status: "AVAILABLE",
        isActive: true,
      }))

    if (validProducts.length === 0) {
      toast.error("Please fill in at least one item with Product Name and Serial Number.")
      return
    }

    batchImportMutation.mutate({ products: validProducts })
  }

  const openCreate = () => {
    setEditingProduct(null)
    form.reset({
      name: "",
      brandId: "",
      categoryId: "",
      model: "",
      serialNumber: "",
      year: null,
      condition: "NEW",
      basePrice: 0,
      sellPrice: 0,
      currency: "USD",
      description: "",
      imageUrl: "",
      status: "AVAILABLE",
      isActive: true,
      notes: "",
    })
    setIsDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    form.reset({
      name: product.name || "",
      brandId: product.brandId ? String(product.brandId) : "",
      categoryId: product.categoryId ? String(product.categoryId) : "",
      model: product.model || "",
      serialNumber: product.serialNumber || "",
      year: product.year ?? null,
      condition: product.condition || "NEW",
      basePrice: product.basePrice || 0,
      sellPrice: product.sellPrice || 0,
      currency: product.currency || "USD",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      status: product.status || "AVAILABLE",
      isActive: product.isActive ?? true,
      notes: product.notes || "",
    })
    setIsDialogOpen(true)
  }

  const onSubmit = (values: ProductFormValues) => {
    const payload: Partial<Product> = {
      ...values,
      brandId: values.brandId ? String(values.brandId) : null,
      categoryId: values.categoryId ? String(values.categoryId) : null,
      basePrice: Number(values.basePrice) || 0,
      sellPrice: Number(values.sellPrice) || 0,
      year: values.year ? Number(values.year) : null,
    }
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, body: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const toggleActive = (product: Product) => {
    updateMutation.mutate({
      id: product.id,
      body: {
        ...product,
        isActive: !product.isActive,
      },
    })
  }

  const columns: ColumnDef<Product>[] = [
    {
      id: "name",
      header: "Product Name",
      accessorKey: "name",
      sortable: true,
      cell: ({ row }) => (
        <div
          className="cursor-pointer group"
          onClick={() => setSelectedProductDetails(row)}
        >
          <UserDetailCell
            name={row.name}
            subtitle={row.model ? `Model: ${row.model}` : row.serialNumber ? `S/N: ${row.serialNumber}` : undefined}
            avatarUrl={row.imageUrl}
          />
        </div>
      ),
    },
    {
      id: "category",
      header: "Category / Brand",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.categoryId && (
            <Badge variant="secondary" className="text-[11px]">
              {categoryMap.get(row.categoryId) || "Category"}
            </Badge>
          )}
          {row.brandId && (
            <Badge variant="outline" className="text-[11px]">
              {brandMap.get(row.brandId) || "Brand"}
            </Badge>
          )}
          {!row.categoryId && !row.brandId && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      id: "pricing",
      header: "Pricing",
      accessorKey: "sellPrice",
      sortable: true,
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-xs text-foreground">
            {row.currency} {row.sellPrice?.toLocaleString()}
          </div>
          {row.basePrice > 0 && (
            <div className="text-[11px] text-muted-foreground">
              Cost: {row.currency} {row.basePrice?.toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "condition",
      header: "Condition / Status",
      accessorKey: "status",
      filterType: "select",
      filterOptions: [
        { label: "Available", value: "AVAILABLE" },
        { label: "Reserved", value: "RESERVED" },
        { label: "Sold", value: "SOLD" },
      ],
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 items-center">
          <Badge variant={row.condition === "NEW" ? "default" : "secondary"} className="text-[10px]">
            {row.condition || "NEW"}
          </Badge>
          <StatusBadgeCell status={row.status || "AVAILABLE"} type="account" />
        </div>
      ),
    },
    {
      id: "isActive",
      header: "Active",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <Switch checked={row.isActive} onCheckedChange={() => toggleActive(row)} />
      ),
    },
  ]

  const { openLoanWizard } = useQuickActions()

  const productActions: RowAction<Product>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-3.5 w-3.5 text-sky-500" />,
      onClick: (product) => setSelectedProductDetails(product),
    },
    {
      label: "+ Loan This Asset",
      icon: <Sparkles className="h-3.5 w-3.5 text-emerald-500" />,
      onClick: (product) => {
        openLoanWizard({
          productId: product.id,
          productName: product.name,
          sellPrice: product.sellPrice || product.basePrice || 0,
        })
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Top Overview KPI Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Total Catalog Items
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 block">
              {metrics.totalCount}
            </span>
            <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1 mt-1">
              <Boxes className="h-3 w-3" /> Products Registered
            </span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Available Units
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
              {metrics.availableCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3" /> Ready for Finance / Sale
            </span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Financed / Reserved
            </span>
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
              {metrics.reservedCount}
            </span>
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
              <Layers className="h-3 w-3" /> Tied to Active Contracts
            </span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Total Inventory Value
            </span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 block">
              ${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" /> Cumulative Retail Value
            </span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Top Banner with View Switcher & Batch Import Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Products Catalog & Inventory Stock
            </h4>
            <p className="text-[11px] text-slate-500">
              Manage product items, serial numbers, conditions, and stock status.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <Button
              type="button"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={`h-7 px-2.5 text-xs font-bold gap-1.5 rounded-lg ${viewMode === "table" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500"}`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Table</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={`h-7 px-2.5 text-xs font-bold gap-1.5 rounded-lg ${viewMode === "grid" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100" : "text-slate-500"}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid Cards</span>
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setBatchImportResult(null)
              setIsBatchImportOpen(true)
            }}
            className="gap-2 text-xs font-bold h-9 bg-white dark:bg-slate-900 border-sky-500/30 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30 shadow-sm"
          >
            <ListPlus className="h-4 w-4 text-sky-500" />
            <span>Batch Import Products</span>
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <DataTable<Product>
          data={productsData?.items || []}
          columns={columns}
          getRowId={(p) => p.id}
          title="Products Catalog"
          searchPlaceholder="Search product name, model, serial..."
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          createButtonLabel="Add Product"
          onCreateNew={openCreate}
          manualPagination={true}
          totalCount={productsData?.total || 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          isLoading={isLoading}
          onEditRow={openEdit}
          onDeleteRow={(p) => deleteMutation.mutate(p.id)}
          customRowActions={productActions}
          exportFilename="products-catalog"
        />
      ) : (
        /* GRID CARDS VIEW */
        <div className="space-y-4">
          {/* Header controls for grid view */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search products by name, model, serial number..."
                className="h-9 text-xs pl-3 pr-8 rounded-xl"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <span className="text-xs text-slate-500 font-medium">
                Showing {productsData?.items?.length || 0} of {productsData?.total || 0} item(s)
              </span>
              <Button
                onClick={openCreate}
                className="h-9 px-4 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-xs gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : (productsData?.items || []).length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <Package className="h-12 w-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">No Products Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your search criteria. Try clearing search or adding a new product asset.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(productsData?.items || []).map((product) => (
                <div
                  key={product.id}
                  className="group relative rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  {/* Image Showcase & Top Badges */}
                  <div className="space-y-3">
                    <div className="relative h-44 w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/60 dark:border-slate-800 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                      )}

                      {/* Condition & Status Overlay Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <Badge variant={product.condition === "NEW" ? "default" : "secondary"} className="text-[10px] shadow-xs font-bold">
                          {product.condition || "NEW"}
                        </Badge>
                      </div>

                      <div className="absolute top-2 right-2">
                        <StatusBadgeCell status={product.status || "AVAILABLE"} type="account" />
                      </div>
                    </div>

                    {/* Product Name & Identifiers */}
                    <div>
                      <h3
                        onClick={() => setSelectedProductDetails(product)}
                        className="font-extrabold text-sm text-slate-900 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer line-clamp-1"
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono flex flex-wrap items-center gap-2">
                        {product.model && <span>Model: {product.model}</span>}
                        {product.serialNumber && <span>S/N: {product.serialNumber}</span>}
                      </p>
                    </div>

                    {/* Category & Brand Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {product.categoryId && categoryMap.has(product.categoryId) && (
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800">
                          {categoryMap.get(product.categoryId)}
                        </Badge>
                      )}
                      {product.brandId && brandMap.has(product.brandId) && (
                        <Badge variant="outline" className="text-[10px]">
                          {brandMap.get(product.brandId)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Footer Controls */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Retail Price</span>
                        <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                          {product.currency || "$"} {(product.sellPrice || product.basePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400">Active</span>
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => toggleActive(product)}
                        />
                      </div>
                    </div>

                    {/* Card Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProductDetails(product)}
                        className="h-8 text-[11px] font-bold gap-1 text-sky-600 border-sky-500/20 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(product)}
                        className="h-8 text-[11px] font-bold gap-1 text-slate-700 dark:text-slate-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          openLoanWizard({
                            productId: product.id,
                            productName: product.name,
                            sellPrice: product.sellPrice || product.basePrice || 0,
                          })
                        }}
                        className="h-8 text-[11px] font-bold gap-1 text-emerald-600 border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Loan
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Create/Edit Modal */}
      <ModernModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingProduct ? "Edit Product" : "Create Product"}
        subtitle={editingProduct ? "Update product information and catalog details." : "Add a new product to your inventory catalog."}
        icon={<Package className="h-5 w-5" />}
        size="lg"
        isLoading={createMutation.isPending || updateMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsDialogOpen(false)} />
            <ModernModalSubmitButton
              form="product-form"
              type="submit"
              onClick={() => {
                const el = document.getElementById("product-form") as HTMLFormElement
                if (el) el.requestSubmit()
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save Product
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form
          id="product-form"
          onSubmit={form.handleSubmit(
            (data) => onSubmit(data as any),
            (errors) => {
              console.error("Product form validation errors:", errors)
              const firstError = Object.values(errors)[0] as any
              if (firstError?.message) {
                toast.error(`Form error: ${firstError.message}`)
              } else {
                toast.error("Please fill in required fields correctly.")
              }
            }
          )}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <ModernInput
                label="Product Name"
                placeholder="e.g. Honda Click 125i"
                {...form.register("name")}
                error={form.formState.errors.name?.message}
                required
              />
            </div>

            <ModernSelect
              label="Category"
              placeholder="Select Category..."
              value={form.watch("categoryId")}
              onChange={(val) => form.setValue("categoryId", val)}
              options={
                categoriesData?.items.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                })) || []
              }
              searchable
            />

            <ModernSelect
              label="Brand"
              placeholder="Select Brand..."
              value={form.watch("brandId")}
              onChange={(val) => form.setValue("brandId", val)}
              options={
                brandsData?.items.map((brand) => ({
                  value: brand.id,
                  label: brand.name,
                })) || []
              }
              searchable
            />

            <ModernInput
              label="Model"
              placeholder="e.g. 2024 Edition"
              {...form.register("model")}
            />

            <ModernInput
              label="Serial Number"
              placeholder="e.g. SN-987654"
              {...form.register("serialNumber")}
            />

            <ModernInput
              label="Cost / Base Price"
              type="number"
              step="0.01"
              {...form.register("basePrice")}
              error={form.formState.errors.basePrice?.message}
              required
            />

            <ModernInput
              label="Selling Price"
              type="number"
              step="0.01"
              {...form.register("sellPrice")}
              error={form.formState.errors.sellPrice?.message}
              required
            />

            <ModernSelect
              label="Currency"
              value={form.watch("currency")}
              onChange={(val) => form.setValue("currency", val as any)}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "KHR", label: "KHR (៛)" },
                { value: "THB", label: "THB (฿)" },
              ]}
            />

            <ModernSelect
              label="Condition"
              value={form.watch("condition")}
              onChange={(val) => form.setValue("condition", val as any)}
              options={[
                { value: "NEW", label: "New" },
                { value: "USED", label: "Used" },
                { value: "REFURBISHED", label: "Refurbished" },
              ]}
            />

            <ModernSelect
              label="Inventory Status"
              value={form.watch("status")}
              onChange={(val) => form.setValue("status", val as any)}
              options={[
                { value: "AVAILABLE", label: "Available" },
                { value: "RESERVED", label: "Reserved" },
                { value: "SOLD", label: "Sold" },
              ]}
            />

            <ModernInput
              label="Manufacture Year"
              type="number"
              placeholder="e.g. 2024"
              {...form.register("year")}
            />

            {/* Product Image Selection & S3 Upload Section */}
            <div className="md:col-span-2 space-y-2 border-t pt-3 mt-1 dark:border-slate-800">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-sky-500" /> Product Image & Media Asset
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                {/* Image Preview Stage */}
                <div className="sm:col-span-3 h-24 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center relative group">
                  {form.watch("imageUrl") ? (
                    <>
                      <img
                        src={form.watch("imageUrl")}
                        alt="Product Preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => form.setValue("imageUrl", "")}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                        title="Remove Image"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-2 text-slate-400 space-y-1">
                      <ImageIcon className="h-6 w-6 mx-auto opacity-50" />
                      <span className="text-[10px] block">No Image</span>
                    </div>
                  )}
                </div>

                {/* Upload & Choose Options */}
                <div className="sm:col-span-9 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Option A: Upload File to AWS S3 */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 text-xs font-bold gap-1.5 bg-sky-500/10 text-sky-600 border-sky-500/30 hover:bg-sky-500/20 dark:text-sky-400"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading to S3...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" /> Upload to AWS S3
                        </>
                      )}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDirectFileUpload}
                    />

                    {/* Option B: Choose from Attachments */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="h-8 text-xs font-bold gap-1.5 bg-purple-500/10 text-purple-600 border-purple-500/30 hover:bg-purple-500/20 dark:text-purple-400"
                    >
                      <FolderOpen className="h-3.5 w-3.5" /> Choose from Attachments
                    </Button>
                  </div>

                  {/* Option C: Direct Image URL */}
                  <ModernInput
                    placeholder="Or enter public image URL (https://...)"
                    value={form.watch("imageUrl") || ""}
                    onChange={(e) => form.setValue("imageUrl", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <ModernTextarea
                label="Description"
                rows={3}
                placeholder="Product details, specs, notes..."
                {...form.register("description")}
              />
            </div>

            <div className="md:col-span-2">
              <ModernInput
                label="Internal Notes"
                placeholder="Internal maintenance notes..."
                {...form.register("notes")}
              />
            </div>

            <div className="pt-2 md:col-span-2">
              <ModernSwitch
                label="Active Product Status"
                showStatusBadge
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
              />
            </div>
          </div>
        </form>
      </ModernModal>

      {/* Batch Product Import Modal */}
      <ModernModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        title="Batch Import Products & Stock"
        subtitle="Import multiple serialized units (phones, motorbikes, vehicles) with automatic duplicate checking."
        icon={<ListPlus className="h-5 w-5 text-sky-500" />}
        size="2xl"
        isLoading={batchImportMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsBatchImportOpen(false)} />
            <ModernModalSubmitButton
              onClick={handleBatchSubmit}
              isLoading={batchImportMutation.isPending}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold"
            >
              Import {batchRows.length} Product Unit(s)
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <div className="space-y-4 py-2">
          {/* Defaults Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <ModernSelect
              label="Default Brand"
              placeholder="-- Select Brand --"
              value={batchDefaultBrandId}
              onChange={(val) => setBatchDefaultBrandId(val)}
              options={
                brandsData?.items.map((b) => ({
                  value: b.id,
                  label: b.name,
                })) || []
              }
              searchable
            />

            <ModernSelect
              label="Default Category"
              placeholder="-- Select Category --"
              value={batchDefaultCategoryId}
              onChange={(val) => setBatchDefaultCategoryId(val)}
              options={
                categoriesData?.items.map((c) => ({
                  value: c.id,
                  label: c.name,
                })) || []
              }
              searchable
            />

            <ModernSelect
              label="Default Currency"
              value={batchDefaultCurrency}
              onChange={(val) => setBatchDefaultCurrency(val as string)}
              options={[
                { value: "USD", label: "USD ($)" },
                { value: "KHR", label: "KHR (៛)" },
                { value: "THB", label: "THB (฿)" },
              ]}
            />
          </div>

          {/* Batch Import Result Report */}
          {batchImportResult && (
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-sky-500" />
                  <span>Batch Import Execution Summary</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-emerald-500/20">
                    Succeeded: {batchImportResult.successCount}
                  </Badge>
                  {batchImportResult.failedCount > 0 && (
                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border-rose-500/20">
                      Failed: {batchImportResult.failedCount}
                    </Badge>
                  )}
                </div>
              </div>

              {batchImportResult.errors && batchImportResult.errors.length > 0 && (
                <div className="space-y-2 border-t pt-2 dark:border-slate-800">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                    Validation Errors Report:
                  </span>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-xs">
                    <table className="w-full text-left">
                      <thead className="border-b border-rose-200 dark:border-rose-900/50 font-bold text-rose-700 dark:text-rose-300">
                        <tr>
                          <th className="p-2">Item #</th>
                          <th className="p-2">Serial Number</th>
                          <th className="p-2">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 dark:divide-rose-900/30">
                        {batchImportResult.errors.map((err: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2 font-mono font-bold">#{err.index + 1}</td>
                            <td className="p-2 font-mono">{err.serialNumber || "N/A"}</td>
                            <td className="p-2 text-rose-600 dark:text-rose-400">{err.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Rows Form */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Item Line Entries ({batchRows.length} Rows)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBatchRow}
                  className="h-7 text-xs font-bold text-sky-600 gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Row
                </Button>
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 p-2 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
              {batchRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 items-center shadow-xs"
                >
                  <div className="sm:col-span-3">
                    <Input
                      placeholder="Product Name *"
                      value={row.name}
                      onChange={(e) => updateBatchRow(row.id, "name", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      placeholder="Model"
                      value={row.model}
                      onChange={(e) => updateBatchRow(row.id, "model", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      placeholder="Serial / VIN / IMEI *"
                      value={row.serialNumber}
                      onChange={(e) => updateBatchRow(row.id, "serialNumber", e.target.value)}
                      className="text-xs h-8 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      placeholder="Sell Price"
                      value={row.sellPrice || ""}
                      onChange={(e) => updateBatchRow(row.id, "sellPrice", e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <select
                      value={row.condition}
                      onChange={(e) => updateBatchRow(row.id, "condition", e.target.value)}
                      className="text-xs h-8 w-full rounded-md border border-input bg-background px-1"
                    >
                      <option value="NEW">New</option>
                      <option value="USED">Used</option>
                      <option value="REFURBISHED">Refurb</option>
                    </select>
                  </div>
                  <div className="sm:col-span-1 text-right">
                    {batchRows.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBatchRow(row.id)}
                        className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModernModal>

      {/* View Product Details Modal */}
      <ModernModal
        isOpen={!!selectedProductDetails}
        onClose={() => setSelectedProductDetails(null)}
        title={selectedProductDetails?.name || "Product Details"}
        subtitle={`Model: ${selectedProductDetails?.model || "N/A"} • S/N: ${selectedProductDetails?.serialNumber || "N/A"}`}
        icon={<Package className="h-5 w-5 text-sky-500" />}
        size="xl"
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setSelectedProductDetails(null)}>
              Close
            </ModernModalCancelButton>
            {selectedProductDetails && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const p = selectedProductDetails
                  setSelectedProductDetails(null)
                  openLoanWizard({
                    productId: p.id,
                    productName: p.name,
                    sellPrice: p.sellPrice || p.basePrice || 0,
                  })
                }}
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-bold text-xs gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                + Originate Loan for Asset
              </Button>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                const p = selectedProductDetails
                setSelectedProductDetails(null)
                if (p) openEdit(p)
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Product
            </Button>
          </ModernModalFooter>
        }
      >
        {selectedProductDetails && (
          <div className="space-y-6 py-2">
            {/* Hero Showcase Header Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-slate-950 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs items-center">
              {/* Product Image Stage */}
              <div className="md:col-span-5 h-56 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden flex items-center justify-center relative shadow-sm group">
                {selectedProductDetails.imageUrl ? (
                  <img
                    src={selectedProductDetails.imageUrl}
                    alt={selectedProductDetails.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center p-4 text-slate-300 dark:text-slate-600 space-y-2">
                    <Package className="h-16 w-16 mx-auto opacity-40" />
                    <span className="text-xs font-bold block uppercase tracking-wider">No Image Uploaded</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <Badge variant={selectedProductDetails.condition === "NEW" ? "default" : "secondary"} className="text-xs px-2.5 py-0.5 font-bold shadow-xs">
                    {selectedProductDetails.condition || "NEW"}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadgeCell status={selectedProductDetails.status || "AVAILABLE"} type="account" />
                </div>
              </div>

              {/* Header Titles & Key Stats */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-50 dark:bg-sky-950/40">
                      Catalog Asset Item
                    </Badge>
                    <Badge variant={selectedProductDetails.isActive ? "default" : "outline"} className="text-[10px]">
                      {selectedProductDetails.isActive ? "Active Status" : "Inactive"}
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {selectedProductDetails.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    {selectedProductDetails.model && (
                      <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                        Model: {selectedProductDetails.model}
                      </span>
                    )}
                    {selectedProductDetails.serialNumber && (
                      <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 font-bold">
                        S/N: {selectedProductDetails.serialNumber}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {selectedProductDetails.brandId && brandMap.get(selectedProductDetails.brandId) && (
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Bookmark className="h-3.5 w-3.5 text-sky-500" />
                      Brand: {brandMap.get(selectedProductDetails.brandId)}
                    </span>
                  )}
                  {selectedProductDetails.categoryId && categoryMap.get(selectedProductDetails.categoryId) && (
                    <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Tags className="h-3.5 w-3.5 text-purple-500" />
                      Category: {categoryMap.get(selectedProductDetails.categoryId)}
                    </span>
                  )}
                </div>

                {/* Financial Summary Highlight Grid */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Retail Price</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {selectedProductDetails.currency || "$"} {(selectedProductDetails.sellPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Base Unit Cost</span>
                    <span className="text-base font-extrabold text-slate-700 dark:text-slate-300 mt-0.5 block">
                      {selectedProductDetails.currency || "$"} {(selectedProductDetails.basePrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gross Profit</span>
                    <span className="text-base font-extrabold text-sky-600 dark:text-sky-400 mt-0.5 block">
                      {selectedProductDetails.currency || "$"} {((selectedProductDetails.sellPrice || 0) - (selectedProductDetails.basePrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description & Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-sky-500" /> Catalog Specification & Details
                </span>
                <div className="space-y-2 text-xs bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between py-1 border-b dark:border-slate-800">
                    <span className="text-slate-500">Model Name:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedProductDetails.model || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b dark:border-slate-800">
                    <span className="text-slate-500">Serial / VIN / IMEI:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedProductDetails.serialNumber || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b dark:border-slate-800">
                    <span className="text-slate-500">Manufacture Year:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedProductDetails.year || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Inventory Status:</span>
                    <StatusBadgeCell status={selectedProductDetails.status || "AVAILABLE"} type="account" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-purple-500" /> Description & Maintenance Notes
                </span>
                <div className="space-y-2 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[80px]">
                    <span className="font-bold text-slate-500 text-[10px] block uppercase">Product Overview</span>
                    <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                      {selectedProductDetails.description || "No description provided for this catalog asset."}
                    </p>
                  </div>
                  {selectedProductDetails.notes && (
                    <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-[10px] block uppercase">Internal Notes</span>
                      <p className="text-amber-800 dark:text-amber-200 mt-0.5 text-xs font-medium">
                        {selectedProductDetails.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </ModernModal>

      <MediaPickerModal
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        multiple={false}
        title="Select Product Image Asset"
        description="Pick an image from existing attachments or upload a new file directly to S3."
        onSelect={async (selected) => {
          if (selected.length > 0) {
            const att = selected[0]
            let url = att.fileUrl || ""
            if (!url || !url.startsWith("http")) {
              try {
                const res = await storageApi.getDownloadUrl(att.fileKey)
                if (res?.downloadUrl) {
                  url = res.downloadUrl
                }
              } catch (ignored) {}
            }
            if (!url) {
              url = fileUrl(att.fileKey) || ""
            }
            form.setValue("imageUrl", url)
            toast.success(`Selected ${att.fileName}`)
          }
        }}
      />
    </div>
  )
}

// ============================================================
// 2. CATEGORIES TAB
// ============================================================

function CategoriesTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ["categories", { page, pageSize, search }],
    queryFn: () => categoriesApi.list({ page, limit: pageSize, search }),
  })

  // All categories for parent dropdown lookup
  const { data: allCategoriesData } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => categoriesApi.list({ limit: 100 }),
  })

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>()
    allCategoriesData?.items.forEach((c) => map.set(c.id, c.name))
    return map
  }, [allCategoriesData])

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema as any),
    defaultValues: {
      name: "",
      description: "",
      color: "#3b82f6",
      parentId: "",
      imageUrl: "",
      sortOrder: 0,
    },
  })

  const createMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      toast.success("Category created successfully")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories-all"] })
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Category> }) =>
      categoriesApi.update(id, body),
    onSuccess: () => {
      toast.success("Category updated successfully")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories-all"] })
      setIsDialogOpen(false)
      setEditingCategory(null)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.remove,
    onSuccess: () => {
      toast.success("Category deleted")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      queryClient.invalidateQueries({ queryKey: ["categories-all"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openCreate = () => {
    setEditingCategory(null)
    form.reset({
      name: "",
      description: "",
      color: "#3b82f6",
      parentId: "",
      imageUrl: "",
      sortOrder: 0,
    })
    setIsDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    form.reset({
      name: cat.name || "",
      description: cat.description || "",
      color: cat.color || "#3b82f6",
      parentId: cat.parentId || "",
      imageUrl: cat.imageUrl || "",
      sortOrder: cat.sortOrder ?? 0,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = (values: CategoryFormValues) => {
    const payload = {
      ...values,
      parentId: values.parentId ? values.parentId : null,
    }
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, body: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const toggleActive = (cat: Category) => {
    updateMutation.mutate({
      id: cat.id,
      body: {
        ...cat,
        isActive: !cat.isActive,
      },
    })
  }

  const columns: ColumnDef<Category>[] = [
    {
      id: "name",
      header: "Category Name",
      accessorKey: "name",
      sortable: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium text-xs text-foreground">
          <span
            className="h-3 w-3 rounded-full shrink-0 border"
            style={{ backgroundColor: row.color || "#3b82f6" }}
          />
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      id: "parent",
      header: "Parent Category",
      accessorKey: "parentId",
      cell: ({ row }) =>
        row.parentId && categoryMap.has(row.parentId) ? (
          <Badge variant="outline" className="text-xs">
            {categoryMap.get(row.parentId)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Main Category</span>
        ),
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ value }) => <span className="text-xs text-muted-foreground">{value || "—"}</span>,
    },
    {
      id: "sortOrder",
      header: "Sort Order",
      accessorKey: "sortOrder",
      sortable: true,
      cell: ({ value }) => <Badge variant="secondary" className="text-xs">{value ?? 0}</Badge>,
    },
    {
      id: "isActive",
      header: "Active Status",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <Switch
          checked={row.isActive ?? true}
          onCheckedChange={() => toggleActive(row)}
        />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable<Category>
        data={categoriesData?.items || []}
        columns={columns}
        getRowId={(c) => c.id}
        title="Product Categories"
        searchPlaceholder="Search category name, description..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        createButtonLabel="Add Category"
        onCreateNew={openCreate}
        manualPagination={true}
        totalCount={categoriesData?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        onEditRow={openEdit}
        onDeleteRow={(c) => deleteMutation.mutate(c.id)}
        exportFilename="product-categories"
      />

      <ModernModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingCategory ? "Edit Category" : "Create Category"}
        subtitle={editingCategory ? "Update category parameters." : "Add a category to organize your products."}
        icon={<Tags className="h-5 w-5" />}
        size="md"
        isLoading={createMutation.isPending || updateMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsDialogOpen(false)} />
            <ModernModalSubmitButton
              form="category-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save Category
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="category-form" onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
          <ModernInput
            label="Category Name"
            placeholder="e.g. Motorcycles, Accessories..."
            {...form.register("name")}
            error={form.formState.errors.name?.message}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs text-foreground tracking-wide">Badge / Theme Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-11 w-14 rounded-xl border border-slate-200 cursor-pointer p-1 bg-slate-50 dark:bg-slate-900 dark:border-slate-800 shrink-0"
                  value={form.watch("color") || "#3b82f6"}
                  onChange={(e) => form.setValue("color", e.target.value)}
                />
                <ModernInput
                  placeholder="#3b82f6"
                  {...form.register("color")}
                />
              </div>
            </div>

            <ModernInput
              label="Sort Order"
              type="number"
              {...form.register("sortOrder")}
            />
          </div>

          <ModernSelect
            label="Parent Category"
            placeholder="None (Top-Level Category)"
            value={form.watch("parentId")}
            onChange={(val) => form.setValue("parentId", val)}
            options={[
              { value: "", label: "None (Top-Level Category)" },
              ...(allCategoriesData?.items
                ?.filter((c) => c.id !== editingCategory?.id)
                .map((c) => ({
                  value: c.id,
                  label: c.name,
                })) || []),
            ]}
            searchable
          />

          <ModernInput
            label="Image URL"
            placeholder="https://..."
            {...form.register("imageUrl")}
          />

          <ModernTextarea
            label="Description"
            rows={3}
            placeholder="Category overview..."
            {...form.register("description")}
          />

          <div className="pt-2">
            <ModernSwitch
              label="Active Category Status"
              showStatusBadge
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
          </div>
        </form>
      </ModernModal>
    </div>
  )
}

// ============================================================
// 3. BRANDS TAB
// ============================================================

function BrandsTab() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)

  const { data: brandsData, isLoading } = useQuery({
    queryKey: ["brands", { page, pageSize, search }],
    queryFn: () => brandsApi.list({ page, limit: pageSize, search }),
  })

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema as any),
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      isActive: true,
    },
  })

  const createMutation = useMutation({
    mutationFn: brandsApi.create,
    onSuccess: () => {
      toast.success("Brand created successfully")
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brands-all"] })
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Brand> }) =>
      brandsApi.update(id, body),
    onSuccess: () => {
      toast.success("Brand updated successfully")
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brands-all"] })
      setIsDialogOpen(false)
      setEditingBrand(null)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: brandsApi.remove,
    onSuccess: () => {
      toast.success("Brand deleted")
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      queryClient.invalidateQueries({ queryKey: ["brands-all"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openCreate = () => {
    setEditingBrand(null)
    form.reset({
      name: "",
      description: "",
      logoUrl: "",
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand)
    form.reset({
      name: brand.name || "",
      description: brand.description || "",
      logoUrl: brand.logoUrl || "",
      isActive: brand.isActive ?? true,
    })
    setIsDialogOpen(true)
  }

  const onSubmit = (values: BrandFormValues) => {
    if (editingBrand) {
      updateMutation.mutate({ id: editingBrand.id, body: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const toggleActive = (brand: Brand) => {
    updateMutation.mutate({
      id: brand.id,
      body: {
        ...brand,
        isActive: !brand.isActive,
      },
    })
  }

  const columns: ColumnDef<Brand>[] = [
    {
      id: "name",
      header: "Brand Name",
      accessorKey: "name",
      sortable: true,
      cell: ({ row }) => (
        <UserDetailCell
          name={row.name}
          subtitle={`ID: ${row.id}`}
          avatarUrl={row.logoUrl}
        />
      ),
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ value }) => <span className="text-xs text-muted-foreground">{value || "—"}</span>,
    },
    {
      id: "isActive",
      header: "Active",
      accessorKey: "isActive",
      cell: ({ row }) => (
        <Switch checked={row.isActive} onCheckedChange={() => toggleActive(row)} />
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable<Brand>
        data={brandsData?.items || []}
        columns={columns}
        getRowId={(b) => b.id}
        title="Product Brands"
        searchPlaceholder="Search brand name..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        createButtonLabel="Add Brand"
        onCreateNew={openCreate}
        manualPagination={true}
        totalCount={brandsData?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        onEditRow={openEdit}
        onDeleteRow={(b) => deleteMutation.mutate(b.id)}
        exportFilename="product-brands"
      />

      <ModernModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingBrand ? "Edit Brand" : "Create Brand"}
        subtitle={editingBrand ? "Update brand details and logo." : "Add a brand to attach to your products."}
        icon={<Bookmark className="h-5 w-5" />}
        size="md"
        isLoading={createMutation.isPending || updateMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsDialogOpen(false)} />
            <ModernModalSubmitButton
              form="brand-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save Brand
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="brand-form" onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
          <ModernInput
            label="Brand Name"
            placeholder="e.g. Honda, Yamaha, Apple..."
            {...form.register("name")}
            error={form.formState.errors.name?.message}
            required
          />

          <ModernInput
            label="Logo URL"
            placeholder="https://..."
            {...form.register("logoUrl")}
          />

          <ModernTextarea
            label="Description"
            rows={3}
            placeholder="Brand overview..."
            {...form.register("description")}
          />

          <div className="pt-2">
            <ModernSwitch
              label="Active Brand Status"
              showStatusBadge
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
          </div>
        </form>
      </ModernModal>
    </div>
  )
}
