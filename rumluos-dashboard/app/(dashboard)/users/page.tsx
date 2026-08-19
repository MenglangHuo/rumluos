"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersApi, rolesApi, permissionsApi, fileUrl } from "@/lib/api/endpoints"
import { User } from "@/lib/types"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserCog, Key, Shield, ShieldCheck, ShieldAlert, UserCheck, UserX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DataTable,
  ColumnDef,
  UserDetailCell,
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
  ModernSwitch,
} from "@/components/ui-custom/form-controls"
import { RoleSelector } from "@/components/ui-custom/role-selector"
import { PermissionSelector } from "@/components/ui-custom/permission-selector"

const registerFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleIds: z.array(z.string()).min(1, "At least one role is required"),
})

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog state for Register User
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Dialog state for Edit User Roles & Status
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRoleIds, setEditRoleIds] = useState<string[]>([])
  const [editActiveStatus, setEditActiveStatus] = useState<boolean>(true)

  // Dialog state for Custom Direct Permissions
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [excludedPermissions, setExcludedPermissions] = useState<string[]>([])

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", { page, pageSize, search }],
    queryFn: () => usersApi.list({ page, limit: pageSize, search }),
  })

  const { data: rolesData } = useQuery({
    queryKey: ["roles-all"],
    queryFn: () => rolesApi.list({ limit: 100 }),
  })

  const { data: permissionsData = [] } = useQuery({
    queryKey: ["permissions"],
    queryFn: permissionsApi.list,
  })

  const registerForm = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      roleIds: [],
    },
  })

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      toast.success("User registered successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setIsCreateOpen(false)
      registerForm.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { roleIds?: string[]; active?: boolean } }) =>
      usersApi.update(id, body),
    onSuccess: () => {
      toast.success("User updated successfully")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setEditingUser(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const permissionsMutation = useMutation({
    mutationFn: async ({ id, added, excluded }: { id: string; added: string[]; excluded: string[] }) => {
      await usersApi.addPermissions(id, added)
      await usersApi.excludePermissions(id, excluded)
    },
    onSuccess: () => {
      toast.success("User custom permissions updated")
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setPermissionsUser(null)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: () => {
      toast.success("User deleted")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openCreate = () => {
    registerForm.reset({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      roleIds: [],
    })
    setIsCreateOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setEditRoleIds(user.roleIds || [])
    setEditActiveStatus(user.active)
  }

  const saveUserEdit = () => {
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        body: { roleIds: editRoleIds, active: editActiveStatus },
      })
    }
  }

  const openPermissions = (user: User) => {
    setPermissionsUser(user)
    setSelectedPermissions(user.addedPermissionIds || [])
    setExcludedPermissions(user.excludedPermissionIds || [])
  }

  const savePermissions = () => {
    if (permissionsUser) {
      permissionsMutation.mutate({
        id: permissionsUser.id,
        added: selectedPermissions,
        excluded: excludedPermissions,
      })
    }
  }

  const toggleActive = (user: User) => {
    updateMutation.mutate({ id: user.id, body: { active: !user.active } })
  }

  const onRegisterSubmit = (values: z.infer<typeof registerFormSchema>) => {
    createMutation.mutate(values)
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "user",
      header: "User Details",
      accessorFn: (user) => `${user.firstName} ${user.lastName} @${user.username}`,
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
      id: "access",
      header: "Assigned Roles & Direct Permissions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-[320px]">
          {row.isSuperAdmin && (
            <Badge variant="default" className="bg-purple-600 text-[10px] text-white">
              Super Admin
            </Badge>
          )}
          {row.roleIds?.map((roleId) => {
            const roleObj = rolesData?.items.find((r) => r.id === roleId)
            return (
              <Badge
                key={roleId}
                variant="secondary"
                className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {roleObj?.name || "Role"}
              </Badge>
            )
          })}
          {row.addedPermissionIds?.length > 0 && (
            <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
              +{row.addedPermissionIds.length} Direct Perms
            </Badge>
          )}
          {row.excludedPermissionIds?.length > 0 && (
            <Badge variant="outline" className="text-[10px] border-rose-400 text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300">
              -{row.excludedPermissionIds.length} Excluded
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "active",
      header: "Account Status",
      accessorKey: "active",
      filterType: "select",
      filterOptions: [
        { label: "Active", value: true },
        { label: "Inactive", value: false },
      ],
      cell: ({ value, row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.active}
            onCheckedChange={() => toggleActive(row)}
          />
          <StatusBadgeCell status={value ? "Active" : "Inactive"} type="account" />
        </div>
      ),
    },
  ]

  const customActions: RowAction<User>[] = [
    {
      label: "Direct Permissions",
      icon: <Key className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />,
      onClick: (user) => openPermissions(user),
    },
    {
      label: "Toggle Active State",
      icon: <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />,
      onClick: (user) => toggleActive(user),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Reusable Data Table Component */}
      <DataTable<User>
        data={usersData?.items || []}
        columns={columns}
        getRowId={(u) => u.id}
        title="User Accounts Directory"
        searchPlaceholder="Search users by name, username or email..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        createButtonLabel="Register User"
        onCreateNew={openCreate}
        manualPagination={true}
        totalCount={usersData?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        onEditRow={(u) => openEdit(u)}
        onDeleteRow={(u) => !u.isSuperAdmin && deleteMutation.mutate(u.id)}
        customRowActions={customActions}
        exportFilename="users-directory"
      />

      {/* Register User Modal */}
      <ModernModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register New User"
        subtitle="Provision a user account with specific roles for your organization."
        icon={<UserCog className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        size="xl"
        isLoading={createMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsCreateOpen(false)} />
            <ModernModalSubmitButton
              form="register-user-form"
              isLoading={createMutation.isPending}
            >
              Create User Account
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="register-user-form" onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModernInput
              label="First Name"
              placeholder="John"
              {...registerForm.register("firstName")}
              error={registerForm.formState.errors.firstName?.message}
              required
            />
            <ModernInput
              label="Last Name"
              placeholder="Doe"
              {...registerForm.register("lastName")}
              error={registerForm.formState.errors.lastName?.message}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ModernInput
              label="Username"
              placeholder="johndoe"
              {...registerForm.register("username")}
              error={registerForm.formState.errors.username?.message}
              required
            />
            <ModernInput
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              {...registerForm.register("email")}
              error={registerForm.formState.errors.email?.message}
              required
            />
          </div>

          <ModernInput
            label="Initial Password"
            type="password"
            placeholder="••••••••"
            {...registerForm.register("password")}
            error={registerForm.formState.errors.password?.message}
            required
          />

          <RoleSelector
            roles={rolesData?.items || []}
            selectedRoleIds={registerForm.watch("roleIds") || []}
            onChange={(ids) => registerForm.setValue("roleIds", ids)}
            title="Assign User Roles"
            description="Select the role(s) to grant permission capabilities to this user."
          />
          {registerForm.formState.errors.roleIds && (
            <p className="text-xs font-medium text-destructive">{registerForm.formState.errors.roleIds.message}</p>
          )}
        </form>
      </ModernModal>

      {/* Edit User Roles & Status Modal */}
      <ModernModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit Account: ${editingUser?.firstName} ${editingUser?.lastName}`}
        subtitle={`Update assigned roles and active status for @${editingUser?.username}.`}
        icon={<UserCog className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        size="xl"
        isLoading={updateMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setEditingUser(null)} />
            <ModernModalSubmitButton
              onClick={saveUserEdit}
              isLoading={updateMutation.isPending}
            >
              Save User Changes
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <div className="space-y-6">
          <ModernSwitch
            label="Account Active Status"
            description="Active users can sign in and access organization resources."
            checked={editActiveStatus}
            onCheckedChange={setEditActiveStatus}
          />

          <RoleSelector
            roles={rolesData?.items || []}
            selectedRoleIds={editRoleIds}
            onChange={setEditRoleIds}
            title="Assigned Roles"
            description="Manage roles assigned to this user."
          />
        </div>
      </ModernModal>

      {/* Direct Custom Permissions Modal (Tabbed: Granted vs Excluded) */}
      <ModernModal
        isOpen={!!permissionsUser}
        onClose={() => setPermissionsUser(null)}
        title={`Direct Permissions for ${permissionsUser?.firstName} ${permissionsUser?.lastName}`}
        subtitle={`Configure user-level permissions granted directly or explicitly excluded from roles.`}
        icon={<Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
        size="xl"
        isLoading={permissionsMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setPermissionsUser(null)} />
            <ModernModalSubmitButton
              onClick={savePermissions}
              isLoading={permissionsMutation.isPending}
            >
              Save User Permissions
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <Tabs defaultValue="granted" className="w-full">
          <TabsList className="grid grid-cols-2 bg-slate-100 dark:bg-slate-900 p-1 mb-4">
            <TabsTrigger value="granted" className="text-xs font-semibold gap-2">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              Direct Granted (+{selectedPermissions.length})
            </TabsTrigger>
            <TabsTrigger value="excluded" className="text-xs font-semibold gap-2">
              <ShieldAlert className="size-3.5 text-rose-600" />
              Explicitly Excluded (-{excludedPermissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="granted" className="mt-0">
            <PermissionSelector
              permissions={permissionsData}
              selectedIds={selectedPermissions}
              onChange={setSelectedPermissions}
              title="Direct Granted Permissions"
              description="Grant extra permissions directly to this user beyond their assigned roles."
              badgeVariant="emerald"
            />
          </TabsContent>

          <TabsContent value="excluded" className="mt-0">
            <PermissionSelector
              permissions={permissionsData}
              selectedIds={excludedPermissions}
              onChange={setExcludedPermissions}
              title="Explicitly Excluded Permissions"
              description="Override role grants by blocking specific permissions for this user."
              badgeVariant="rose"
            />
          </TabsContent>
        </Tabs>
      </ModernModal>
    </div>
  )
}
