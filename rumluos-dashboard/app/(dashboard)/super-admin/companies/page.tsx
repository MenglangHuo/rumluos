"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { companiesApi, CompanyInput } from "@/lib/api/endpoints"
import { Company } from "@/lib/types"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Eye,
  Building2,
  GitBranch,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  FileText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DataTable,
  ColumnDef,
  StatusBadgeCell,
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
  ModernSwitch,
} from "@/components/ui-custom/form-controls"

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(5, "Phone is required"),
  address: z.string().min(2, "Address is required"),
  description: z.string(),
  enableBranch: z.boolean(),
  ownerUsername: z.string().optional(),
  ownerPassword: z.string().optional(),
})

export default function CompaniesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["companies", { page, pageSize, search }],
    queryFn: () => companiesApi.list({ page, limit: pageSize, search, includeDeleted: true }),
  })

  // Fetch detailed info for viewing modal
  const { data: detailedCompany } = useQuery({
    queryKey: ["company-detail", viewingCompany?.id],
    queryFn: () => (viewingCompany ? companiesApi.get(viewingCompany.id) : null),
    enabled: !!viewingCompany,
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      description: "",
      enableBranch: false,
      ownerUsername: "",
      ownerPassword: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: companiesApi.create,
    onSuccess: () => {
      toast.success("Company created successfully")
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CompanyInput> }) =>
      companiesApi.update(id, body),
    onSuccess: () => {
      toast.success("Company updated successfully")
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      setIsDialogOpen(false)
      setEditingCompany(null)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: companiesApi.remove,
    onSuccess: () => {
      toast.success("Company deleted")
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      if (viewingCompany) setViewingCompany(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const restoreMutation = useMutation({
    mutationFn: companiesApi.restore,
    onSuccess: () => {
      toast.success("Company restored")
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      if (viewingCompany) setViewingCompany(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: companiesApi.toggleActive,
    onSuccess: () => {
      toast.success("Company active status toggled")
      queryClient.invalidateQueries({ queryKey: ["companies"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openCreate = () => {
    setEditingCompany(null)
    form.reset({
      name: "", email: "", phone: "", address: "", description: "", enableBranch: false, ownerUsername: "", ownerPassword: ""
    })
    setIsDialogOpen(true)
  }

  const openEdit = (company: Company) => {
    setEditingCompany(company)
    form.reset({
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      description: company.description,
      enableBranch: company.enableBranch,
      ownerUsername: "",
      ownerPassword: "",
    })
    setIsDialogOpen(true)
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, body: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const toggleActive = (company: Company) => {
    toggleActiveMutation.mutate(company.id)
  }

  const companiesList = data?.items || []
  const totalCompanies = data?.total || 0
  const activeCompaniesCount = companiesList.filter((c) => c.active && !c.deletedAt).length
  const deletedCompaniesCount = companiesList.filter((c) => c.deletedAt).length
  const multiBranchCount = companiesList.filter((c) => c.enableBranch).length

  const columns: ColumnDef<Company>[] = [
    {
      id: "name",
      header: "Company Name",
      accessorKey: "name",
      sortable: true,
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <span>{row.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">ID: {row.id}</div>
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact Info",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex items-center text-xs font-medium gap-1.5 text-foreground">
            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{row.email}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground gap-1.5">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{row.phone}</span>
          </div>
        </div>
      ),
    },
    {
      id: "enableBranch",
      header: "Branches",
      accessorKey: "enableBranch",
      filterType: "select",
      filterOptions: [
        { label: "Enabled", value: true },
        { label: "Disabled", value: false },
      ],
      cell: ({ value }) =>
        value ? (
          <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200">
            Enabled
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-slate-500">
            Disabled
          </Badge>
        ),
    },
    {
      id: "status",
      header: "Status",
      accessorFn: (c) => (c.deletedAt ? "Deleted" : c.active ? "Active" : "Inactive"),
      cell: ({ row }) =>
        row.deletedAt ? (
          <StatusBadgeCell status="Deleted" customVariant="danger" />
        ) : (
          <div className="flex items-center gap-2">
            <Switch checked={row.active} onCheckedChange={() => toggleActive(row)} />
            <StatusBadgeCell status={row.active ? "Active" : "Inactive"} type="account" />
          </div>
        ),
    },
  ]

  const customActions: RowAction<Company>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-3.5 w-3.5 text-purple-600" />,
      onClick: (c) => setViewingCompany(c),
    },
    {
      label: "Restore",
      icon: <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />,
      hidden: (c) => !c.deletedAt,
      onClick: (c) => restoreMutation.mutate(c.id),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Companies</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalCompanies}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Registered tenants</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Companies</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCompaniesCount}</h3>
              <p className="text-xs text-emerald-600/80 font-medium mt-0.5">Operational</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Multi-Branch Tenants</p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{multiBranchCount}</h3>
              <p className="text-xs text-indigo-600/80 font-medium mt-0.5">Branches enabled</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <GitBranch className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Deleted / Inactive</p>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{deletedCompaniesCount}</h3>
              <p className="text-xs text-amber-600/80 font-medium mt-0.5">Soft-deleted</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <XCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reusable Data Table Component */}
      <DataTable<Company>
        data={companiesList}
        columns={columns}
        getRowId={(c) => c.id}
        title="Companies"
        searchPlaceholder="Search company name, email, phone..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        createButtonLabel="Add Company"
        onCreateNew={openCreate}
        manualPagination={true}
        totalCount={totalCompanies}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        onEditRow={(c) => !c.deletedAt && openEdit(c)}
        onDeleteRow={(c) => !c.deletedAt && deleteMutation.mutate(c.id)}
        customRowActions={customActions}
        exportFilename="companies-list"
      />

      {/* Create / Edit Modal */}
      <ModernModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingCompany ? "Edit Company" : "Create Company"}
        subtitle={editingCompany ? "Update company details." : "Add a new company to the system."}
        icon={<Building2 className="h-5 w-5" />}
        size="md"
        isLoading={createMutation.isPending || updateMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsDialogOpen(false)} />
            <ModernModalSubmitButton
              form="company-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save changes
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="company-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ModernInput
              label="Company Name"
              placeholder="Acme Corp"
              {...form.register("name")}
              error={form.formState.errors.name?.message}
              required
            />
            <ModernInput
              label="Email Address"
              type="email"
              placeholder="contact@company.com"
              leftIcon={<Mail className="size-4" />}
              {...form.register("email")}
              error={form.formState.errors.email?.message}
              required
            />
            <ModernInput
              label="Phone Number"
              placeholder="+1 234 567 890"
              leftIcon={<Phone className="size-4" />}
              {...form.register("phone")}
              error={form.formState.errors.phone?.message}
              required
            />
            <ModernInput
              label="Address"
              placeholder="Street 123, Phnom Penh"
              {...form.register("address")}
              error={form.formState.errors.address?.message}
              required
            />
          </div>
          
          <ModernTextarea
            label="Description"
            rows={2}
            placeholder="Company background and details..."
            {...form.register("description")}
          />
          
          <div className="pt-2">
            <ModernSwitch
              label="Enable Branch Management"
              checked={form.watch("enableBranch")}
              onCheckedChange={(checked) => form.setValue("enableBranch", checked)}
            />
          </div>

          {!editingCompany && (
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Initial Owner Account</h4>
              <div className="grid grid-cols-2 gap-4">
                <ModernInput
                  label="Owner Username"
                  placeholder="owner_admin"
                  {...form.register("ownerUsername")}
                />
                <ModernInput
                  label="Owner Password"
                  type="password"
                  placeholder="••••••••"
                  {...form.register("ownerPassword")}
                />
              </div>
            </div>
          )}
        </form>
      </ModernModal>

      {/* View Company Detail Modal */}
      <ModernModal
        isOpen={!!viewingCompany}
        onClose={() => setViewingCompany(null)}
        title="Company Operations Overview"
        subtitle={`Detailed metadata and stats for ${viewingCompany?.name}`}
        icon={<Building2 className="h-5 w-5 text-purple-600" />}
        size="lg"
        footer={
          <ModernModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (viewingCompany) openEdit(viewingCompany)
                setViewingCompany(null)
              }}
            >
              Edit Details
            </Button>
            <ModernModalCancelButton onClick={() => setViewingCompany(null)}>
              Close
            </ModernModalCancelButton>
          </ModernModalFooter>
        }
      >
        {viewingCompany && (
          <div className="space-y-6 py-2">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{viewingCompany.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <span>ID: {viewingCompany.id}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(viewingCompany.createdAt).toLocaleDateString()}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={viewingCompany.active ? "secondary" : "outline"}
                  className={viewingCompany.active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold" : ""}
                >
                  {viewingCompany.deletedAt ? "Soft Deleted" : viewingCompany.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-xs text-slate-500 font-medium">Branches</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {detailedCompany?.branchCount ?? (viewingCompany.enableBranch ? "Enabled" : "Disabled")}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-xs text-slate-500 font-medium">Staff Members</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {detailedCompany?.staffCount ?? "N/A"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <p className="text-xs text-slate-500 font-medium">User Accounts</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  {detailedCompany?.userCount ?? "N/A"}
                </p>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
                <p className="text-slate-900 dark:text-slate-100 font-medium">{viewingCompany.email}</p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </span>
                <p className="text-slate-900 dark:text-slate-100 font-medium">{viewingCompany.phone || "N/A"}</p>
              </div>

              <div className="space-y-1 col-span-2">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </span>
                <p className="text-slate-900 dark:text-slate-100 font-medium">{viewingCompany.address || "N/A"}</p>
              </div>

              <div className="space-y-1 col-span-2">
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Description
                </span>
                <p className="text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                  {viewingCompany.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>
        )}
      </ModernModal>
    </div>
  )
}
