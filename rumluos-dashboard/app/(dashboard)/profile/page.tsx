"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { profileApi, fileUrl } from "@/lib/api/endpoints"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Loader2,
  User as UserIcon,
  Building2,
  ShieldCheck,
  Mail,
  KeyRound,
  Briefcase,
  MapPin,
  Phone,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  DollarSign,
  Layers,
  Search,
  Camera,
  UserCheck,
  Shield,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/ui-custom/file-upload"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// ---- Validation Schemas --------------------------------------
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  contact: z.string().optional(),
  avatarKey: z.string().nullable().optional(),
})

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
interface NormalizedPermission {
  id: string
  name: string
  module: string
  description?: string
}

function normalizePermissionsList(raw: any): NormalizedPermission[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    return raw.map((p: any, idx) => ({
      id: String(p.id || idx),
      name: String(p.name || p.code || "permission"),
      module: String(p.module || (p.name && p.name.includes(".") ? p.name.split(".")[0].toUpperCase() : "General")),
      description: p.description ? String(p.description) : undefined,
    }))
  }
  if (typeof raw === "object") {
    const list: NormalizedPermission[] = []
    Object.entries(raw).forEach(([domain, actions]) => {
      const moduleName = domain.charAt(0).toUpperCase() + domain.slice(1)
      if (Array.isArray(actions)) {
        actions.forEach((act: any, idx) => {
          const actionName = typeof act === "string" ? act : act?.name || "access"
          const code = `${domain}.${actionName}`
          list.push({
            id: `${domain}-${actionName}-${idx}`,
            name: code,
            module: moduleName,
            description: `${actionName.toUpperCase()} operation for ${domain}`,
          })
        })
      } else if (typeof actions === "boolean" && actions) {
        list.push({
          id: domain,
          name: domain,
          module: moduleName,
          description: `${moduleName} access`,
        })
      }
    })
    return list
  }
  return []
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState("")

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.me,
  })

  // ---- Form Hooks --------------------------------------------
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      firstName: userProfile?.firstName || "",
      lastName: userProfile?.lastName || "",
      contact: userProfile?.contact || "",
      avatarKey: userProfile?.avatarKey || null,
    },
  })

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // ---- Mutations ---------------------------------------------
  const updateProfileMutation = useMutation({
    mutationFn: (values: z.infer<typeof profileFormSchema>) =>
      profileApi.update({
        firstName: values.firstName,
        lastName: values.lastName,
        contact: values.contact,
        avatarKey: values.avatarKey,
      }),
    onSuccess: () => {
      toast.success("Profile updated successfully")
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const changePasswordMutation = useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully")
      passwordForm.reset()
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  // ---- Handlers ----------------------------------------------
  const onProfileSubmit = (values: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(values)
  }

  const onPasswordSubmit = (values: z.infer<typeof passwordFormSchema>) => {
    changePasswordMutation.mutate(values)
  }

  // ---- Password Strength Calculation ------------------------
  const newPasswordValue = passwordForm.watch("newPassword") || ""
  const passwordStrength = useMemo(() => {
    let score = 0
    if (newPasswordValue.length >= 8) score += 1
    if (/[A-Z]/.test(newPasswordValue)) score += 1
    if (/[0-9]/.test(newPasswordValue)) score += 1
    if (/[^A-Za-z0-9]/.test(newPasswordValue)) score += 1
    return score
  }, [newPasswordValue])

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return { label: "Weak", color: "bg-destructive", text: "text-destructive" }
      case 2:
      case 3:
        return { label: "Medium", color: "bg-warning", text: "text-amber-500" }
      case 4:
        return { label: "Strong", color: "bg-emerald-500", text: "text-emerald-500" }
      default:
        return { label: "Weak", color: "bg-muted", text: "text-muted-foreground" }
    }
  }

  // ---- Normalize Permissions ---------------------------------
  const allPermissions = useMemo(() => {
    return normalizePermissionsList(userProfile?.permissions)
  }, [userProfile?.permissions])

  // ---- Filter Permissions ------------------------------------
  const filteredPermissions = useMemo(() => {
    if (!permissionSearch.trim()) return allPermissions
    const query = permissionSearch.toLowerCase()
    return allPermissions.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.module.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    )
  }, [allPermissions, permissionSearch])

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const map: Record<string, NormalizedPermission[]> = {}
    filteredPermissions.forEach((p) => {
      const mod = p.module || "General"
      if (!map[mod]) map[mod] = []
      map[mod].push(p)
    })
    return map
  }, [filteredPermissions])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading profile information...</p>
      </div>
    )
  }

  if (!userProfile) return null

  const avatarSrc = profileForm.watch("avatarKey")
    ? fileUrl(profileForm.watch("avatarKey"))
    : userProfile.avatarUrl || fileUrl(userProfile.avatarKey) || ""

  const staff = userProfile.staffInfo

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* ============================================================ */}
      {/* Hero Banner & Profile Header */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-md">
                <AvatarImage src={avatarSrc} alt={userProfile.firstName} />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                  {userProfile.firstName?.[0]}
                  {userProfile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-quick-upload"
                className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="h-6 w-6" />
              </label>
              <input
                id="avatar-quick-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const { uploadFile } = await import("@/lib/api/endpoints")
                    toast.loading("Uploading avatar...")
                    const fileKey = await uploadFile(file, { isPublic: true, folder: "avatars" })
                    profileForm.setValue("avatarKey", fileKey)
                    updateProfileMutation.mutate(profileForm.getValues())
                    toast.dismiss()
                  } catch (err) {
                    toast.dismiss()
                    toast.error("Failed to upload avatar image")
                  }
                }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {userProfile.firstName} {userProfile.lastName}
                </h1>
                <Badge variant={userProfile.active ? "default" : "secondary"} className="gap-1">
                  {userProfile.active ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {userProfile.active ? "Active Account" : "Inactive"}
                </Badge>
                {userProfile.isSuperAdmin && (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10 gap-1">
                    <ShieldCheck className="h-3 w-3" /> Super Admin
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  @{userProfile.username}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {userProfile.email}
                </span>
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {staff?.position ? (
                  <Badge variant="secondary" className="gap-1 font-medium">
                    <Briefcase className="h-3 w-3 text-primary" />
                    {staff.position}
                  </Badge>
                ) : null}

                {userProfile.branchName || staff?.branchName ? (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {userProfile.branchName || staff?.branchName}
                  </Badge>
                ) : null}

                {userProfile.companyName || userProfile.company?.name ? (
                  <Badge variant="outline" className="gap-1 text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    {userProfile.companyName || userProfile.company?.name}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
            <div className="space-y-0.5 text-center sm:text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Assigned Roles</p>
              <p className="text-2xl font-extrabold text-primary">{userProfile.roles?.length || 0}</p>
            </div>
            <Separator orientation="vertical" className="h-8 hidden sm:block" />
            <div className="space-y-0.5 text-center sm:text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Effective Grants</p>
              <p className="text-2xl font-extrabold text-primary">{allPermissions.length}</p>
            </div>
            <Separator orientation="vertical" className="h-8 hidden sm:block" />
            <div className="space-y-0.5 text-center sm:text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">HR Staff Link</p>
              <p className="text-sm font-semibold flex items-center gap-1 mt-1">
                {staff ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <UserCheck className="h-4 w-4" /> Linked
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unlinked</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Profile Main Tabs */}
      {/* ============================================================ */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-muted/60">
          <TabsTrigger value="personal" className="gap-2 py-2.5">
            <UserIcon className="h-4 w-4" />
            <span>Personal Info</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2 py-2.5">
            <Briefcase className="h-4 w-4" />
            <span>Staff & HR Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 py-2.5">
            <KeyRound className="h-4 w-4" />
            <span>Security & Password</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2 py-2.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Roles & Permissions</span>
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------ */}
        {/* TAB 1: Personal Info */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your basic identity, avatar, and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-6 p-4 rounded-xl border bg-muted/20">
                    <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                        {userProfile.firstName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <FileUpload
                        accept="image/*"
                        isPublic={true}
                        folder="avatars"
                        onUploadSuccess={(fileKey) => {
                          profileForm.setValue("avatarKey", fileKey)
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPG, PNG, WEBP. Maximum file size: 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...profileForm.register("firstName")} />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...profileForm.register("lastName")} />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-sm text-destructive">
                        {profileForm.formState.errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1.5">
                      Email Address <Lock className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <Input id="email" value={userProfile.email} disabled className="bg-muted/50 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">Email address cannot be changed directly.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="flex items-center gap-1.5">
                      Username <Lock className="h-3 w-3 text-muted-foreground" />
                    </Label>
                    <Input id="username" value={userProfile.username} disabled className="bg-muted/50 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">Username is fixed to your identity account.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Phone Number</Label>
                  <Input
                    id="contact"
                    placeholder="e.g. +855 12 345 678"
                    {...profileForm.register("contact")}
                  />
                  {profileForm.formState.errors.contact && (
                    <p className="text-sm text-destructive">
                      {profileForm.formState.errors.contact.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => profileForm.reset()}
                    disabled={updateProfileMutation.isPending}
                  >
                    Reset Form
                  </Button>
                  <Button type="submit" disabled={updateProfileMutation.isPending} className="gap-2">
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* TAB 2: Staff & HR Profile */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Staff & Human Resources Profile
              </CardTitle>
              <CardDescription>
                Detailed employment records, branch assignment, and emergency contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {staff ? (
                <div className="space-y-6">
                  {/* Staff Status Callout */}
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4">
                    <UserCheck className="h-6 w-6 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">
                        Linked HR Staff Profile Active
                      </h4>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                        Your user login account is linked 1:1 to Staff record ID #{staff.id}. HR and branch permissions apply to this record.
                      </p>
                    </div>
                  </div>

                  {/* Staff Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1 p-4 rounded-lg border bg-muted/10">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</span>
                      <p className="font-semibold text-base">{staff.name || `${userProfile.firstName} ${userProfile.lastName}`}</p>
                    </div>

                    <div className="space-y-1 p-4 rounded-lg border bg-muted/10">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Position / Job Title</span>
                      <p className="font-semibold text-base flex items-center gap-1.5 text-primary">
                        <Briefcase className="h-4 w-4" />
                        {staff.position || "Unspecified"}
                      </p>
                    </div>

                    <div className="space-y-1 p-4 rounded-lg border bg-muted/10">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned Branch</span>
                      <p className="font-semibold text-base flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-primary" />
                        {staff.branchName || userProfile.branchName || "Main Branch"}
                      </p>
                    </div>

                    <div className="space-y-1 p-4 rounded-lg border bg-muted/10">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff Phone</span>
                      <p className="font-semibold text-base flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {staff.phone || "Not specified"}
                      </p>
                    </div>

                    <div className="space-y-1 p-4 rounded-lg border bg-muted/10">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff Email</span>
                      <p className="font-semibold text-base flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {staff.email || userProfile.email}
                      </p>
                    </div>

                    <div className="space-y-1 p-4 rounded-lg border bg-muted/10">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employment Status</span>
                      <div className="mt-1">
                        <Badge variant={staff.isActive ? "default" : "secondary"}>
                          {staff.isActive ? "Active Employee" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Urgent / Emergency Contact */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Emergency Contact Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg border bg-muted/20 space-y-1">
                        <span className="text-xs text-muted-foreground">Emergency Contact Name</span>
                        <p className="font-medium">{staff.urgentContactName || "Not provided"}</p>
                      </div>
                      <div className="p-4 rounded-lg border bg-muted/20 space-y-1">
                        <span className="text-xs text-muted-foreground">Emergency Contact Phone</span>
                        <p className="font-medium">{staff.urgentContactPhone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">No HR Staff Record Linked</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    This User login account is currently operating as an independent identity account without a linked HR Staff record. Some staff (e.g. operational drivers, field workers) exist in HR without system login access, while administrative users can be linked to staff profiles when needed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* TAB 3: Security & Password */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="security">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Change Account Password
                </CardTitle>
                <CardDescription>
                  Ensure your account is protected by using a strong, unique password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        {...passwordForm.register("currentPassword")}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        {...passwordForm.register("newPassword")}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}

                    {/* Password Strength Meter */}
                    {newPasswordValue.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Password Strength:</span>
                          <span className={`font-semibold ${getStrengthLabel(passwordStrength).text}`}>
                            {getStrengthLabel(passwordStrength).label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                          <div
                            className={`h-full transition-all duration-300 ${getStrengthLabel(passwordStrength).color}`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        {...passwordForm.register("confirmPassword")}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="gap-2"
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Security Audit Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Security Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Last Account Activity</p>
                      <p className="font-medium mt-0.5">
                        {userProfile.lastLoginAt
                          ? new Date(userProfile.lastLoginAt).toLocaleString()
                          : "Current active session"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <BadgeCheck className="h-4 w-4 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Account Status</p>
                      <p className="font-medium mt-0.5 text-emerald-600 dark:text-emerald-400">
                        Active & Verified
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Token Security</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        JWT Token Authentication with automated token rotation enabled.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* TAB 4: Roles & Permissions */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="permissions">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            {/* Roles Sidebar Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Assigned Roles ({userProfile.roles?.length || 0})
                </CardTitle>
                <CardDescription>Roles assigned to your account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {userProfile.roles && userProfile.roles.length > 0 ? (
                  userProfile.roles.map((role) => (
                    <div
                      key={role.id}
                      className="p-3 rounded-lg border bg-muted/20 space-y-1 transition-all hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{role.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          Role #{role.id}
                        </Badge>
                      </div>
                      {role.description && (
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">No roles directly assigned.</p>
                )}
              </CardContent>
            </Card>

            {/* Effective Permissions Matrix */}
            <Card className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      Effective Permissions ({filteredPermissions.length})
                    </CardTitle>
                    <CardDescription>
                      Calculated from assigned roles plus direct user grants and exclusions.
                    </CardDescription>
                  </div>

                  {/* Permission Search */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter permissions..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <ScrollArea className="h-[420px] pr-4">
                  {Object.keys(permissionsByModule).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                        <div key={moduleName} className="space-y-3">
                          <div className="flex items-center gap-2 pb-1 border-b">
                            <span className="font-bold text-sm uppercase tracking-wider text-primary">
                              {moduleName} Module
                            </span>
                            <Badge variant="outline" className="text-xs font-mono">
                              {perms.length}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {perms.map((perm) => (
                              <div
                                key={perm.id}
                                className="p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors flex items-center justify-between group"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-xs font-mono">{perm.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {perm.description || `${perm.module} operation`}
                                  </p>
                                </div>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 ml-2" />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-2">
                      <ShieldCheck className="h-10 w-10 opacity-20" />
                      <p className="text-sm font-medium">No matching permissions found.</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
