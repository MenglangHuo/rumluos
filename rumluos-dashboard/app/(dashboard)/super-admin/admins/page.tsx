"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminsApi, fileUrl } from "@/lib/api/endpoints"
import { User } from "@/lib/types"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  DataTable,
  ColumnDef,
  UserDetailCell,
} from "@/components/ui-custom/data-table"
import {
  ModernModal,
  ModernModalFooter,
  ModernModalCancelButton,
  ModernModalSubmitButton,
} from "@/components/ui-custom/modal"
import { ModernInput } from "@/components/ui-custom/form-controls"

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function AdminsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["admins", { page, pageSize, search }],
    queryFn: () => adminsApi.list({ page, limit: pageSize, search }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: adminsApi.create,
    onSuccess: () => {
      toast.success("System Admin created successfully")
      queryClient.invalidateQueries({ queryKey: ["admins"] })
      setIsDialogOpen(false)
      form.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openCreate = () => {
    form.reset()
    setIsDialogOpen(true)
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values)
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "admin",
      header: "Admin Details",
      accessorFn: (a) => `${a.firstName} ${a.lastName}`,
      sortable: true,
      cell: ({ row }) => (
        <UserDetailCell
          name={`${row.firstName} ${row.lastName}`}
          subtitle={`@${row.username}`}
          avatarUrl={fileUrl(row.avatarKey)}
        />
      ),
    },
    {
      id: "email",
      header: "Email Address",
      accessorKey: "email",
      sortable: true,
      cell: ({ value }) => <span className="text-xs font-medium text-foreground">{value}</span>,
    },
    {
      id: "role",
      header: "Role",
      cell: () => <Badge variant="default" className="bg-primary text-xs">Super Admin</Badge>,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Reusable Data Table */}
      <DataTable<User>
        data={data?.items || []}
        columns={columns}
        getRowId={(a) => a.id}
        title="System Admins"
        searchPlaceholder="Search admin name, username, email..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        createButtonLabel="Add Admin"
        onCreateNew={openCreate}
        manualPagination={true}
        totalCount={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        exportFilename="system-admins"
      />

      <ModernModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Register System Admin"
        subtitle="Create a new global super administrator account."
        icon={<ShieldAlert className="h-5 w-5" />}
        size="md"
        isLoading={createMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsDialogOpen(false)} />
            <ModernModalSubmitButton
              form="admin-form"
              isLoading={createMutation.isPending}
            >
              Create Admin
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="admin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ModernInput
              label="First Name"
              placeholder="John"
              {...form.register("firstName")}
              error={form.formState.errors.firstName?.message}
              required
            />
            <ModernInput
              label="Last Name"
              placeholder="Doe"
              {...form.register("lastName")}
              error={form.formState.errors.lastName?.message}
              required
            />
          </div>
          
          <ModernInput
            label="Username"
            placeholder="superadmin"
            {...form.register("username")}
            error={form.formState.errors.username?.message}
            required
          />

          <ModernInput
            label="Email Address"
            type="email"
            placeholder="admin@company.com"
            {...form.register("email")}
            error={form.formState.errors.email?.message}
            required
          />

          <ModernInput
            label="Password"
            type="password"
            placeholder="••••••••"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
            required
          />
        </form>
      </ModernModal>
    </div>
  )
}
