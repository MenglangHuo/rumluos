"use client"

import React, { useRef } from "react"
import { Printer, Download, CheckCircle2, ShieldCheck, Building2, Phone, Mail, FileText, X } from "lucide-react"
import { useQuickActions } from "@/components/quick-action-modal-context"
import { Badge } from "@/components/ui/badge"

export function PrintReceiptModal() {
  const { isReceiptOpen, closeReceipt, receiptData } = useQuickActions()
  const printRef = useRef<HTMLDivElement>(null)

  if (!isReceiptOpen || !receiptData) return null

  const handlePrint = () => {
    window.print()
  }

  const isPaid = receiptData.status === "PAID"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white dark:bg-slate-900 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Action Controls (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <FileText className="h-4 w-4 text-emerald-500" />
            <span>Official Transaction Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={closeReceipt}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content Area */}
        <div ref={printRef} className="p-8 space-y-6 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
          {/* Studio Brand Header */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-sm">
                  R
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Rumluos Studio
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Multi-Tenant Installment & Loan Management System
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Phnom Penh, Cambodia | Support: +855 23 999 888
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className={`inline-block rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                isPaid
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              }`}>
                {receiptData.status}
              </span>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                No: {receiptData.paymentRef || receiptData.invoiceNo}
              </div>
              <div className="text-[11px] text-slate-400">
                Date: {receiptData.date}
              </div>
            </div>
          </div>

          {/* Customer & Payment Info Summary */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-100 dark:border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To Customer
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {receiptData.customerName || "Valued Customer"}
              </p>
              {receiptData.customerPhone && (
                <p className="text-slate-500 dark:text-slate-400">{receiptData.customerPhone}</p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Payment Channel
              </span>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {receiptData.paymentMethod || "CASH"}
              </p>
              <p className="text-slate-500 dark:text-slate-400">Verified Electronic Receipt</p>
            </div>
          </div>

          {/* Item Breakdown Table */}
          <div className="space-y-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                <tr>
                  <td className="py-3">
                    <p className="font-bold">{receiptData.description || "Installment Payment Settlement"}</p>
                    <p className="text-[11px] text-slate-400">Associated Statement: {receiptData.invoiceNo}</p>
                  </td>
                  <td className="py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                    {receiptData.currency === "KHR" ? "៛" : "$"}{receiptData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
            <div className="text-xs text-slate-400">
              <p className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Computer Generated Official Receipt
              </p>
              <p className="text-[10px]">Thank you for prompt settlement!</p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Amount Paid</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {receiptData.currency === "KHR" ? "៛" : "$"}{receiptData.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
