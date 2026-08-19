"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { companiesApi, profileApi } from "@/lib/api/endpoints"
import { Company } from "@/lib/types"

interface CompanyContextType {
  selectedCompanyId: string | null
  setSelectedCompanyId: (id: string | null) => void
  companies: Company[]
  isLoadingCompanies: boolean
  isSystemAdmin: boolean
}

const CompanyContext = createContext<CompanyContextType>({
  selectedCompanyId: null,
  setSelectedCompanyId: () => {},
  companies: [],
  isLoadingCompanies: false,
  isSystemAdmin: false,
})

const COOKIE_NAME = "rumluos_company_id"

function getStoredCompanyId(): string | null {
  if (typeof window === "undefined") return null
  const localStorageId = localStorage.getItem(COOKIE_NAME)
  if (localStorageId) return localStorageId

  const match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE_NAME + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : null
}

function setStoredCompanyId(id: string | null) {
  if (typeof window === "undefined") return
  if (id) {
    localStorage.setItem(COOKIE_NAME, id)
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  } else {
    localStorage.removeItem(COOKIE_NAME)
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
  }
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const { data: userProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.me,
    staleTime: 5 * 60 * 1000,
  })

  const isSystemAdmin = Boolean(
    userProfile?.isSystemAdmin ||
    userProfile?.grants?.includes("ROLE_SYSTEM_ADMIN") ||
    userProfile?.isSuperAdmin ||
    userProfile?.roles?.some((r: any) => r.name === "system_admin" || r.name === "super_admin")
  )

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies-list-selector"],
    queryFn: () => companiesApi.list({ page: 1, limit: 100 }),
    enabled: isSystemAdmin,
    staleTime: 5 * 60 * 1000,
  })

  const companies = companiesData?.items || []

  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(getStoredCompanyId)

  useEffect(() => {
    if (!isSystemAdmin) return

    if (companies.length > 0) {
      const currentStored = getStoredCompanyId()
      const exists = companies.some((c) => String(c.id) === String(currentStored))

      if (!currentStored || !exists) {
        const firstCompanyId = String(companies[0].id)
        setSelectedCompanyIdState(firstCompanyId)
        setStoredCompanyId(firstCompanyId)
      } else {
        setSelectedCompanyIdState(String(currentStored))
      }
    }
  }, [companies, isSystemAdmin])

  const setSelectedCompanyId = (id: string | null) => {
    setSelectedCompanyIdState(id)
    setStoredCompanyId(id)
    queryClient.invalidateQueries()
  }

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        setSelectedCompanyId,
        companies,
        isLoadingCompanies,
        isSystemAdmin,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompanyContext() {
  return useContext(CompanyContext)
}
