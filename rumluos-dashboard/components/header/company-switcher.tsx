"use client"

import React from "react"
import { Building2, ChevronDown, Check } from "lucide-react"
import { useCompanyContext } from "@/components/providers/company-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function CompanySwitcher() {
  const { selectedCompanyId, setSelectedCompanyId, companies, isLoadingCompanies, isSystemAdmin } =
    useCompanyContext()

  if (!isSystemAdmin) {
    return null
  }

  const selectedCompany = companies.find((c) => String(c.id) === String(selectedCompanyId))

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-xl border-blue-200/80 bg-blue-50/50 px-3 text-xs font-semibold text-blue-900 shadow-2xs transition-all hover:bg-blue-100/70 hover:text-blue-950 dark:border-blue-800/80 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/60"
          />
        }>
          <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="max-w-[140px] truncate font-bold">
            {isLoadingCompanies
              ? "Loading Companies..."
              : selectedCompany
              ? selectedCompany.name
              : "Select Company"}
          </span>
          <ChevronDown className="h-3 w-3 text-blue-500 opacity-70 shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-56 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95"
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Switch Target Company Context
          </div>
          {companies.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">No companies found</div>
          ) : (
            companies.map((company) => {
              const isSelected = String(company.id) === String(selectedCompanyId)
              return (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setSelectedCompanyId(String(company.id))}
                  className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-bold dark:bg-blue-950/60 dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                    <span className="truncate">{company.name}</span>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </DropdownMenuItem>
              )
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
