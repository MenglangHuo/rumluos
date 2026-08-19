"use client"

import * as React from "react"
import {
  ModernInput,
  ModernSelect,
  ModernTextarea,
  ModernCheckbox,
  ModernSwitch,
} from "@/components/ui-custom/form-controls"
import {
  Mail,
  Lock,
  User,
  Search,
  Globe,
  DollarSign,
  ShieldCheck,
  Building,
  Sparkles,
  CreditCard,
  Bell,
  SlidersHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function FormDemoPage() {
  // Demo States
  const [email, setEmail] = React.useState("john.doe@example.com")
  const [password, setPassword] = React.useState("SecretP@ss123")
  const [searchVal, setSearchVal] = React.useState("")
  const [currencyVal, setCurrencyVal] = React.useState("1250.00")
  const [roleVal, setRoleVal] = React.useState("admin")
  const [branchVal, setBranchVal] = React.useState("phnom_penh")
  const [bioVal, setBioVal] = React.useState("Senior Full-Stack Developer specializing in modern UI systems and cloud APIs.")
  const [termsChecked, setTermsChecked] = React.useState(true)
  const [selectedPlan, setSelectedPlan] = React.useState("pro")
  const [notificationsActive, setNotificationsActive] = React.useState(true)
  const [twoFactorActive, setTwoFactorActive] = React.useState(false)

  // Loading toggles for testing
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const roleOptions = [
    { value: "admin", label: "System Administrator", icon: <ShieldCheck className="size-4" />, description: "Full access to system settings", badge: "Global" },
    { value: "manager", label: "Branch Manager", icon: <Building className="size-4" />, description: "Manages local branch operations", badge: "Branch" },
    { value: "staff", label: "Operational Staff", icon: <User className="size-4" />, description: "Standard user permissions", badge: "Limited" },
  ]

  const branchOptions = [
    { value: "phnom_penh", label: "Phnom Penh HQ", icon: <Globe className="size-4" />, description: "Main Headquarters" },
    { value: "siem_reap", label: "Siem Reap Branch", icon: <Building className="size-4" />, description: "Northern Region" },
    { value: "battambang", label: "Battambang Branch", icon: <Building className="size-4" />, description: "Western Region" },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Modern Form Controls</h1>
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="size-3 text-amber-500" />
            shadcn/ui Enhanced
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Dynamic, customizable, and production-ready input fields, select dropdowns, textareas, checkboxes, and switches.
        </p>
      </div>

      {/* Grid of Demos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: ModernInput Fields */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-primary" />
              Modern Input Fields
            </CardTitle>
            <CardDescription>
              Supports icons, password visibility toggle, clear button, floating labels, prefixes, and error states.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Standard Input with Left Icon & Clearable */}
            <ModernInput
              label="Email Address"
              leftIcon={<Mail className="size-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              clearable
              onClear={() => setEmail("")}
              helperText="We'll never share your email with anyone else."
              required
            />

            {/* Password Input with Eye Toggle */}
            <ModernInput
              label="Password"
              type="password"
              leftIcon={<Lock className="size-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Floating Label Variant */}
            <ModernInput
              label="Search Keyword"
              labelVariant="floating"
              leftIcon={<Search className="size-4" />}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Type something..."
              clearable
            />

            {/* Prefix & Suffix Addons */}
            <ModernInput
              label="Monthly Budget"
              prefixAddon={<DollarSign className="size-4" />}
              suffixAddon="USD"
              value={currencyVal}
              onChange={(e) => setCurrencyVal(e.target.value)}
              inputSize="md"
            />

            {/* Glassmorphic Variant with Loading State */}
            <ModernInput
              label="Glassmorphic Input (Loading)"
              variant="glass"
              placeholder="Loading user data..."
              isLoading={true}
              helperText="Fetch background state active"
            />

            {/* Character Counter & Validation Error */}
            <ModernInput
              label="Username"
              defaultValue="admin_user_long_invalid_string"
              maxLength={20}
              showCharCount
              error="Username cannot exceed 20 characters."
            />
          </CardContent>
        </Card>

        {/* Section 2: ModernSelect Dropdowns */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="size-5 text-indigo-500" />
              Modern Select Dropdowns
            </CardTitle>
            <CardDescription>
              Rich dropdowns with searchable filtering, option icons, descriptions, badges, and clear buttons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Searchable Select with Rich Options */}
            <ModernSelect
              label="Assigned System Role"
              options={roleOptions}
              value={roleVal}
              onChange={setRoleVal}
              searchable
              clearable
              required
              helperText="Determines access control level across tenant resources."
            />

            {/* Branch Selection */}
            <ModernSelect
              label="Primary Operating Branch"
              options={branchOptions}
              value={branchVal}
              onChange={setBranchVal}
              variant="glass"
              leftIcon={<Globe className="size-4" />}
            />

            {/* Subtle Variant */}
            <ModernSelect
              label="Subtle Dropdown Variant"
              variant="subtle"
              options={[
                { value: "active", label: "Active Status" },
                { value: "inactive", label: "Inactive Status" },
                { value: "pending", label: "Pending Approval" },
              ]}
              defaultValue="active"
            />

            {/* Error State */}
            <ModernSelect
              label="Select Department"
              options={[]}
              placeholder="Select department..."
              error="Please select a valid department."
            />
          </CardContent>
        </Card>

        {/* Section 3: ModernTextarea */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="size-5 text-emerald-500" />
              Modern Textarea Fields
            </CardTitle>
            <CardDescription>
              Auto-growing text area with character counters, clearable controls, and background variants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Auto-Resizing Textarea */}
            <ModernTextarea
              label="User Biography & Summary"
              value={bioVal}
              onChange={(e) => setBioVal(e.target.value)}
              autoResize
              clearable
              onClear={() => setBioVal("")}
              showCharCount
              maxLength={200}
              helperText="Textarea automatically resizes as you type."
            />

            {/* Filled Variant with Error */}
            <ModernTextarea
              label="Rejection Reason"
              variant="filled"
              placeholder="Explain why this request is being rejected..."
              error="Rejection reason is required when denying an application."
            />
          </CardContent>
        </Card>

        {/* Section 4: ModernCheckbox & ModernSwitch */}
        <Card className="shadow-xs">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="size-5 text-amber-500" />
              Checkboxes & Switches
            </CardTitle>
            <CardDescription>
              Standard inline controls and interactive Card layout options for settings and selection screens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Standard Inline Checkbox */}
            <ModernCheckbox
              label="I agree to the Terms of Service and Privacy Policy"
              description="Required for account registration and audit logging."
              checked={termsChecked}
              onCheckedChange={(val) => setTermsChecked(Boolean(val))}
            />

            {/* Card Checkbox Variant */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Select Subscription Plan (Card Layout)</label>
              <div className="grid grid-cols-1 gap-2.5">
                <ModernCheckbox
                  variant="card"
                  label="Pro Enterprise Tier"
                  description="Unlimited branches, custom API keys, and priority 24/7 SLA support."
                  badge="$99 / month"
                  icon={<CreditCard className="size-5" />}
                  checked={selectedPlan === "pro"}
                  onCheckedChange={() => setSelectedPlan("pro")}
                />
                <ModernCheckbox
                  variant="card"
                  label="Standard Business Tier"
                  description="Up to 5 branch locations and 20 staff accounts."
                  badge="$49 / month"
                  icon={<Building className="size-5" />}
                  checked={selectedPlan === "standard"}
                  onCheckedChange={() => setSelectedPlan("standard")}
                />
              </div>
            </div>

            {/* Standard ModernSwitch */}
            <ModernSwitch
              label="Push Notifications"
              description="Receive instant security alerts and system events."
              showStatusBadge
              checked={notificationsActive}
              onCheckedChange={setNotificationsActive}
            />

            {/* Card ModernSwitch */}
            <ModernSwitch
              variant="card"
              label="Two-Factor Authentication (2FA)"
              description="Require TOTP authenticator app code on login."
              showStatusBadge
              checked={twoFactorActive}
              onCheckedChange={setTwoFactorActive}
            />

            {/* Pending Loading State Switch */}
            <ModernSwitch
              label="Syncing Cloud Storage (Loading)"
              description="Automatic file backup service"
              isLoading={true}
              checked={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset Form Fields
        </Button>
        <Button
          onClick={() => {
            setIsSubmitting(true)
            setTimeout(() => setIsSubmitting(false), 1500)
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Test Form"}
        </Button>
      </div>
    </div>
  )
}
