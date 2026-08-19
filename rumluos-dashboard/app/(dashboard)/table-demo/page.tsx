"use client"

import React, { useState } from "react"
import {
  DataTable,
  ColumnDef,
  UserDetailCell,
  StatusBadgeCell,
  IPAddressCell,
  DateCell,
  PresetView,
} from "@/components/ui-custom/data-table"
import { Sparkles, Globe, Mail, ShieldCheck, Calendar, Settings, Plus, Eye, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  ModernModal,
  ModernModalFooter,
} from "@/components/ui-custom/modal"
import {
  ModernInput,
  ModernSelect,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface UserRecord {
  id: string
  name: string
  email: string
  avatarUrl?: string
  ipAddress: string
  emailStatus: "Verified" | "Unverified"
  accountStatus: "Active" | "Inactive"
  registeredDate: string
}

// Initial mock dataset strictly recreating the user's uploaded image!
const initialUsers: UserRecord[] = [
  {
    id: "1",
    name: "Vernon Rolfson",
    email: "serenity@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120",
    ipAddress: "19.4.206.172",
    emailStatus: "Verified",
    accountStatus: "Active",
    registeredDate: "2026-01-16",
  },
  {
    id: "2",
    name: "Marta Hill III",
    email: "jaxon@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120",
    ipAddress: "128.201.52.174",
    emailStatus: "Verified",
    accountStatus: "Active",
    registeredDate: "2026-06-15",
  },
  {
    id: "3",
    name: "Tamara Ritchie",
    email: "benjamin@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120",
    ipAddress: "147.5.226.79",
    emailStatus: "Unverified",
    accountStatus: "Active",
    registeredDate: "2026-10-31",
  },
  {
    id: "4",
    name: "Claudia Marquardt",
    email: "emily@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120",
    ipAddress: "38.103.24.53",
    emailStatus: "Verified",
    accountStatus: "Inactive",
    registeredDate: "2026-04-30",
  },
  {
    id: "5",
    name: "Rodolfo Becker",
    email: "mia@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120",
    ipAddress: "173.135.136.239",
    emailStatus: "Unverified",
    accountStatus: "Active",
    registeredDate: "2026-09-04",
  },
  {
    id: "6",
    name: "Eric Langosh",
    email: "logan@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
    ipAddress: "178.108.194.64",
    emailStatus: "Verified",
    accountStatus: "Inactive",
    registeredDate: "2026-11-08",
  },
  {
    id: "7",
    name: "Ms. Jacob Crooks",
    email: "charlie@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120",
    ipAddress: "40.84.113.29",
    emailStatus: "Unverified",
    accountStatus: "Inactive",
    registeredDate: "2026-11-20",
  },
  {
    id: "8",
    name: "Jim Gorczany",
    email: "jacob@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120",
    ipAddress: "245.7.126.86",
    emailStatus: "Verified",
    accountStatus: "Active",
    registeredDate: "2026-03-07",
  },
  {
    id: "9",
    name: "Peter Tremblay",
    email: "henry@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=120",
    ipAddress: "245.7.126.86",
    emailStatus: "Verified",
    accountStatus: "Active",
    registeredDate: "2026-03-07",
  },
  {
    id: "10",
    name: "Clint Jakubowski DVM",
    email: "mia@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=120",
    ipAddress: "245.7.126.86",
    emailStatus: "Verified",
    accountStatus: "Inactive",
    registeredDate: "2026-03-07",
  },
  {
    id: "11",
    name: "Pam Krajcik",
    email: "madelyn@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
    ipAddress: "245.7.126.86",
    emailStatus: "Unverified",
    accountStatus: "Active",
    registeredDate: "2026-03-07",
  },
  {
    id: "12",
    name: "Mr. Angel Bahringer",
    email: "brooklyn@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120",
    ipAddress: "245.7.126.86",
    emailStatus: "Verified",
    accountStatus: "Active",
    registeredDate: "2026-03-07",
  },
  {
    id: "13",
    name: "Arthur Bogan",
    email: "isaac@example.com",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120",
    ipAddress: "245.7.126.86",
    emailStatus: "Unverified",
    accountStatus: "Active",
    registeredDate: "2026-03-07",
  },
]

export default function TableDemoPage() {
  const [users, setUsers] = useState<UserRecord[]>(initialUsers)
  const [activePreset, setActivePreset] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null)

  // Form states
  const [formData, setFormData] = useState<Partial<UserRecord>>({
    name: "",
    email: "",
    ipAddress: "",
    emailStatus: "Verified",
    accountStatus: "Active",
  })

  // Columns Configuration
  const columns: ColumnDef<UserRecord>[] = [
    {
      id: "userDetails",
      header: "User Details",
      headerIcon: <Plus className="h-3.5 w-3.5 text-purple-500" />,
      accessorKey: "name",
      sortable: true,
      filterable: true,
      searchFn: (row, q) => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q),
      cell: ({ row }) => (
        <UserDetailCell
          name={row.name}
          subtitle={row.email}
          avatarUrl={row.avatarUrl}
          onClick={() => handleView(row)}
        />
      ),
    },
    {
      id: "ipAddress",
      header: "IP Address",
      headerIcon: <Globe className="h-3.5 w-3.5 text-blue-500" />,
      accessorKey: "ipAddress",
      sortable: true,
      filterable: true,
      cell: ({ value }) => <IPAddressCell ip={value} />,
    },
    {
      id: "emailStatus",
      header: "Email Status",
      headerIcon: <Sparkles className="h-3.5 w-3.5 text-indigo-500" />,
      accessorKey: "emailStatus",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Verified", value: "Verified" },
        { label: "Unverified", value: "Unverified" },
      ],
      cell: ({ value }) => <StatusBadgeCell status={value} type="email" />,
    },
    {
      id: "accountStatus",
      header: "Account Status",
      headerIcon: <Sparkles className="h-3.5 w-3.5 text-emerald-500" />,
      accessorKey: "accountStatus",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ],
      cell: ({ value }) => <StatusBadgeCell status={value} type="account" />,
    },
    {
      id: "registeredDate",
      header: "Registered Date",
      headerIcon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
      accessorKey: "registeredDate",
      sortable: true,
      filterable: true,
      cell: ({ value }) => <DateCell dateString={value} />,
    },
  ]

  // Preset Views Configuration
  const presetViews: PresetView[] = [
    { id: "all", label: "All Users", badge: `${users.length}` },
    {
      id: "active",
      label: "Active Users",
      badge: `${users.filter((u) => u.accountStatus === "Active").length}`,
      filterState: { accountStatus: "Active" },
    },
    {
      id: "verified",
      label: "Verified Users",
      badge: `${users.filter((u) => u.emailStatus === "Verified").length}`,
      filterState: { emailStatus: "Verified" },
    },
    {
      id: "inactive",
      label: "Inactive Accounts",
      badge: `${users.filter((u) => u.accountStatus === "Inactive").length}`,
      filterState: { accountStatus: "Inactive" },
    },
  ]

  // Row Actions Handlers
  const handleView = (user: UserRecord) => {
    setSelectedUser(user)
    setViewModalOpen(true)
  }

  const handleEdit = (user: UserRecord) => {
    setSelectedUser(user)
    setFormData(user)
    setEditModalOpen(true)
  }

  const handleDelete = (user: UserRecord) => {
    setDeletingUser(user)
  }

  const confirmDelete = () => {
    if (deletingUser) {
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id))
      toast.success(`Deleted user ${deletingUser.name}`)
      setDeletingUser(null)
    }
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required")
      return
    }

    const newUser: UserRecord = {
      id: String(Date.now()),
      name: formData.name,
      email: formData.email,
      ipAddress: formData.ipAddress || "192.168.1.1",
      emailStatus: (formData.emailStatus as any) || "Verified",
      accountStatus: (formData.accountStatus as any) || "Active",
      registeredDate: new Date().toISOString().split("T")[0],
    }

    setUsers((prev) => [newUser, ...prev])
    toast.success(`Registered ${newUser.name} successfully`)
    setCreateModalOpen(false)
    setFormData({ name: "", email: "", ipAddress: "", emailStatus: "Verified", accountStatus: "Active" })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUser.id ? ({ ...u, ...formData } as UserRecord) : u))
    )
    toast.success(`Updated ${formData.name}`)
    setEditModalOpen(false)
  }

  const handleImport = (importedRows: any[]) => {
    const formatted = importedRows.map((r, idx) => ({
      id: String(Date.now() + idx),
      name: r.name || r["User Details"] || `User ${idx + 1}`,
      email: r.email || `user${idx + 1}@example.com`,
      ipAddress: r.ipAddress || r["IP Address"] || "127.0.0.1",
      emailStatus: (r.emailStatus || r["Email Status"] || "Verified") as any,
      accountStatus: (r.accountStatus || r["Account Status"] || "Active") as any,
      registeredDate: r.registeredDate || r["Registered Date"] || new Date().toISOString().split("T")[0],
    }))

    setUsers((prev) => [...formatted, ...prev])
  }

  return (
    <div className="space-y-6">
      {/* Page Description Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">User Management</h2>
        <p className="text-muted-foreground text-sm">
          Dynamic, customizable data table component with search, filtering, sorting, preset views, pagination, and bulk row actions.
        </p>
      </div>

      {/* Main Reusable Data Table Component */}
      <DataTable<UserRecord>
        data={users}
        columns={columns}
        getRowId={(user) => user.id}
        title="All Users"
        presetViews={presetViews}
        activePresetId={activePreset}
        onPresetChange={(preset) => setActivePreset(preset.id)}
        searchPlaceholder="Search name, email, IP..."
        createButtonLabel="Add User"
        createButtonIcon={<Plus className="h-4 w-4" />}
        onCreateNew={() => {
          setFormData({ name: "", email: "", ipAddress: "192.168.1.1", emailStatus: "Verified", accountStatus: "Active" })
          setCreateModalOpen(true)
        }}
        onImport={handleImport}
        exportFilename="users-export"
        onViewRow={handleView}
        onEditRow={handleEdit}
        onDeleteRow={handleDelete}
        pageSizeOptions={[10, 20, 50, 100]}
      />

      {/* View User Modal */}
      <ModernModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="User Details"
        subtitle="Profile information for selected user."
        icon={<Eye className="h-5 w-5" />}
        size="sm"
        footer={
          <ModernModalFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </ModernModalFooter>
        }
      >
        {selectedUser && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-lg border border-border">
              <UserDetailCell
                name={selectedUser.name}
                subtitle={selectedUser.email}
                avatarUrl={selectedUser.avatarUrl}
              />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">IP Address:</span>
                <IPAddressCell ip={selectedUser.ipAddress} />
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Email Status:</span>
                <StatusBadgeCell status={selectedUser.emailStatus} type="email" />
              </div>
              <div className="flex justify-between py-1.5 border-b">
                <span className="text-muted-foreground">Account Status:</span>
                <StatusBadgeCell status={selectedUser.accountStatus} type="account" />
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Registered Date:</span>
                <DateCell dateString={selectedUser.registeredDate} />
              </div>
            </div>
          </div>
        )}
      </ModernModal>

      {/* Create User Modal */}
      <ModernModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New User"
        subtitle="Add a new user record to the table."
        icon={<Plus className="h-5 w-5" />}
        size="md"
        footer={
          <ModernModalFooter>
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-demo-user-form">Create User</Button>
          </ModernModalFooter>
        }
      >
        <form id="create-demo-user-form" onSubmit={handleCreateSubmit} className="space-y-4 py-2">
          <ModernInput
            label="Full Name"
            value={formData.name || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. John Doe"
            required
          />
          <ModernInput
            label="Email Address"
            type="email"
            value={formData.email || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="john@example.com"
            leftIcon={<Mail className="size-4" />}
            required
          />
          <ModernInput
            label="IP Address"
            value={formData.ipAddress || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, ipAddress: e.target.value }))}
            placeholder="19.4.206.172"
            leftIcon={<Globe className="size-4" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <ModernSelect
              label="Email Status"
              value={formData.emailStatus}
              onChange={(val) => setFormData((prev) => ({ ...prev, emailStatus: val as any }))}
              options={[
                { value: "Verified", label: "Verified" },
                { value: "Unverified", label: "Unverified" },
              ]}
            />
            <ModernSelect
              label="Account Status"
              value={formData.accountStatus}
              onChange={(val) => setFormData((prev) => ({ ...prev, accountStatus: val as any }))}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </div>
        </form>
      </ModernModal>

      {/* Edit User Modal */}
      <ModernModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User Profile"
        subtitle="Modify record fields and status."
        icon={<Pencil className="h-5 w-5" />}
        size="md"
        footer={
          <ModernModalFooter>
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-demo-user-form">Save Changes</Button>
          </ModernModalFooter>
        }
      >
        <form id="edit-demo-user-form" onSubmit={handleEditSubmit} className="space-y-4 py-2">
          <ModernInput
            label="Full Name"
            value={formData.name || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <ModernInput
            label="Email Address"
            type="email"
            value={formData.email || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            leftIcon={<Mail className="size-4" />}
            required
          />
          <ModernInput
            label="IP Address"
            value={formData.ipAddress || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, ipAddress: e.target.value }))}
            leftIcon={<Globe className="size-4" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <ModernSelect
              label="Email Status"
              value={formData.emailStatus}
              onChange={(val) => setFormData((prev) => ({ ...prev, emailStatus: val as any }))}
              options={[
                { value: "Verified", label: "Verified" },
                { value: "Unverified", label: "Unverified" },
              ]}
            />
            <ModernSelect
              label="Account Status"
              value={formData.accountStatus}
              onChange={(val) => setFormData((prev) => ({ ...prev, accountStatus: val as any }))}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
            />
          </div>
        </form>
      </ModernModal>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete record <span className="font-semibold">{deletingUser?.name}</span> ({deletingUser?.email}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
