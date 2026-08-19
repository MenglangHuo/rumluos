"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customersApi, uploadFile, fileUrl } from "@/lib/api/endpoints"
import { Customer, CustomerDocument } from "@/lib/types"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuickActions } from "@/components/quick-action-modal-context"
import { RowAction } from "@/components/ui-custom/data-table"
import {
  Plus,
  Loader2,
  Phone,
  Mail,
  MapPin,
  IdCard,
  User as UserIcon,
  ExternalLink,
  Zap,
  Upload,
  FileText,
  Trash2,
  Paperclip,
  FileCheck,
  Building,
  Briefcase,
  ShieldCheck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DataTable,
  ColumnDef,
  UserDetailCell,
  StatusBadgeCell,
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
  ModernDatePicker,
  ModernSwitch,
} from "@/components/ui-custom/form-controls"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().optional(),
  industry: z.string().optional(),
  customerGroup: z.string().optional(),
  occupation: z.string().optional(),
  preferredCurrency: z.string().default("USD"),
  isActive: z.boolean().default(true),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationalId: z.string().optional(),
})

const DOC_TYPES = [
  { value: "ID_CARD", label: "National ID Card / Passport" },
  { value: "HOME_BOOK", label: "Home Book / Family Book" },
  { value: "PAYROLL", label: "Payroll / Salary Slip" },
  { value: "BANK_STATEMENT", label: "Bank Statement (3-6 Mos)" },
  { value: "INCOME_PROOF", label: "Income Proof / Business License" },
  { value: "COLLATERAL_DOC", label: "Land Title / Collateral Cert" },
  { value: "OTHER", label: "Other Supporting Document" },
]

export default function CustomersPage() {
  const router = useRouter()
  const { openLoanWizard, openQuickPay } = useQuickActions()

  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null)

  // Document Upload State inside modal
  const [documents, setDocuments] = useState<CustomerDocument[]>([])
  const [selectedDocType, setSelectedDocType] = useState<string>("ID_CARD")
  const [uploadingDoc, setUploadingDoc] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["customers", { page, pageSize, search }],
    queryFn: () => customersApi.list({ page, limit: pageSize, search }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      industry: "",
      customerGroup: "",
      occupation: "",
      preferredCurrency: "USD",
      isActive: true,
      dateOfBirth: "",
      gender: "male",
      nationalId: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: (body: Partial<Customer>) => customersApi.create(body),
    onSuccess: () => {
      toast.success("Customer created successfully with documents")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      setIsDialogOpen(false)
      form.reset()
      setDocuments([])
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Customer> }) =>
      customersApi.update(id, body),
    onSuccess: () => {
      toast.success("Customer updated successfully")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      setIsDialogOpen(false)
      setEditingCustomer(null)
      form.reset()
      setDocuments([])
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      toast.success("Customer deleted")
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      setDeletingCustomerId(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openCreate = () => {
    setEditingCustomer(null)
    setDocuments([])
    form.reset({
      name: "",
      email: "",
      phone: "",
      address: "",
      industry: "",
      customerGroup: "",
      occupation: "",
      preferredCurrency: "USD",
      isActive: true,
      dateOfBirth: "",
      gender: "male",
      nationalId: "",
    })
    setIsDialogOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setDocuments(customer.documents || [])
    form.reset({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      industry: customer.industry || "",
      customerGroup: customer.customerGroup || "",
      occupation: customer.occupation || "",
      preferredCurrency: customer.preferredCurrency || "USD",
      isActive: customer.isActive ?? customer.active ?? true,
      dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split("T")[0] : "",
      gender: customer.gender || "male",
      nationalId: customer.nationalId || "",
    })
    setIsDialogOpen(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingDoc(true)
      const fileKey = await uploadFile(file)
      const newDoc: CustomerDocument = {
        id: `doc_${Date.now()}`,
        fileKey,
        fileName: file.name,
        docType: selectedDocType,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        createdAt: new Date().toISOString(),
      }
      setDocuments((prev) => [...prev, newDoc])
      toast.success(`Attached ${file.name}`)
    } catch (err) {
      toast.error("Failed to upload document")
    } finally {
      setUploadingDoc(false)
      e.target.value = ""
    }
  }

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      active: values.isActive,
      email: values.email || undefined,
      dateOfBirth: values.dateOfBirth || null,
      documents,
    }

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, body: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const toggleActive = (customer: Customer) => {
    const nextVal = !(customer.isActive ?? customer.active ?? true)
    updateMutation.mutate({
      id: customer.id,
      body: {
        ...customer,
        isActive: nextVal,
        active: nextVal,
      },
    })
  }

  const columns: ColumnDef<Customer>[] = [
    {
      id: "name",
      header: "Customer",
      accessorKey: "name",
      sortable: true,
      cell: ({ row }) => (
        <Link href={`/customers/${row.id}`} className="hover:underline">
          <UserDetailCell
            name={row.name}
            subtitle={row.occupation || row.customerGroup || "View Profile"}
          />
        </Link>
      ),
    },
    {
      id: "contact",
      header: "Contact",
      accessorFn: (row) => `${row.phone || ""} ${row.email || ""}`,
      sortable: true,
      cell: ({ row }) => (
        <div className="space-y-0.5">
          {row.phone && (
            <div className="flex items-center text-xs font-medium gap-1.5 text-foreground">
              <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <Mail className="h-3 w-3 shrink-0" />
              <span>{row.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "nationalId",
      header: "ID Info",
      accessorKey: "nationalId",
      sortable: true,
      cell: ({ value }) =>
        value ? (
          <div className="flex items-center text-xs gap-1.5 text-foreground/80 font-mono">
            <IdCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{value}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "documents",
      header: "KYC Docs",
      accessorFn: (row) => row.documents?.length || 0,
      cell: ({ row }) => {
        const count = row.documents?.length || 0
        if (count === 0) return <span className="text-xs text-slate-400 italic">No files</span>
        return (
          <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
            <Paperclip className="h-3 w-3 mr-1 shrink-0" />
            {count} Document{count > 1 ? "s" : ""}
          </Badge>
        )
      },
    },
    {
      id: "address",
      header: "Location",
      accessorKey: "address",
      sortable: true,
      cell: ({ value }) =>
        value ? (
          <div className="flex items-center text-xs gap-1.5 text-foreground/80">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[200px]">{value}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "isActive",
      header: "Status",
      accessorKey: "isActive",
      sortable: true,
      filterType: "select",
      filterOptions: [
        { label: "Active", value: true },
        { label: "Inactive", value: false },
      ],
      cell: ({ value, row }) => {
        const isAct = value ?? row.active ?? true
        return (
          <Switch
            checked={isAct}
            onCheckedChange={() => toggleActive(row)}
          />
        )
      },
    },
  ]

  const customerActions: RowAction<Customer>[] = [
    {
      label: "View Profile",
      icon: <ExternalLink className="h-3.5 w-3.5 text-sky-500" />,
      onClick: (customer) => router.push(`/customers/${customer.id}`),
    },
    {
      label: "+ Originate Loan",
      icon: <Plus className="h-3.5 w-3.5 text-emerald-500" />,
      onClick: (customer) => openLoanWizard({ customerId: customer.id }),
    },
    {
      label: "⚡ Collect Payment",
      icon: <Zap className="h-3.5 w-3.5 text-amber-500 fill-current" />,
      onClick: (customer) => openQuickPay({ customerId: customer.id }),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Custom Data Table Component */}
      <DataTable<Customer>
        data={data?.items || []}
        columns={columns}
        getRowId={(c) => c.id}
        title="Customers"
        searchPlaceholder="Search customers by name, phone, ID..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        createButtonLabel="Add Customer"
        onCreateNew={openCreate}
        manualPagination={true}
        totalCount={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        onEditRow={openEdit}
        onDeleteRow={(c) => setDeletingCustomerId(c.id)}
        customRowActions={customerActions}
        exportFilename="customers-list"
      />

      <ModernModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingCustomer ? "Edit Customer Profile" : "Register New Customer"}
        subtitle={editingCustomer ? "Update customer profile, KYC details and attached verification documents." : "Fill in customer details and attach required verification files (ID, Homebook, Payroll)."}
        icon={<UserIcon className="h-5 w-5 text-emerald-500" />}
        size="lg"
        isLoading={createMutation.isPending || updateMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsDialogOpen(false)} />
            <ModernModalSubmitButton
              form="customer-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCustomer ? "Save Changes" : "Create Customer"}
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="customer-form" onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="size-3.5" /> Personal Information
            </h4>
            <ModernInput
              label="Full Name"
              placeholder="e.g. Sokha Chan"
              leftIcon={<UserIcon className="size-4" />}
              {...form.register("name")}
              error={form.formState.errors.name?.message}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <ModernSelect
                label="Gender"
                value={form.watch("gender")}
                onChange={(val) => form.setValue("gender", val as any)}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                ]}
              />

              <ModernDatePicker
                label="Date of Birth"
                value={form.watch("dateOfBirth")}
                onChange={(date) => form.setValue("dateOfBirth", date)}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="size-3.5" /> Contact Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <ModernInput
                label="Phone Number"
                placeholder="+855 12 345 678"
                leftIcon={<Phone className="size-4" />}
                {...form.register("phone")}
                error={form.formState.errors.phone?.message}
                required
              />
              <ModernInput
                label="Email Address"
                placeholder="sokha.chan@example.com"
                leftIcon={<Mail className="size-4" />}
                {...form.register("email")}
                error={form.formState.errors.email?.message}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Address Details
            </h4>
            <ModernInput
              label="Street Address / Village / Commune"
              placeholder="#123 St 271, Khan Sen Sok, Phnom Penh"
              leftIcon={<MapPin className="size-4" />}
              {...form.register("address")}
            />
          </div>

          {/* Identity & Work Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <IdCard className="size-3.5" /> Identity & Employment Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <ModernInput
                label="National ID / Passport No."
                placeholder="ID-019827364"
                leftIcon={<IdCard className="size-4" />}
                {...form.register("nationalId")}
              />
              <ModernInput
                label="Occupation"
                placeholder="Business Owner / Software Engineer"
                leftIcon={<Briefcase className="size-4" />}
                {...form.register("occupation")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ModernInput
                label="Industry"
                placeholder="Retail / Technology"
                leftIcon={<Building className="size-4" />}
                {...form.register("industry")}
              />
              <ModernInput
                label="Customer Group"
                placeholder="VIP / Regular"
                {...form.register("customerGroup")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <ModernInput
                label="Preferred Currency"
                placeholder="USD"
                {...form.register("preferredCurrency")}
              />
              <div className="pt-4">
                <ModernSwitch
                  label="Active Account Status"
                  showStatusBadge
                  checked={form.watch("isActive")}
                  onCheckedChange={(val) => form.setValue("isActive", val)}
                />
              </div>
            </div>
          </div>

          {/* Customer Files & Documents Section (Real Flow Feature) */}
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="size-4" /> Customer Verification Documents (KYC)
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Attach customer files like National ID, Homebook, Payroll slip, Bank statement, or Collateral documents.
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-900">
                {documents.length} File{documents.length === 1 ? "" : "s"}
              </Badge>
            </div>

            {/* Document Upload Control */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <ModernSelect
                    label="Document Category"
                    value={selectedDocType}
                    onChange={(val) => setSelectedDocType(val)}
                    options={DOC_TYPES}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-doc-upload" className="cursor-pointer block">
                    <div className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors">
                      {uploadingDoc ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" /> Choose & Upload
                        </>
                      )}
                    </div>
                  </Label>
                  <input
                    id="customer-doc-upload"
                    type="file"
                    className="hidden"
                    disabled={uploadingDoc}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Attached Files:
                  </span>
                  <div className="space-y-2">
                    {documents.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{doc.fileName}</p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">
                                {DOC_TYPES.find((t) => t.value === doc.docType)?.label || doc.docType}
                              </Badge>
                              {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {doc.fileKey && (
                            <a
                              href={fileUrl(doc.fileKey)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              <ExternalLink className="h-3 w-3" /> View
                            </a>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => removeDocument(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </ModernModal>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingCustomerId} onOpenChange={(open) => !open && setDeletingCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the customer record and associated verification files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingCustomerId && deleteMutation.mutate(deletingCustomerId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
