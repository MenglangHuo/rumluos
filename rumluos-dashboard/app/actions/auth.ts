"use server"

import { cookies } from "next/headers"
import { decodeToken, encodeToken } from "@/lib/server/api"
import { resolveProfile } from "@/lib/server/db"

const ACCESS_COOKIE = "rumluos_access_token"
const REFRESH_COOKIE = "rumluos_refresh_token"
const ACCESS_TTL = 1000 * 60 * 60

type RefreshResponse = {
  accessToken?: string
  refreshToken?: string
  token?: string
  data?: RefreshResponse
  success?: boolean
}

function getApiBaseUrl() {
  return process.env.API_INTERNAL_URL || null
}

function unwrapRefreshResponse(body: RefreshResponse | null): RefreshResponse | null {
  if (!body) return null
  if (body.data && typeof body.data === "object") return body.data
  return body
}

export async function setAuthCookies(accessToken: string, refreshToken?: string, companyId?: string | number | null) {
  const cookieStore = await cookies()
  
  // Example decode to find expiration, or just set it for a default long time
  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  if (refreshToken) {
    cookieStore.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  if (companyId != null) {
    cookieStore.set("rumluos_company_id", String(companyId), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })
  }
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
}

export async function refreshAuthCookies() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (!refreshToken) return false

  const apiBaseUrl = getApiBaseUrl()

  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}`,
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      })

      if (!response.ok) {
        await clearAuthCookies()
        return false
      }

      const body = unwrapRefreshResponse((await response.json().catch(() => null)) as RefreshResponse | null)
      const accessToken = body?.accessToken || body?.token
      if (!accessToken) {
        await clearAuthCookies()
        return false
      }

      await setAuthCookies(accessToken, body.refreshToken || refreshToken)
      return true
    } catch {
      await clearAuthCookies()
      return false
    }
  }

  const payload = decodeToken(refreshToken)
  if (!payload || payload.type !== "refresh") {
    await clearAuthCookies()
    return false
  }

  const profile = resolveProfile(payload.sub)
  if (!profile || !profile.active) {
    await clearAuthCookies()
    return false
  }

  const accessToken = encodeToken({
    sub: payload.sub,
    username: payload.username,
    type: "access",
    exp: Date.now() + ACCESS_TTL,
  })

  await setAuthCookies(accessToken, refreshToken)
  return true
}
