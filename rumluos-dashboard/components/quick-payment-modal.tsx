"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { financeApi, customersApi, loansApi } from "@/lib/api/endpoints"
import { Customer, Invoice, Payment } from "@/lib/types"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import {
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react"

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
} from "@/components/ui-custom/form-controls"
import { useQuickActions } from "@/components/quick-action-modal-context"

export function QuickPaymentModal() {
  const {
    isQuickPayOpen,
    closeQuickPay,
    quickPayInitialData,
    openKhqr,
    openReceipt,
  } = useQuickActions()

  const queryClient = useQueryClient()

  // Fetch Customers & Invoices for selection
  const { data: customersData } = useQuery({
    queryKey: ["customers-list-pay"],
    queryFn: () => customersApi.list({ limit: 100 }),
    enabled: isQuickPayOpen,
  })

  const { data: invoicesData } = useQuery({
    queryKey: ["invoices-list-pay"],
    queryFn: () => financeApi.listInvoices({ limit: 100 }),
    enabled: isQuickPayOpen,
  })

  const [selectedCustomerId, setSelectedCustomerId] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("ABA_PAY")
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [currency, setCurrency] = useState("USD")
  const [reference, setReference] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")

  // Pre-fill initial data when opened from Customer Profile, Finance, or Invoices table
  useEffect(() => {
    if (quickPayInitialData) {
      if (quickPayInitialData.customerId) setSelectedCustomerId(quickPayInitialData.customerId)
      if (quickPayInitialData.invoiceId) setSelectedInvoiceId(quickPayInitialData.invoiceId)
      if (quickPayInitialData.amount !== undefined) setPaymentAmount(quickPayInitialData.amount)
      if (quickPayInitialData.currency) setCurrency(quickPayInitialData.currency)
    } else {
      setReference(`PAY-${Math.floor(100000 + Math.random() * 900000)}`)
    }
  }, [quickPayInitialData, isQuickPayOpen])

  // Handle invoice selection auto-fill
  const handleSelectInvoice = (invId: string) => {
    setSelectedInvoiceId(invId)
    const inv = invoicesData?.items?.find((i) => i.id === invId)
    if (inv) {
      setPaymentAmount(inv.totalAmount || 0)
      if (inv.currency) setCurrency(inv.currency)
      if (inv.customerId) setSelectedCustomerId(inv.customerId)
    }
  }

  // Selected Invoice info
  const selectedInvoice = invoicesData?.items?.find((i) => i.id === selectedInvoiceId)
  const currentDueAmount = selectedInvoice?.totalAmount || paymentAmount || 0
  const remainingBalance = Math.max(0, currentDueAmount - paymentAmount)

  // Payment process mutation
  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomerId) throw new Error("Please select a customer")
      if (paymentAmount <= 0) throw new Error("Payment amount must be greater than 0")

      const payload: Partial<Payment> = {
        customerId: selectedCustomerId,
        invoiceId: selectedInvoiceId || undefined,
        amountPaid: paymentAmount,
        paymentCurrency: currency,
        paymentMethod,
        reference: reference || `PAY-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentDate,
        notes,
        status: "SUCCESS",
      }

      return await financeApi.processPayment(payload)
    },
    onSuccess: (payment) => {
      const cust = customersData?.items?.find((c) => c.id === selectedCustomerId)
      toast.success("Payment recorded successfully!", {
        description: `Collected ${currency} ${paymentAmount.toLocaleString()} via ${paymentMethod}`,
      })

      queryClient.invalidateQueries({ queryKey: ["payments"] })
      queryClient.invalidateQueries({ queryKey: ["invoices"] })
      queryClient.invalidateQueries({ queryKey: ["customers"] })

      // Open receipt automatically
      openReceipt({
        invoiceNo: selectedInvoice?.invoiceNo || payment.invoiceId || "INV-DIRECT",
        paymentRef: payment.reference || payment.id,
        customerName: cust?.name || "Customer",
        customerPhone: cust?.phone || "",
        amount: paymentAmount,
        currency,
        date: paymentDate,
        paymentMethod,
        status: remainingBalance === 0 ? "PAID" : "PARTIALLY_PAID",
        description: notes || `Settlement payment towards ${selectedInvoice?.invoiceNo || "Account"}`,
      })

      closeQuickPay()
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })

  // KHQR shortcut
  const handleOpenKhqr = () => {
    const cust = customersData?.items?.find((c) => c.id === selectedCustomerId)
    openKhqr({
      invoiceNo: selectedInvoice?.invoiceNo || "INV-QUICK",
      amount: paymentAmount,
      currency,
      customerName: cust?.name || "Valued Customer",
      merchantName: "Rumluos Studio Enterprise",
      reference: reference || `KHQR-${Math.floor(100000 + Math.random() * 900000)}`,
    })
  }

  return (
    <ModernModal
      isOpen={isQuickPayOpen}
      onClose={closeQuickPay}
      title="Quick Payment Settlement"
      subtitle="Collect installment payment, support partial settlements, and generate ABA KHQR codes or printable receipts."
      icon={<CreditCard className="h-5 w-5 text-sky-500" />}
      size="lg"
      isLoading={processPaymentMutation.isPending}
      footer={
        <ModernModalFooter>
          <ModernModalCancelButton onClick={closeQuickPay} />
          
          {paymentMethod === "ABA_PAY" && (
            <button
              type="button"
              onClick={handleOpenKhqr}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-500/20 dark:text-rose-400 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              Generate ABA KHQR
            </button>
          )}

          <ModernModalSubmitButton
            onClick={() => processPaymentMutation.mutate()}
            isLoading={processPaymentMutation.isPending}
            icon={<CheckCircle2 className="h-4 w-4 shrink-0" />}
          >
            Record Payment & Issue Receipt
          </ModernModalSubmitButton>
        </ModernModalFooter>
      }
    >
      <div className="space-y-4 py-1">
        {/* Customer & Invoice Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModernSelect
            label="Customer"
            placeholder="Select customer..."
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
            options={
              customersData?.items?.map((c) => ({
                value: c.id,
                label: c.name,
                description: c.phone || c.email,
              })) || []
            }
            searchable
            required
          />

          <ModernSelect
            label="Select Invoice / Schedule Period"
            placeholder="Search invoice or schedule..."
            value={selectedInvoiceId}
            onChange={handleSelectInvoice}
            options={
              invoicesData?.items?.map((inv) => ({
                value: inv.id,
                label: `${inv.invoiceNo || inv.id.slice(0, 8)} (${inv.currency || "$"} ${inv.totalAmount})`,
                description: `Due: ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"} | Status: ${inv.status}`,
              })) || []
            }
            searchable
          />
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 block">
            Payment Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "ABA_PAY", name: "ABA Pay", icon: QrCode, badge: "KHQR", color: "border-rose-500/40 text-rose-600 dark:text-rose-400 bg-rose-500/5" },
              { id: "CASH", name: "Cash", icon: Banknote, badge: "Instant", color: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" },
              { id: "WING", name: "Wing Pay", icon: CreditCard, badge: "Mobile", color: "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5" },
              { id: "BANK_TRANSFER", name: "Bank Transfer", icon: CreditCard, badge: "Direct", color: "border-sky-500/40 text-sky-600 dark:text-sky-400 bg-sky-500/5" },
            ].map((m) => {
              const Icon = m.icon
              const isSelected = paymentMethod === m.id
              return (
                <div
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                    isSelected
                      ? `ring-2 ring-sky-500 ${m.color} font-bold shadow-md`
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{m.name}</span>
                  <span className="text-[9px] font-semibold opacity-75">{m.badge}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Amount & Partial Payment Calculations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModernInput
            label="Payment Amount"
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
            prefixAddon={<DollarSign className="size-4" />}
            required
          />

          <ModernSelect
            label="Payment Currency"
            value={currency}
            onChange={(val) => setCurrency(val as any)}
            options={[
              { value: "USD", label: "USD ($)" },
              { value: "KHR", label: "KHR (៛)" },
            ]}
          />
        </div>

        {/* Real-time Partial Payment Feedback Banner */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Total Invoice Due: </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {currency} {currentDueAmount.toLocaleString()}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400" />
          <div>
            <span className="text-slate-500 dark:text-slate-400">New Remaining Balance: </span>
            <span className={`font-extrabold ${remainingBalance === 0 ? "text-emerald-500" : "text-amber-500"}`}>
              {currency} {remainingBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Reference & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ModernInput
            label="Reference / Transaction ID"
            placeholder="e.g. TXN-998877"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />

          <ModernDatePicker
            label="Payment Date"
            value={paymentDate}
            onChange={setPaymentDate}
          />
        </div>

        <ModernInput
          label="Internal Payment Memo / Notes (Optional)"
          placeholder="e.g. Partial cash settlement collected at cashier counter..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </ModernModal>
  )
}
