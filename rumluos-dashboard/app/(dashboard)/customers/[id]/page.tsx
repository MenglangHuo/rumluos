"use client"

import React, { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { customersApi, loansApi, financeApi, uploadFile, fileUrl } from "@/lib/api/endpoints"
import { Customer, CustomerDocument, Loan, Invoice } from "@/lib/types"
import { useQuickActions } from "@/components/quick-action-modal-context"
import { toast } from "sonner"
import {
  User,
  Phone,
  Mail,
  MapPin,
  IdCard,
  CreditCard,
  Zap,
  Plus,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Briefcase,
  Building,
  ShieldCheck,
  Paperclip,
  Upload,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadgeCell } from "@/components/ui-custom/data-table"
import { ModernSelect } from "@/components/ui-custom/form-controls"
import { Label } from "@/components/ui/label"

const DOC_TYPES = [
  { value: "ID_CARD", label: "National ID Card / Passport" },
  { value: "HOME_BOOK", label: "Home Book / Family Book" },
  { value: "PAYROLL", label: "Payroll / Salary Slip" },
  { value: "BANK_STATEMENT", label: "Bank Statement (3-6 Mos)" },
  { value: "INCOME_PROOF", label: "Income Proof / Business License" },
  { value: "COLLATERAL_DOC", label: "Land Title / Collateral Cert" },
  { value: "OTHER", label: "Other Supporting Document" },
]

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: customerId } = use(params)
  const queryClient = useQueryClient()
  const { openLoanWizard, openQuickPay, openKhqr, openReceipt } = useQuickActions()

  const [selectedDocType, setSelectedDocType] = useState<string>("ID_CARD")
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // 1. Fetch Customer Profile Info
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer-detail", customerId],
    queryFn: () => customersApi.get(customerId),
  })

  // 2. Fetch Loans for Customer
  const { data: loansData } = useQuery({
    queryKey: ["customer-loans", customerId],
    queryFn: () => loansApi.list({ limit: 100 }),
  })

  // Filter loans belonging to this customer
  const customerLoans = loansData?.items?.filter((l) => l.customerId === customerId) || []
  const activeLoans = customerLoans.filter((l) => l.status?.toUpperCase() === "ACTIVE")

  // 3. Fetch Invoices for Customer
  const { data: invoicesData } = useQuery({
    queryKey: ["customer-invoices", customerId],
    queryFn: () => financeApi.listInvoices({ limit: 100 }),
  })

  const customerInvoices = invoicesData?.items?.filter((i) => i.customerId === customerId) || []
  const unpaidInvoices = customerInvoices.filter(
    (i) => i.status?.toUpperCase() === "PENDING" || i.status?.toUpperCase() === "UNPAID" || i.status?.toUpperCase() === "OVERDUE"
  )
  const overdueInvoices = customerInvoices.filter((i) => i.status?.toUpperCase() === "OVERDUE")

  // Customer Update Mutation for document additions
  const updateCustomerMutation = useMutation({
    mutationFn: (updated: Partial<Customer>) => customersApi.update(customerId, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-detail", customerId] })
      toast.success("Customer documents updated")
    },
    onError: () => toast.error("Failed to update documents"),
  })

  const handleProfileFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !customer) return
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
      const existingDocs = customer.documents || []
      updateCustomerMutation.mutate({
        documents: [...existingDocs, newDoc],
      })
    } catch (err) {
      toast.error("Failed to upload document")
    } finally {
      setUploadingDoc(false)
      e.target.value = ""
    }
  }

  const handleDeleteDocument = (docId?: string, index?: number) => {
    if (!customer) return
    const existingDocs = customer.documents || []
    const updated = existingDocs.filter((d: CustomerDocument, i: number) => (docId ? d.id !== docId : i !== index))
    updateCustomerMutation.mutate({ documents: updated })
  }

  // Banner Calculations
  const totalOutstandingBalance = customerLoans.reduce((acc, l) => acc + (l.principal || 0), 0)
  const overdueAmount = overdueInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0)
  const unpaidMonthsRemaining = customerLoans.reduce((acc, l) => acc + (l.numberOfPeriods || 12), 0)

  // Earliest unpaid invoice for [⚡ Collect Due Payment]
  const earliestUnpaidInvoice = unpaidInvoices[0]

  if (isLoadingCustomer) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="h-4 w-4 animate-spin" /> Loading customer profile...
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Customer Not Found</h3>
        <p className="text-sm text-slate-500">The requested customer profile could not be found.</p>
        <Link href="/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
          </Button>
        </Link>
      </div>
    )
  }

  const customerDocs = customer.documents || []

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href="/customers" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-1">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Customers List
          </Link>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {customer.name}
            </h2>
            <StatusBadgeCell status={customer.isActive ? "Active" : "Inactive"} type="account" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            onClick={() =>
              openQuickPay({
                customerId: customer.id,
                invoiceId: earliestUnpaidInvoice?.id,
                amount: earliestUnpaidInvoice?.totalAmount,
                currency: customer.preferredCurrency || "USD",
              })
            }
            className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 shrink-0"
          >
            <Zap className="mr-2 h-4 w-4 fill-current" />
            ⚡ Collect Due Payment
          </Button>

          <Button
            onClick={() =>
              openLoanWizard({
                customerId: customer.id,
              })
            }
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            + Originate Loan
          </Button>
        </div>
      </div>

      {/* PROMINENT FINANCIAL SUMMARY BANNER */}
      <div className="rounded-3xl border border-slate-200/80 bg-linear-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-6 shadow-2xl dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-96 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Loans
            </span>
            <div className="text-3xl font-black text-white flex items-baseline gap-2">
              <span>{activeLoans.length}</span>
              <span className="text-xs font-medium text-slate-400">/ {customerLoans.length} Total</span>
            </div>
            <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Healthy Account Status
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Outstanding Balance
            </span>
            <div className="text-3xl font-black text-emerald-400">
              {customer.preferredCurrency || "$"}{totalOutstandingBalance.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across all financing agreements</p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Overdue Amount
            </span>
            <div className={`text-3xl font-black ${overdueAmount > 0 ? "text-rose-400" : "text-slate-300"}`}>
              {customer.preferredCurrency || "$"}{overdueAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overdueInvoices.length > 0 ? `${overdueInvoices.length} invoice(s) overdue` : "No overdue balance"}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Unpaid Months Remaining
            </span>
            <div className="text-3xl font-black text-sky-400">
              {unpaidMonthsRemaining} <span className="text-xs font-normal text-slate-400">months</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Scheduled repayment horizon</p>
          </div>
        </div>
      </div>

      {/* Customer Info Card & Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Personal Info Card */}
        <Card className="bg-card border-slate-200/80 dark:border-slate-800">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-500" /> Borrower Info Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">{customer.phone || "No phone registered"}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.nationalId && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <IdCard className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">ID: {customer.nationalId}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Occupation:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.occupation || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Industry:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{customer.industry || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Customer Group:</span>
                <Badge variant="outline" className="text-[10px]">{customer.customerGroup || "Standard"}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Preferred Currency:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{customer.preferredCurrency || "USD"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification Files:</span>
                <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {customerDocs.length} File(s)
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Loans, Invoices, & KYC Documents Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="loans" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="loans" className="flex items-center gap-2 text-xs">
                <CreditCard className="h-3.5 w-3.5" /> Loans ({customerLoans.length})
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center gap-2 text-xs">
                <FileText className="h-3.5 w-3.5" /> Statements ({customerInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2 text-xs">
                <Paperclip className="h-3.5 w-3.5" /> Documents ({customerDocs.length})
              </TabsTrigger>
            </TabsList>

            {/* LOANS TAB */}
            <TabsContent value="loans" className="pt-3">
              <Card className="bg-card border-slate-200/80 dark:border-slate-800">
                <CardContent className="p-0">
                  {customerLoans.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 space-y-3">
                      <p>No active or historical loans for this customer.</p>
                      <Button
                        size="sm"
                        onClick={() => openLoanWizard({ customerId: customer.id })}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Originate First Loan
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customerLoans.map((loan) => (
                        <div key={loan.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{loan.loanKey}</span>
                              <Badge variant="outline" className="text-[10px]">{loan.status}</Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{loan.description || "Installment Loan"}</p>
                            <div className="text-[11px] text-slate-400 flex items-center gap-3">
                              <span>Term: {loan.term}</span>
                              <span>Method: {loan.interestMethod}</span>
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              {loan.currency || "$"} {loan.principal?.toLocaleString()}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                              onClick={() =>
                                openQuickPay({
                                  customerId: customer.id,
                                  amount: loan.principal ? Math.round(loan.principal / (loan.numberOfPeriods || 12)) : 100,
                                  currency: loan.currency || "USD",
                                })
                              }
                            >
                              <Zap className="h-3 w-3" /> Quick Pay
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* INVOICES TAB */}
            <TabsContent value="invoices" className="pt-3">
              <Card className="bg-card border-slate-200/80 dark:border-slate-800">
                <CardContent className="p-0">
                  {customerInvoices.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No billing statements generated yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customerInvoices.map((inv) => (
                        <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{inv.invoiceNo}</span>
                              <StatusBadgeCell status={inv.status} type="account" />
                            </div>
                            <p className="text-xs text-slate-500">{inv.description || "Monthly Installment Invoice"}</p>
                            <span className="text-[11px] text-slate-400">
                              Due Date: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}
                            </span>
                          </div>

                          <div className="text-right space-y-1">
                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {inv.currency || "$"} {inv.totalAmount?.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                                onClick={() =>
                                  openKhqr({
                                    invoiceNo: inv.invoiceNo,
                                    amount: inv.totalAmount,
                                    currency: inv.currency || "USD",
                                    customerName: customer.name,
                                  })
                                }
                              >
                                KHQR
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2"
                                onClick={() =>
                                  openReceipt({
                                    invoiceNo: inv.invoiceNo,
                                    customerName: customer.name,
                                    customerPhone: customer.phone,
                                    amount: inv.totalAmount,
                                    currency: inv.currency || "USD",
                                    date: new Date().toISOString().split("T")[0],
                                    status: inv.status,
                                    description: inv.description,
                                  })
                                }
                              >
                                Receipt
                              </Button>

                              <Button
                                size="sm"
                                className="h-7 text-[11px] px-2.5 bg-sky-600 hover:bg-sky-700 text-white"
                                onClick={() =>
                                  openQuickPay({
                                    customerId: customer.id,
                                    invoiceId: inv.id,
                                    amount: inv.totalAmount,
                                    currency: inv.currency || "USD",
                                    invoiceNo: inv.invoiceNo,
                                  })
                                }
                              >
                                Pay Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* KYC & VERIFICATION DOCUMENTS TAB */}
            <TabsContent value="documents" className="pt-3 space-y-4">
              <Card className="bg-card border-slate-200/80 dark:border-slate-800">
                <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verification & KYC Documents
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Customer ID card, family homebook, salary slips, and collateral proofs.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Upload Control */}
                  <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
                        <Label htmlFor="profile-doc-upload" className="cursor-pointer block">
                          <div className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs">
                            {uploadingDoc || updateCustomerMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" /> Upload Document
                              </>
                            )}
                          </div>
                        </Label>
                        <input
                          id="profile-doc-upload"
                          type="file"
                          className="hidden"
                          disabled={uploadingDoc || updateCustomerMutation.isPending}
                          onChange={handleProfileFileUpload}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documents List */}
                  {customerDocs.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No verification documents attached yet. Use the control above to upload files.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customerDocs.map((doc: CustomerDocument, idx: number) => (
                        <div key={doc.id || idx} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Paperclip className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-foreground truncate">{doc.fileName}</p>
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
                                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline px-2 py-1 rounded bg-sky-50 dark:bg-sky-950/40"
                              >
                                <ExternalLink className="h-3 w-3" /> View Document
                              </a>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              onClick={() => handleDeleteDocument(doc.id, idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
