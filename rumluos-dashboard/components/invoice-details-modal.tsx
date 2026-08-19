"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { financeApi } from "@/lib/api/endpoints"
import { InvoiceDetails, Payment } from "@/lib/types"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Receipt,
  CreditCard,
  User,
  Calendar,
  CheckCircle2,
  Zap,
  ArrowRight,
  Printer,
  QrCode,
  DollarSign,
  FileText,
  Loader2,
  Clock,
  Copy,
  Check,
} from "lucide-react"
import {
  ModernModal,
  ModernModalFooter,
  ModernModalCancelButton,
  ModernModalSubmitButton,
} from "@/components/ui-custom/modal"
import { ModernInput, ModernSelect, ModernTextarea } from "@/components/ui-custom/form-controls"

interface InvoiceDetailsModalProps {
  invoiceId: string | null
  onClose: () => void
  onSelectLoanId?: (id: string) => void
}

export function InvoiceDetailsModal({ invoiceId, onClose, onSelectLoanId }: InvoiceDetailsModalProps) {
  const queryClient = useQueryClient()
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [paymentNotes, setPaymentNotes] = useState("")

  const { data: details, isLoading } = useQuery({
    queryKey: ["invoice-details", invoiceId],
    queryFn: () => (invoiceId ? financeApi.getInvoiceDetails(invoiceId) : Promise.reject("No invoice ID")),
    enabled: !!invoiceId,
  })

  const paymentMutation = useMutation({
    mutationFn: (payload: any) => financeApi.processPayment(payload),
    onSuccess: () => {
      toast.success("Payment recorded successfully!")
      queryClient.invalidateQueries({ queryKey: ["invoice-details", invoiceId] })
      queryClient.invalidateQueries({ queryKey: ["invoices-page"] })
      queryClient.invalidateQueries({ queryKey: ["loans"] })
      setIsPayOpen(false)
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  const openPayDialog = () => {
    if (!details?.invoice) return
    setIsPayOpen(true)
    setAmountPaid(details.invoice.totalAmount || 0)
    setPaymentMethod("CASH")
    setPaymentNotes(`Payment for Invoice ${details.invoice.invoiceNo}`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    toast.success("Invoice No copied to clipboard")
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!details?.invoice) return

    paymentMutation.mutate({
      loanId: details.invoice.loanId,
      loanScheduleId: details.invoice.loanScheduleId,
      amountPaid,
      paymentMethod,
      paymentCurrency: details.invoice.currency || "USD",
      paymentDate: new Date().toISOString().split("T")[0],
      notes: paymentNotes,
    })
  }

  const invoice = details?.invoice
  const loan = details?.loan
  const customer = details?.customer
  const payments = details?.payments || []

  const isPaid = invoice?.status === "PAID"

  return (
    <>
      <ModernModal
        isOpen={!!invoiceId}
        onClose={onClose}
        title={invoice ? `Invoice ${invoice.invoiceNo}` : "Billing Invoice Statement"}
        subtitle={invoice ? `Issued Date: ${invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : "N/A"} • Status: ${invoice.status}` : "Invoice Details"}
        icon={<Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
        size="xl"
        isLoading={isLoading}
        loadingText="Loading invoice statement..."
      >
        {invoice ? (
          <div className="space-y-6">
            {/* Top Bar with Status & Copy Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100/70 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Badge variant={isPaid ? "default" : "secondary"} className="font-extrabold text-xs px-3 py-1 uppercase tracking-wider">
                  {invoice.status}
                </Badge>
                <div className="font-mono text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2">
                  <span>Statement No: {invoice.invoiceNo}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copyToClipboard(invoice.invoiceNo)}
                    className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Copy Invoice No"
                  >
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                {invoice.description || "Billing Statement"}
              </div>
            </div>

            {/* Connected Loan Contract Card */}
            {loan && loan.id && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-3 dark:border-emerald-500/20">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-black block">
                      Connected Loan Contract
                    </span>
                    <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5">
                      <CreditCard className="h-5 w-5 text-emerald-500 shrink-0" />
                      <span>Loan Key: {loan.loanKey}</span>
                    </span>
                  </div>
                  {onSelectLoanId && (
                    <Button
                      size="sm"
                      onClick={() => onSelectLoanId(String(loan.id))}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4 gap-1.5 shrink-0 shadow-sm"
                    >
                      <span>View Loan Details</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-4 pt-2 border-t border-emerald-500/10 font-medium">
                  <span>Borrower: <strong>{customer?.name || "Client"}</strong></span>
                  <span>• Financed Principal: <strong>{loan.currency || "USD"} {(loan.principal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                </div>
              </div>
            )}

            {/* Amount Breakdown Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Total Amount Due
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                  {invoice.currency || "USD"} {(invoice.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Payment Due Date:</span>
                <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}
                </span>
              </div>

              {!isPaid && (
                <Button onClick={openPayDialog} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm h-11 gap-2 mt-2 shadow-md">
                  <Zap className="h-4 w-4 fill-current" />
                  <span>Collect Payment Against Invoice</span>
                </Button>
              )}
            </div>

            {/* Payment History Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span>Payment Settlement History ({payments.length} Records)</span>
              </h4>

              <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Payment Ref</th>
                        <th className="py-3 px-4">Payment Date</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4 text-right">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">
                            No payment transactions recorded for this invoice yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                              {p.paymentRef}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                              {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                              {p.paymentMethod || "CASH"}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                              {p.paymentCurrency || "USD"} {(p.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 font-medium">Invoice not found.</div>
        )}
      </ModernModal>

      {/* Collect Payment Dialog */}
      <ModernModal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title={`Payment Collection for ${invoice?.invoiceNo}`}
        subtitle={`Invoice total: ${invoice?.currency || "USD"} ${invoice?.totalAmount?.toLocaleString()}`}
        icon={<Zap className="h-5 w-5 text-emerald-500 fill-current" />}
        size="md"
        isLoading={paymentMutation.isPending}
        footer={
          <ModernModalFooter>
            <ModernModalCancelButton onClick={() => setIsPayOpen(false)} />
            <ModernModalSubmitButton onClick={handlePaySubmit} isLoading={paymentMutation.isPending}>
              Confirm Payment Collection
            </ModernModalSubmitButton>
          </ModernModalFooter>
        }
      >
        <form onSubmit={handlePaySubmit} className="space-y-4 py-2 text-xs">
          <ModernInput
            label="Payment Amount"
            type="number"
            step="any"
            value={amountPaid}
            onChange={(e) => setAmountPaid(Number(e.target.value))}
            required
          />

          <ModernSelect
            label="Payment Method"
            value={paymentMethod}
            onChange={(val) => setPaymentMethod(val as string)}
            options={[
              { value: "CASH", label: "Cash Payment" },
              { value: "BANK_TRANSFER", label: "ABA Bank Transfer / KHQR" },
              { value: "CHIP_MONG", label: "Chip Mong Bank" },
              { value: "CHECK", label: "Check / Cheque" },
            ]}
          />

          <ModernTextarea
            label="Payment Notes / Transaction Ref"
            placeholder="e.g. Counter payment received..."
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            rows={2}
          />
        </form>
      </ModernModal>
    </>
  )
}
