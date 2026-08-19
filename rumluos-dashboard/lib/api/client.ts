// ============================================================
// Axios API client with unified response unwrapping.
// Success responses resolve to `.data` directly; error
// responses throw ApiError carrying `.message` and `.error`.
// ============================================================

import axios, { AxiosError } from "axios"
import type { InternalAxiosRequestConfig } from "axios"
import { refreshAuthCookies } from "@/app/actions/auth"
import type { ApiResponse } from "@/lib/types"

export class ApiError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
  }
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

let refreshRequest: Promise<boolean> | null = null

function readCookie(name: string) {
  if (typeof window === "undefined") return null
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function getRefreshRequest() {
  refreshRequest ??= refreshAuthCookies().finally(() => {
    refreshRequest = null
  })
  return refreshRequest
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: process.env.NEXT_PUBLIC_API_TIMEOUT ? parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT, 10) : 10000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

// Attach Authorization header if access token cookie is set and X-Company-Id if set
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = readCookie("rumluos_access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const companyId = readCookie("rumluos_company_id") || localStorage.getItem("rumluos_company_id")
    if (companyId) {
      config.headers["X-Company-Id"] = companyId
    }
  }
  return config
})

// Unwrap `{ success, data }` for successes; normalize errors.
api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>
    if (body && typeof body === "object" && "success" in body) {
      if (body.success) {
        response.data = body.data
        return response
      }
      throw new ApiError(body.message, body.error, response.status)
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const isUnauthorized = error.response?.status === 401
    const requestUrl = originalRequest?.url ?? ""
    const isAuthRequest = requestUrl.includes("/auth/login") || requestUrl.includes("/auth/refresh-token")

    if (typeof window !== "undefined" && isUnauthorized && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true
      const refreshed = await getRefreshRequest()

      if (refreshed) {
        const token = readCookie("rumluos_access_token")
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`
        }
        return api(originalRequest)
      }

      const from = `${window.location.pathname}${window.location.search}`
      window.location.assign(`/sign-in?from=${encodeURIComponent(from)}`)
    }

    const body = error.response?.data as ApiResponse<unknown> | undefined
    if (body && typeof body === "object" && "success" in body && !body.success) {
      throw new ApiError(body.message, body.error, error.response?.status ?? 500)
    }
    throw new ApiError(
      error.message || "Network error, please try again",
      "NETWORK_ERROR",
      error.response?.status ?? 0,
    )
  },
)

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong, please try again"
}
