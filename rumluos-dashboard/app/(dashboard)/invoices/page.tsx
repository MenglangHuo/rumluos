"use client"

import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { financeApi, customersApi } from "@/lib/api/endpoints"
import { Invoice } from "@/lib/types"
import { useQuickActions } from "@/components/quick-action-modal-context"
import {
  DataTable,
  ColumnDef,
  StatusBadgeCell,
  RowAction,
} from "@/components/ui-custom/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Receipt, QrCode, Printer, Zap, Eye } from "lucide-react"
import { InvoiceDetailsModal } from "@/components/invoice-details-modal"
import { LoanDetailsModal } from "@/components/loan-details-modal"

export default function InvoicesPage() {
  const { openQuickPay, openKhqr, openReceipt } = useQuickActions()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null)

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ["invoices-page", { page, pageSize, search }],
    queryFn: () => financeApi.listInvoices({ page, limit: pageSize, search }),
  })

  const { data: customersData } = useQuery({
    queryKey: ["customers-list-invoices-page"],
    queryFn: () => customersApi.list({ limit: 100 }),
  })

  const columns: ColumnDef<Invoice>[] = [
    {
      id: "invoiceNo",
      header: "Invoice No.",
      accessorKey: "invoiceNo",
      sortable: true,
      cell: ({ row }) => (
        <div>
          <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {row.invoiceNo || String(row.id).slice(0, 8)}
          </div>
          {row.loanId && <div className="text-[11px] text-muted-foreground">Loan: {String(row.loanId)}</div>}
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      accessorFn: (inv) => {
        const c = customersData?.items.find((cust) => String(cust.id) === String(inv.customerId))
        return c ? c.name : String(inv.customerId)
      },
      cell: ({ row }) => {
        const c = customersData?.items.find((cust) => String(cust.id) === String(row.customerId))
        return <div className="font-medium text-xs text-foreground">{c ? c.name : String(row.customerId)}</div>
      },
    },
    {
      id: "description",
      header: "Description",
      accessorKey: "description",
      cell: ({ value }) => <span className="text-xs text-muted-foreground">{value || "—"}</span>,
    },
    {
      id: "dates",
      header: "Issue / Due Date",
      cell: ({ row }) => (
        <div className="text-xs">
          <div>Issued: {row.issuedAt ? new Date(row.issuedAt).toLocaleDateString() : "—"}</div>
          <div className="text-muted-foreground">Due: {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : "—"}</div>
        </div>
      ),
    },
    {
      id: "totalAmount",
      header: "Amount",
      accessorKey: "totalAmount",
      sortable: true,
      cell: ({ row }) => (
        <span className="font-semibold text-xs text-foreground">
          {row.currency || "$"} {row.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      filterType: "select",
      filterOptions: [
        { label: "Paid", value: "PAID" },
        { label: "Pending", value: "PENDING" },
        { label: "Overdue", value: "OVERDUE" },
      ],
      cell: ({ value }) => {
        const s = String(value || "PENDING").toUpperCase()
        if (s === "PAID" || s === "SUCCESS") return <StatusBadgeCell status="Paid" type="account" />
        if (s === "OVERDUE") return <StatusBadgeCell status="Overdue" customVariant="danger" />
        return <StatusBadgeCell status={s} type="email" customVariant="pending" />
      },
    },
  ]

  const invoiceCustomActions: RowAction<Invoice>[] = [
    {
      label: "View Invoice & Payments",
      icon: <Eye className="h-3.5 w-3.5 text-sky-500" />,
      onClick: (inv) => setSelectedInvoiceId(inv.id),
    },
    {
      label: "Quick Pay",
      icon: <Zap className="h-3.5 w-3.5 text-amber-500 fill-current" />,
      onClick: (inv) =>
        openQuickPay({
          customerId: inv.customerId,
          invoiceId: inv.id,
          amount: inv.totalAmount,
          currency: inv.currency || "USD",
          invoiceNo: inv.invoiceNo,
        }),
    },
    {
      label: "Generate ABA QR",
      icon: <QrCode className="h-3.5 w-3.5 text-rose-500" />,
      onClick: (inv) => {
        const c = customersData?.items.find((cust) => String(cust.id) === String(inv.customerId))
        openKhqr({
          invoiceNo: inv.invoiceNo || String(inv.id).slice(0, 8),
          amount: inv.totalAmount,
          currency: inv.currency || "USD",
          customerName: c?.name,
        })
      },
    },
    {
      label: "Print Receipt",
      icon: <Printer className="h-3.5 w-3.5 text-sky-500" />,
      onClick: (inv) => {
        const c = customersData?.items.find((cust) => String(cust.id) === String(inv.customerId))
        openReceipt({
          invoiceNo: inv.invoiceNo,
          customerName: c?.name,
          customerPhone: c?.phone,
          amount: inv.totalAmount,
          currency: inv.currency || "USD",
          date: inv.issuedAt ? new Date(inv.issuedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          status: inv.status || "PENDING",
          description: inv.description,
        })
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing Invoices</h2>
          <p className="text-muted-foreground text-sm">
            Manage billing statements, 1-click quick payments, and instant KHQR QR codes.
          </p>
        </div>
        <Button onClick={() => openQuickPay()} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
          <Zap className="mr-2 h-4 w-4 fill-current" /> Quick Payment
        </Button>
      </div>

      <DataTable<Invoice>
        data={invoicesData?.items || []}
        columns={columns}
        getRowId={(i) => i.id}
        title="Invoices & Statements"
        searchPlaceholder="Search invoice no, customer, description..."
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val)
          setPage(1)
        }}
        createButtonLabel="Quick Collect"
        onCreateNew={() => openQuickPay()}
        manualPagination={true}
        totalCount={invoicesData?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        customRowActions={invoiceCustomActions}
        exportFilename="invoices-statements"
      />

      {/* Invoice Inspector Drawer */}
      <InvoiceDetailsModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        onSelectLoanId={setSelectedLoanId}
      />

      {/* Connected Loan Details Inspector Drawer */}
      <LoanDetailsModal
        loanId={selectedLoanId}
        onClose={() => setSelectedLoanId(null)}
      />
    </div>
  )
}
