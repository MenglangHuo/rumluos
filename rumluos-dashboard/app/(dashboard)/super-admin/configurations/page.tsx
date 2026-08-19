"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { configurationsApi, companiesApi, ConfigurationInput } from "@/lib/api/endpoints"
import { CompanyConfiguration, Company } from "@/lib/types"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  SlidersHorizontal,
  Building2,
  Code2,
  FileJson,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Trash2,
  Calendar,
  Filter,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

const formSchema = z.object({
  companyId: z.string().min(1, "Company is required"),
  configKey: z.string().min(2, "Configuration key is required"),
  description: z.string(),
  jsonValueString: z.string().min(2, "JSON object configuration is required"),
})

export default function ConfigurationsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<CompanyConfiguration | null>(null)
  const [viewingConfig, setViewingConfig] = useState<CompanyConfiguration | null>(null)
  const [copied, setCopied] = useState(false)
  const [jsonError, setJsonError] = useState<string | null>(null)

  // Fetch companies for dropdown filter
  const { data: companiesData } = useQuery({
    queryKey: ["companies-select"],
    queryFn: () => companiesApi.list({ limit: 100 }),
  })
  const companiesList = companiesData?.items || []

  // Fetch configurations
  const { data, isLoading } = useQuery({
    queryKey: ["configurations", { page, pageSize, search, companyId: selectedCompanyId }],
    queryFn: () =>
      configurationsApi.list({
        page,
        limit: pageSize,
        search,
        companyId: selectedCompanyId === "all" ? undefined : selectedCompanyId,
      }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyId: "",
      configKey: "",
      description: "",
      jsonValueString: "{\n  \n}",
    },
  })

  const createMutation = useMutation({
    mutationFn: (body: ConfigurationInput) => configurationsApi.create(body),
    onSuccess: () => {
      toast.success("Configuration created successfully")
      queryClient.invalidateQueries({ queryKey: ["configurations"] })
      setIsDialogOpen(false)
      form.reset()
      setJsonError(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ConfigurationInput> }) =>
      configurationsApi.update(id, body),
    onSuccess: () => {
      toast.success("Configuration updated successfully")
      queryClient.invalidateQueries({ queryKey: ["configurations"] })
      setIsDialogOpen(false)
      setEditingConfig(null)
      form.reset()
      setJsonError(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: configurationsApi.remove,
    onSuccess: () => {
      toast.success("Configuration deleted")
      queryClient.invalidateQueries({ queryKey: ["configurations"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openCreate = () => {
    setEditingConfig(null)
    form.reset({
      companyId: selectedCompanyId !== "all" ? selectedCompanyId : companiesList[0]?.id || "",
      configKey: "",
      description: "",
      jsonValueString: `{\n  "enabled": true,\n  "settings": {}\n}`,
    })
    setJsonError(null)
    setIsDialogOpen(true)
  }

  const openEdit = (config: CompanyConfiguration) => {
    setEditingConfig(config)
    form.reset({
      companyId: config.companyId,
      configKey: config.configKey,
      description: config.description || "",
      jsonValueString: JSON.stringify(config.configValue || {}, null, 2),
    })
    setJsonError(null)
    setIsDialogOpen(true)
  }

  const validateAndFormatJson = (val: string) => {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setJsonError("Configuration must be a valid JSON Object ({ ... })")
        return null
      }
      setJsonError(null)
      return parsed
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON syntax")
      return null
    }
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const parsedJson = validateAndFormatJson(values.jsonValueString)
    if (!parsedJson) return

    const payload: ConfigurationInput = {
      companyId: values.companyId,
      configKey: values.configKey,
      configValue: parsedJson,
      description: values.description,
    }

    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, body: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const copyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("JSON copied to clipboard")
  }

  const getCompanyName = (companyId: string) => {
    const comp = companiesList.find((c) => c.id === companyId)
    return comp ? comp.name : companyId
  }

  const configsList = data?.items || []
  const totalConfigs = data?.total || 0
  const uniqueCompanies = new Set(configsList.map((c) => c.companyId)).size

  const columns: ColumnDef<CompanyConfiguration>[] = [
    {
      id: "company",
      header: "Company",
      accessorFn: (c) => getCompanyName(c.companyId),
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            <span>{getCompanyName(row.companyId)}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">ID: {row.companyId}</div>
        </div>
      ),
    },
    {
      id: "configKey",
      header: "Config Key",
      accessorKey: "configKey",
      sortable: true,
      cell: ({ value }) => (
        <Badge variant="outline" className="font-mono text-xs bg-slate-50 dark:bg-slate-900 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
          <Code2 className="h-3 w-3 mr-1 text-purple-500" />
          {value}
        </Badge>
      ),
    },
    {
      id: "configValue",
      header: "JSON Configuration Object",
      cell: ({ row }) => {
        const keys = Object.keys(row.configValue || {})
        return (
          <div className="flex items-center gap-1.5 max-w-xs overflow-hidden text-ellipsis">
            <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-700 dark:text-slate-300 truncate">
              {JSON.stringify(row.configValue)}
            </span>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {keys.length} keys
            </Badge>
          </div>
        )
      },
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ value }) => (
        <span className="text-xs text-muted-foreground line-clamp-1">{value || "No description"}</span>
      ),
    },
    {
      id: "updatedAt",
      header: "Last Updated",
      accessorKey: "updatedAt",
      cell: ({ value }) => (
        <span className="text-xs text-muted-foreground">
          {value ? new Date(value).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
  ]

  const customActions: RowAction<CompanyConfiguration>[] = [
    {
      label: "View JSON",
      icon: <Eye className="h-3.5 w-3.5 text-purple-600" />,
      onClick: (c) => setViewingConfig(c),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & Company Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileJson className="h-6 w-6 text-purple-600" />
            Company Configurations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system settings and key-value JSON objects on a per-company basis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <Filter className="h-4 w-4 text-slate-400 ml-2" />
            <Select value={selectedCompanyId} onValueChange={(val) => { if (val) { setSelectedCompanyId(val); setPage(1); } }}>
              <SelectTrigger className="w-[200px] border-none shadow-none text-xs focus:ring-0">
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {companiesList.map((comp) => (
                  <SelectItem key={comp.id} value={comp.id}>
                    {comp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Config Entries</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalConfigs}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Stored configurations</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Code2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Configured Companies</p>
              <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{uniqueCompanies}</h3>
              <p className="text-xs text-indigo-600/80 font-medium mt-0.5">Active tenants with configs</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Format Standard</p>
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">JSON Key-Value Object</h3>
              <p className="text-xs text-emerald-600/80 font-medium mt-0.5">Validated JSON Schema</p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileJson className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable<CompanyConfiguration>
        data={configsList}
        columns={columns}
        getRowId={(c) => c.id}
        title="Company Configurations"
        searchPlaceholder="Search config key or description..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        createButtonLabel="Add Configuration"
        onCreateNew={openCreate}
        manualPagination={true}
        totalCount={totalConfigs}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        onEditRow={openEdit}
        onDeleteRow={(c) => deleteMutation.mutate(c.id)}
        customRowActions={customActions}
        exportFilename="company-configurations"
      />

      {/* Create / Edit Configuration Modal */}
      <ModernModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingConfig ? "Edit Configuration" : "New Company Configuration"}
        subtitle={editingConfig ? "Update configuration key and JSON value." : "Create a new key-value JSON configuration object."}
        icon={<FileJson className="h-5 w-5 text-purple-600" />}
        size="lg"
        isLoading={createMutation.isPending || updateMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsDialogOpen(false)} />
            <ModernModalSubmitButton
              form="config-form"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              Save Configuration
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="config-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target Company *</label>
              <Select
                value={form.watch("companyId")}
                onValueChange={(val) => val && form.setValue("companyId", val)}
                disabled={!!editingConfig}
              >
                <SelectTrigger className="h-10 text-xs">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companiesList.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ModernInput
              label="Config Key"
              placeholder="e.g. loan_policy, payment_gateway"
              {...form.register("configKey")}
              error={form.formState.errors.configKey?.message}
              required
            />
          </div>

          <ModernTextarea
            label="Description"
            rows={2}
            placeholder="Explain the purpose of this configuration key..."
            {...form.register("description")}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-purple-600" />
                JSON Object Value (Key-Value Object) *
              </label>
              {jsonError ? (
                <span className="text-[11px] text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="h-3 w-3" />
                  {jsonError}
                </span>
              ) : (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Valid JSON Object
                </span>
              )}
            </div>
            <textarea
              rows={8}
              className={`w-full font-mono text-xs p-3 rounded-xl border bg-slate-950 text-emerald-400 focus:outline-none focus:ring-2 ${
                jsonError ? "border-red-500 focus:ring-red-500/20" : "border-slate-800 focus:ring-purple-500/20"
              }`}
              placeholder='{\n  "key": "value"\n}'
              {...form.register("jsonValueString")}
              onChange={(e) => {
                form.setValue("jsonValueString", e.target.value)
                validateAndFormatJson(e.target.value)
              }}
            />
          </div>
        </form>
      </ModernModal>

      {/* View Formatted JSON Modal */}
      <ModernModal
        isOpen={!!viewingConfig}
        onClose={() => setViewingConfig(null)}
        title={`Configuration: ${viewingConfig?.configKey}`}
        subtitle={`Company: ${viewingConfig ? getCompanyName(viewingConfig.companyId) : ""}`}
        icon={<Code2 className="h-5 w-5 text-purple-600" />}
        size="md"
        footer={
          <ModernModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewingConfig && copyJson(viewingConfig.configValue)}
              className="gap-1.5 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy JSON"}
            </Button>
            <ModernModalCancelButton onClick={() => setViewingConfig(null)}>
              Close
            </ModernModalCancelButton>
          </ModernModalFooter>
        }
      >
        {viewingConfig && (
          <div className="space-y-4 py-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {viewingConfig.description || "No description available for this configuration entry."}
            </p>
            <div className="relative rounded-xl bg-slate-950 p-4 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80">
              <pre>{JSON.stringify(viewingConfig.configValue, null, 2)}</pre>
            </div>
          </div>
        )}
      </ModernModal>
    </div>
  )
}
