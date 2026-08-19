"use client"

import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { useQuery } from "@tanstack/react-query"
import type { ApexOptions } from "apexcharts"
import {
  dashboardApi,
  customersApi,
  productsApi,
  loansApi,
  staffApi,
  usersApi,
  financeApi,
  fileUrl,
} from "@/lib/api/endpoints"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  Landmark,
  Loader2,
  Package,
  SlidersHorizontal,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

const chartColors = ["#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706", "#ea580c"]
const cardClass =
  "rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur transition-all dark:border-slate-800/80 dark:bg-slate-900/78 dark:shadow-black/20"

function compactNumber(value: number) {
  return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return {
    isDark,
    text: isDark ? "#cbd5e1" : "#475569",
    muted: isDark ? "#64748b" : "#94a3b8",
    grid: isDark ? "#1e293b" : "#e2e8f0",
    tooltipTheme: (isDark ? "dark" : "light") as "dark" | "light",
  }
}

function StatTile({
  title,
  value,
  badge,
  color,
  icon: Icon,
}: {
  title: string
  value: string | number
  badge: string
  color: string
  icon: typeof Users
}) {
  return (
    <div className={`${cardClass} flex min-h-32 flex-col justify-between p-4 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18`, color }}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-950 dark:text-white">{value}</span>
          <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${color}18`, color }}>
            {badge}
          </span>
        </div>
      </div>
    </div>
  )
}

function TrendCard({
  value,
  label,
  tone,
  icon: Icon,
}: {
  value: number
  label: string
  tone: "emerald" | "amber" | "rose" | "blue"
  icon: typeof ArrowUpRight
}) {
  const tones = {
    emerald: "bg-emerald-500 text-white shadow-emerald-500/20",
    amber: "bg-amber-500 text-white shadow-amber-500/20",
    rose: "bg-rose-500 text-white shadow-rose-500/20",
    blue: "bg-blue-500 text-white shadow-blue-500/20",
  }

  return (
    <div className={`${cardClass} flex min-h-36 flex-col justify-between overflow-hidden p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-3xl font-black text-slate-950 dark:text-white">{value}</span>
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300">
            4% up
          </span>
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</h3>
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">All time activity</p>
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const chartTheme = useChartTheme()

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.stats,
    retry: false,
  })

  const { data: customersData } = useQuery({
    queryKey: ["customers-summary"],
    queryFn: () => customersApi.list({ page: 1, limit: 10 }),
  })
  const { data: productsData } = useQuery({
    queryKey: ["products-summary"],
    queryFn: () => productsApi.list({ page: 1, limit: 10 }),
  })
  const { data: loansData } = useQuery({
    queryKey: ["loans-summary"],
    queryFn: () => loansApi.list({ page: 1, limit: 10 }),
  })
  const { data: staffData } = useQuery({
    queryKey: ["staff-summary"],
    queryFn: () => staffApi.list({ page: 1, limit: 10 }),
  })
  const { data: usersData } = useQuery({
    queryKey: ["users-summary"],
    queryFn: () => usersApi.list({ page: 1, limit: 10 }),
  })
  const { data: invoicesData } = useQuery({
    queryKey: ["invoices-summary"],
    queryFn: () => financeApi.listInvoices({ page: 1, limit: 10 }),
  })

  const totalUsers = statsData?.users ?? usersData?.total ?? 232
  const totalStaff = statsData?.staff ?? staffData?.total ?? 87
  const totalProducts = statsData?.roles ?? productsData?.total ?? 22
  const totalLoans = loansData?.total ?? 18
  const totalCustomers = statsData?.companies ?? customersData?.total ?? 3840
  const invoiceTotal = invoicesData?.total ?? 265

  const donutData = [
    { name: "Scarlett Evans", value: 35 },
    { name: "Daniel Baker", value: 25 },
    { name: "Chloe Foster", value: 15 },
    { name: "Avery Nelson", value: 12 },
    { name: "Oliver Roberts", value: 8 },
    { name: "Christian Brooks", value: 5 },
  ]

  const monthlyActivityData = [
    { name: "Jul", collected: 40, pending: 60, overdue: 20 },
    { name: "Aug", collected: 65, pending: 40, overdue: 35 },
    { name: "Sep", collected: 30, pending: 80, overdue: 45 },
    { name: "Oct", collected: 85, pending: 50, overdue: 25 },
    { name: "Nov", collected: 45, pending: 30, overdue: 60 },
    { name: "Dec", collected: 70, pending: 90, overdue: 40 },
    { name: "Jan", collected: 55, pending: 65, overdue: 30 },
    { name: "Feb", collected: 80, pending: 40, overdue: 50 },
    { name: "Mar", collected: 60, pending: 75, overdue: 35 },
    { name: "Apr", collected: 90, pending: 55, overdue: 70 },
    { name: "May", collected: 50, pending: 85, overdue: 40 },
    { name: "Jun", collected: 75, pending: 60, overdue: 65 },
  ]

  const categoryData = [
    { name: "Technical Support", value: 45, color: "#ea580c" },
    { name: "Billing And Payments", value: 30, color: "#7c3aed" },
    { name: "Loan Origination", value: 25, color: "#059669" },
  ]

  const donutOptions: ApexOptions = {
    chart: { type: "donut", background: "transparent", toolbar: { show: false } },
    colors: chartColors,
    labels: donutData.map((item) => item.name),
    dataLabels: { enabled: false },
    stroke: { width: 4, colors: [chartTheme.isDark ? "#0f172a" : "#ffffff"] },
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "68%",
          labels: {
            show: true,
            name: { show: false },
            value: { show: true, color: chartTheme.text, fontSize: "22px", fontWeight: 800 },
            total: {
              show: true,
              label: "Share",
              color: chartTheme.muted,
              formatter: () => "100%",
            },
          },
        },
      },
    },
    tooltip: { theme: chartTheme.tooltipTheme, y: { formatter: (value) => `${value}%` } },
  }

  const barOptions: ApexOptions = {
    chart: { type: "bar", background: "transparent", toolbar: { show: false }, stacked: false },
    colors: ["#059669", "#7c3aed", "#ea580c"],
    dataLabels: { enabled: false },
    grid: { borderColor: chartTheme.grid, strokeDashArray: 4 },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      labels: { colors: chartTheme.text },
      markers: { size: 6 },
    },
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: "44%", borderRadiusApplication: "end" },
    },
    xaxis: {
      categories: monthlyActivityData.map((item) => item.name),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: chartTheme.muted, fontSize: "11px" } },
    },
    yaxis: { labels: { style: { colors: chartTheme.muted, fontSize: "11px" } } },
    tooltip: { theme: chartTheme.tooltipTheme },
  }

  const radialOptions: ApexOptions = {
    chart: { type: "radialBar", background: "transparent", toolbar: { show: false } },
    colors: categoryData.map((item) => item.color),
    labels: categoryData.map((item) => item.name),
    stroke: { lineCap: "round" },
    plotOptions: {
      radialBar: {
        hollow: { size: "44%" },
        track: { background: chartTheme.isDark ? "#1e293b" : "#e2e8f0", strokeWidth: "90%" },
        dataLabels: {
          name: { show: false },
          value: { show: false },
          total: {
            show: true,
            label: "Total",
            color: chartTheme.muted,
            formatter: () => String(invoiceTotal),
          },
        },
      },
    },
    tooltip: { enabled: true, theme: chartTheme.tooltipTheme, y: { formatter: (value) => `${value}%` } },
  }

  const rows =
    customersData?.items && customersData.items.length > 0
      ? customersData.items.slice(0, 5).map((cust, i) => ({
          id: `TCK-00${i + 101}`,
          name: cust.name,
          email: cust.email || cust.phone || "support@client.com",
          date: cust.createdAt ? cust.createdAt.split("T")[0] : "2026-07-22",
          subject: cust.industry ? `${cust.industry} query` : "General platform support",
          status: i % 3 === 0 ? "Resolved" : i % 3 === 1 ? "In Progress" : "Pending",
          imageUrl: cust.imageUrl || "",
        }))
      : [
          { id: "TCK-001", name: "Scarlett Evans", email: "scarlett@example.com", date: "2026-07-20", subject: "Payment gateway integration", status: "Resolved", imageUrl: "" },
          { id: "TCK-002", name: "Daniel Baker", email: "daniel@example.com", date: "2026-07-21", subject: "Loan restructuring inquiry", status: "In Progress", imageUrl: "" },
          { id: "TCK-003", name: "Avery Nelson", email: "avery@example.com", date: "2026-07-21", subject: "User permission configuration", status: "Pending", imageUrl: "" },
          { id: "TCK-004", name: "Oliver Roberts", email: "oliver@example.com", date: "2026-07-22", subject: "Invoice PDF generation error", status: "Resolved", imageUrl: "" },
        ]

  return (
    <div className="space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-[linear-gradient(135deg,#f7fee7,#eff6ff_46%,#fdf2f8)] p-6 shadow-sm dark:border-slate-800/80 dark:bg-[linear-gradient(135deg,rgba(20,83,45,0.24),rgba(30,41,59,0.92)_48%,rgba(76,29,149,0.22))] sm:p-8">
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-300">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                Live operating overview
              </div>
              <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Quick Overview</h1>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Key platform metrics across customers, loans, finance, and teams.
              </p>
            </div>
            {isLoadingStats && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Refreshing stats
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile title="Total Users" value={totalUsers} badge="+420 New" color="#7c3aed" icon={Users} />
            <StatTile title="Total Agents" value={totalStaff} badge="+31 New" color="#2563eb" icon={Briefcase} />
            <StatTile title="Categories" value={totalProducts} badge="+2 New" color="#0891b2" icon={Package} />
            <StatTile title="Total Loans" value={totalLoans} badge="6 Recent" color="#059669" icon={Landmark} />
            <StatTile title="Customers" value={compactNumber(totalCustomers)} badge="+1237 New" color="#d97706" icon={Users} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`${cardClass} p-6 lg:col-span-5`}>
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Workload By User</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">Distribution across key personnel</p>
          </div>

          <div className="my-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
            <div className="h-56 sm:col-span-6">
              <Chart options={donutOptions} series={donutData.map((item) => item.value)} type="donut" height="100%" />
            </div>
            <div className="space-y-2 text-xs sm:col-span-6">
              {donutData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                    <span className="truncate font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
          <TrendCard value={invoiceTotal} label="Total Tickets" tone="emerald" icon={ArrowUpRight} />
          <TrendCard value={256} label="Pending Tickets" tone="amber" icon={Clock} />
          <TrendCard value={43} label="Solved Tickets" tone="blue" icon={CheckCircle2} />
          <TrendCard value={12} label="Closed Tickets" tone="rose" icon={XCircle} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`${cardClass} p-6 lg:col-span-7`}>
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Monthly Activity</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">Collected, pending, and overdue workload trends</p>
          </div>

          <div className="my-4 h-72 w-full">
            <Chart
              options={barOptions}
              series={[
                { name: "Collected", data: monthlyActivityData.map((item) => item.collected) },
                { name: "Pending", data: monthlyActivityData.map((item) => item.pending) },
                { name: "Overdue", data: monthlyActivityData.map((item) => item.overdue) },
              ]}
              type="bar"
              height="100%"
            />
          </div>

          <div className="grid gap-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800 sm:grid-cols-3">
            {[
              { label: "Total Tickets", value: 234, color: "#059669" },
              { label: "Open Tickets", value: 16, color: "#7c3aed" },
              { label: "Closed Tickets", value: 43, color: "#ea580c" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl p-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}18`, color: item.color }}>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
                <div>
                  <span className="block text-sm font-bold text-slate-950 dark:text-white">{item.value}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${cardClass} p-6 lg:col-span-5`}>
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Tickets By Category</h2>
            <p className="mt-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">Category distribution breakdown</p>
          </div>

          <div className="my-2 h-56 w-full">
            <Chart options={radialOptions} series={categoryData.map((item) => item.value)} type="radialBar" height="100%" />
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="rounded-md px-2 py-0.5 font-bold" style={{ backgroundColor: `${item.color}18`, color: item.color }}>
                  {idx === 1 ? "down" : "up"} {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${cardClass} space-y-4 p-6`}>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Recent Publications</h2>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Latest tickets and customer transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-900">
              <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> Export
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-900">
              <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 text-slate-500 dark:text-slate-400" /> All Time
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-slate-900">
              <TableRow className="border-b border-slate-100 dark:border-slate-800">
                <TableHead className="text-xs font-bold text-slate-500 dark:text-slate-400">Ticket ID</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 dark:text-slate-400">Full Name</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 dark:text-slate-400">Email / Contact</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 dark:text-slate-400">Created On</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 dark:text-slate-400">Subject</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 dark:text-slate-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="border-b border-slate-100/70 hover:bg-slate-50/70 dark:border-slate-800/70 dark:hover:bg-slate-800/45">
                  <TableCell className="text-xs font-bold text-slate-800 dark:text-slate-200">{row.id}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-950 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 rounded-lg">
                        <AvatarImage src={fileUrl(row.imageUrl) || ""} alt={row.name} />
                        <AvatarFallback className="rounded-lg bg-violet-100 text-[10px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
                          {row.name?.[0] || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{row.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 dark:text-slate-400">{row.email}</TableCell>
                  <TableCell className="text-xs text-slate-500 dark:text-slate-400">{row.date}</TableCell>
                  <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.subject}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-semibold ${
                        row.status === "Resolved"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-300"
                          : row.status === "In Progress"
                          ? "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-300"
                          : "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300"
                      }`}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
