"use client"

import React, { useState } from "react"
import {
  Sparkles,
  Move,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  FileText,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Sliders,
  Settings,
  Layers,
  ArrowRight,
  Info,
  FileImage,
} from "lucide-react"

import { MediaPickerModal } from "@/components/attachments/media-picker-modal"
import type { Attachment } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

import {
  ModernModal,
  ModernModalHeader,
  ModernModalBody,
  ModernModalFooter,
  ModernModalCancelButton,
  ModernModalSubmitButton,
  ModalSize,
} from "@/components/ui-custom/modal"

export default function ModalDemoPage() {
  // Modal visibility states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false)
  const [isCustomSizeOpen, setIsCustomSizeOpen] = useState(false)
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<Attachment[]>([])

  // Configurator options
  const [draggable, setDraggable] = useState(true)
  const [resizable, setResizable] = useState(true)
  const [closeOnEsc, setCloseOnEsc] = useState(true)
  const [closeOnOutsideClick, setCloseOnOutsideClick] = useState(true)
  const [glassmorphism, setGlassmorphism] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSize, setSelectedSize] = useState<ModalSize>("lg")

  // Form submit state
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setIsFormModalOpen(false)
      toast.success("Customer record created successfully!")
    }, 1200)
  }

  const sampleUsers = Array.from({ length: 15 }, (_, i) => ({
    id: `USR-00${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@company.com`,
    role: i % 3 === 0 ? "Super Admin" : i % 2 === 0 ? "Branch Manager" : "Teller",
    status: i % 4 === 0 ? "Pending" : "Active",
    created: `2026-07-${10 + (i % 14)}`,
  }))

  return (
    <div className="space-y-8 p-1 sm:p-2">
      {/* Top Banner */}
      <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300 w-fit">
          <Sparkles className="h-3.5 w-3.5" />
          Production-Ready Modern Component
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Modern Reusable Modal Showcase
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          A fully accessible, responsive, draggable, and 8-axis resizable modal component built with Next.js, Tailwind CSS, and shadcn/ui.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Form Modal */}
        <Card className="flex flex-col justify-between rounded-3xl border-slate-200/80 shadow-lg dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-purple-300 dark:hover:border-purple-500/40">
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Long Form Modal</CardTitle>
            <CardDescription className="text-xs">
              Supports complex multi-field forms, sticky header/footer, and loading states.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => setIsFormModalOpen(true)}
              className="w-full rounded-xl bg-purple-600 font-semibold text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              Open Form Modal
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Table Modal */}
        <Card className="flex flex-col justify-between rounded-3xl border-slate-200/80 shadow-lg dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-purple-300 dark:hover:border-purple-500/40">
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
              <TableIcon className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Data Table Modal</CardTitle>
            <CardDescription className="text-xs">
              Optimized for scrollable tables with fixed sticky headers and action bars.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => setIsTableModalOpen(true)}
              variant="outline"
              className="w-full rounded-xl font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Open Table Modal
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Draggable & Resizable */}
        <Card className="flex flex-col justify-between rounded-3xl border-slate-200/80 shadow-lg dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-purple-300 dark:hover:border-purple-500/40">
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
              <Move className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Drag & Resize Demo</CardTitle>
            <CardDescription className="text-xs">
              Drag by header, resize along 8 edges, minimize to bottom tray, or maximize to fullscreen.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => setIsPlaygroundOpen(true)}
              className="w-full rounded-xl bg-slate-900 font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Open Interactive Demo
            </Button>
          </CardContent>
        </Card>

        {/* Card 4: Custom Size & Glass */}
        <Card className="flex flex-col justify-between rounded-3xl border-slate-200/80 shadow-lg dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-purple-300 dark:hover:border-purple-500/40">
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <Sliders className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Preset Sizes & Glass</CardTitle>
            <CardDescription className="text-xs">
              Test presets (sm, md, lg, xl, full) and backdrop glassmorphism styling.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              onClick={() => setIsCustomSizeOpen(true)}
              variant="outline"
              className="w-full rounded-xl font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Open Sizing Modal
            </Button>
          </CardContent>
        </Card>

        {/* Card 5: Reusable S3 Media Picker */}
        <Card className="flex flex-col justify-between rounded-3xl border-slate-200/80 shadow-lg dark:border-slate-800 dark:bg-slate-900/60 transition-all hover:border-purple-300 dark:hover:border-purple-500/40">
          <CardHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
              <FileImage className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Reusable Media Picker</CardTitle>
            <CardDescription className="text-xs">
              S3 Direct Uploader, category filter, library asset browser & selection tray modal.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Button
              onClick={() => setIsMediaPickerOpen(true)}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-white hover:from-purple-700 hover:to-indigo-700"
            >
              Open Media Picker
            </Button>
            {selectedAssets.length > 0 && (
              <p className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 text-center">
                {selectedAssets.length} asset(s) attached
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reusable S3 Media Picker Modal Component */}
      <MediaPickerModal
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        multiple={true}
        onSelect={(assets) => {
          setSelectedAssets(assets)
          toast.success(`Selected ${assets.length} file asset(s)`)
        }}
      />

      {/* Interactive Configurator Section */}
      <Card className="rounded-3xl border-slate-200/80 shadow-xl dark:border-slate-800 dark:bg-slate-900/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <CardTitle className="text-xl font-bold">Modal Prop Configurator</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Toggle modal behaviors dynamically to test accessibility, ESC keys, and interactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
              <Checkbox checked={draggable} onCheckedChange={(c) => setDraggable(!!c)} />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Draggable Header</p>
                <p className="text-[10px] text-slate-500">Drag modal by header handle</p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
              <Checkbox checked={resizable} onCheckedChange={(c) => setResizable(!!c)} />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">8-Axis Resizable</p>
                <p className="text-[10px] text-slate-500">Resize from edges and corners</p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
              <Checkbox checked={closeOnEsc} onCheckedChange={(c) => setCloseOnEsc(!!c)} />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Close on ESC Key</p>
                <p className="text-[10px] text-slate-500">Press Escape to close modal</p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
              <Checkbox checked={closeOnOutsideClick} onCheckedChange={(c) => setCloseOnOutsideClick(!!c)} />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Close on Backdrop Click</p>
                <p className="text-[10px] text-slate-500">Click overlay to close</p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
              <Checkbox checked={glassmorphism} onCheckedChange={(c) => setGlassmorphism(!!c)} />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Glassmorphism Effect</p>
                <p className="text-[10px] text-slate-500">Backdrop blur and translucency</p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 cursor-pointer">
              <Checkbox checked={isLoading} onCheckedChange={(c) => setIsLoading(!!c)} />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Loading State</p>
                <p className="text-[10px] text-slate-500">Show loading overlay spinner</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 1. LONG FORM MODAL */}
      {/* ========================================================================= */}
      <ModernModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Create New Customer Record"
        subtitle="Fill in the details below. Header & footer stay fixed while body scrolls."
        icon={<Building2 className="h-5 w-5" />}
        size="lg"
        draggable={draggable}
        resizable={resizable}
        closeOnEsc={closeOnEsc}
        closeOnOutsideClick={closeOnOutsideClick}
        glassmorphism={glassmorphism}
        isLoading={isLoading}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsFormModalOpen(false)} />
            <ModernModalSubmitButton
              form="modal-customer-form"
              isLoading={isSubmitting}
              loadingText="Submitting..."
            >
              Save Customer Record
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form id="modal-customer-form" onSubmit={handleFormSubmit} className="space-y-6">
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-4 dark:border-purple-500/20 dark:bg-purple-950/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-800 dark:text-purple-300">
              <Info className="h-4 w-4" />
              General Customer Information
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Enter primary identification and contact information.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-bold">First Name</Label>
              <Input id="firstName" defaultValue="Alex" required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-bold">Last Name</Label>
              <Input id="lastName" defaultValue="Morgan" required className="rounded-xl" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold">Email Address</Label>
              <Input id="email" type="email" defaultValue="alex.morgan@company.com" required className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold">Phone Number</Label>
              <Input id="phone" defaultValue="+1 (555) 234-5678" required className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-bold">Street Address</Label>
            <Input id="address" defaultValue="742 Evergreen Terrace" className="rounded-xl" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-bold">City</Label>
              <Input id="city" defaultValue="Springfield" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs font-bold">State / Province</Label>
              <Input id="state" defaultValue="IL" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip" className="text-xs font-bold">Postal Code</Label>
              <Input id="zip" defaultValue="62704" className="rounded-xl" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Loan Account Preferences
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox defaultChecked />
                Enable Automated Reminders
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <Checkbox defaultChecked />
                Paperless Statement (PDF)
              </label>
            </div>
          </div>
        </form>
      </ModernModal>

      {/* ========================================================================= */}
      {/* 2. DATA TABLE MODAL */}
      {/* ========================================================================= */}
      <ModernModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title="System Users Directory"
        subtitle="Scrollable internal table with sticky modal header and pagination footer."
        icon={<TableIcon className="h-5 w-5" />}
        size="xl"
        draggable={draggable}
        resizable={resizable}
        closeOnEsc={closeOnEsc}
        closeOnOutsideClick={closeOnOutsideClick}
        glassmorphism={glassmorphism}
        isLoading={isLoading}
        footer={
          <ModernModalFooter className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Showing 15 of 15 system records
            </span>
            <Button
              onClick={() => setIsTableModalOpen(false)}
              className="rounded-xl bg-slate-900 font-bold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Close Directory
            </Button>
          </ModernModalFooter>
        }
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-slate-100 font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {sampleUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-4 py-3 font-mono font-semibold text-purple-600 dark:text-purple-400">{u.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="rounded-md font-semibold">{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 font-semibold ${u.status === "Active" ? "text-emerald-600" : "text-amber-600"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.created}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModernModal>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE PLAYGROUND MODAL */}
      {/* ========================================================================= */}
      <ModernModal
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        title="Interactive Drag & Resize Playground"
        subtitle="Try dragging the header, resizing handles, or toggling minimize/maximize."
        icon={<Move className="h-5 w-5" />}
        size="lg"
        draggable={draggable}
        resizable={resizable}
        closeOnEsc={closeOnEsc}
        closeOnOutsideClick={closeOnOutsideClick}
        glassmorphism={glassmorphism}
        isLoading={isLoading}
        footer={
          <ModernModalFooter>
            <Button
              onClick={() => setIsPlaygroundOpen(false)}
              className="rounded-xl bg-purple-600 font-bold text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              Done Playground
            </Button>
          </ModernModalFooter>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
            <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" /> Live Interactivity Controls Enabled
            </h4>
            <ul className="mt-2 list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <li><strong>Drag:</strong> Click and hold the header bar to reposition the window anywhere on screen.</li>
              <li><strong>Resize:</strong> Hover over any of the 8 border edges or corners to resize freely.</li>
              <li><strong>Double Click Header:</strong> Instantly toggles Maximize / Restore mode.</li>
              <li><strong>Minimize:</strong> Docks the window into a floating pill at the bottom-right corner.</li>
            </ul>
          </div>
        </div>
      </ModernModal>

      {/* ========================================================================= */}
      {/* 4. PRESET SIZING MODAL */}
      {/* ========================================================================= */}
      <ModernModal
        isOpen={isCustomSizeOpen}
        onClose={() => setIsCustomSizeOpen(false)}
        title={`Preset Sizing Modal (${selectedSize.toUpperCase()})`}
        subtitle="Select a preset size below to view live dimension adjustment."
        icon={<Sliders className="h-5 w-5" />}
        size={selectedSize}
        draggable={draggable}
        resizable={resizable}
        closeOnEsc={closeOnEsc}
        closeOnOutsideClick={closeOnOutsideClick}
        glassmorphism={glassmorphism}
        isLoading={isLoading}
        footer={
          <ModernModalFooter>
            <Button onClick={() => setIsCustomSizeOpen(false)} className="rounded-xl font-bold">
              Close Sizing Demo
            </Button>
          </ModernModalFooter>
        }
      >
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Choose a preset size below:
          </p>
          <div className="flex flex-wrap gap-2">
            {(["sm", "md", "lg", "xl", "2xl", "full"] as ModalSize[]).map((sz) => (
              <Button
                key={sz}
                variant={selectedSize === sz ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSize(sz)}
                className={`rounded-xl text-xs font-bold ${selectedSize === sz ? "bg-purple-600 text-white" : ""}`}
              >
                {sz.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </ModernModal>
    </div>
  )
}
