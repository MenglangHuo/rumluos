"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authApi } from "@/lib/api/endpoints"
import { setAuthCookies } from "@/app/actions/auth"
import { getErrorMessage } from "@/lib/api/client"
import { toast } from "sonner"
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  LogIn,
  Building2,
  UserCheck,
  Crown,
  Sparkles,
  ShieldCheck,
  Star,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
})

const demoAccounts = [
  {
    role: "System Admin",
    username: "menglang",
    password: "Menglang@dmin!",
    desc: "Global Access",
    icon: Crown,
    activeGradient: "from-blue-600 to-indigo-600",
  },
  {
    role: "Tech Admin",
    username: "tech_admin",
    password: "Password@123",
    desc: "Tech Ops",
    icon: Building2,
    activeGradient: "from-indigo-600 to-purple-600",
  },
  {
    role: "Villa Admin",
    username: "villa_admin",
    password: "Password@123",
    desc: "Villa Ops",
    icon: UserCheck,
    activeGradient: "from-emerald-600 to-teal-600",
  },
]

function getSafeReturnUrl(value: string | null) {
  if (!value || value.startsWith("/sign-in") || value.startsWith("/forgot-password") || value.startsWith("/reset-password")) {
    return "/"
  }
  return value.startsWith("/") && !value.startsWith("//") ? value : "/"
}

function SystemEmblemSvg() {
  return (
    <div className="group/emblem relative flex items-center justify-center cursor-pointer">
      {/* Outer pulsating glow ring */}
      <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-500 opacity-40 blur-xl transition-all duration-500 group-hover/emblem:opacity-80 group-hover/emblem:blur-2xl" />
      
      {/* Main Emblem SVG */}
      <svg className="relative h-20 w-20 transform drop-shadow-2xl transition-transform duration-300 group-hover/emblem:scale-105" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="emblemBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
          <linearGradient id="shieldGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Outer Ring */}
        <circle cx="50" cy="50" r="47" fill="url(#emblemBg)" stroke="#ffffff" strokeWidth="3" />
        <circle cx="50" cy="50" r="41" fill="none" stroke="url(#goldGradient)" strokeWidth="2" strokeDasharray="4 2" />

        {/* Floating Stars Top Left / Top Right */}
        <circle cx="30" cy="26" r="2" fill="#fef08a" />
        <circle cx="70" cy="26" r="2" fill="#fef08a" />

        {/* Inner Shield */}
        <path d="M50 18 L72 30 V56 C72 70 50 82 50 82 C50 82 28 70 28 56 V30 Z" fill="#1e40af" stroke="#ffffff" strokeWidth="2" />
        <path d="M50 20 L70 31 V54 C70 66 50 78 50 78 C50 78 30 66 30 54 V31 Z" fill="url(#shieldGlass)" />

        {/* Sun & Rays */}
        <circle cx="50" cy="40" r="9" fill="url(#goldGradient)" />

        {/* Mountains / Waves */}
        <path d="M34 58 L44 46 L52 54 L60 42 L66 58 Z" fill="#ffffff" opacity="0.95" />
        <path d="M30 58 Q50 64 70 58" stroke="url(#goldGradient)" strokeWidth="2.5" fill="none" />

        {/* Checkmark Accent */}
        <path d="M43 49 L48 54 L58 42" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Laurel Wreath */}
        <path d="M34 72 C40 78 60 78 66 72" stroke="url(#goldGradient)" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function SceneryIllustrationSvg() {
  return (
    <div className="group/scenery relative flex w-full max-w-sm items-center justify-center cursor-pointer">
      <div className="absolute -inset-4 rounded-3xl bg-blue-400/10 blur-2xl transition-all duration-500 group-hover/scenery:bg-cyan-400/20" />
      
      <svg className="relative w-full h-auto transform transition-transform duration-500 group-hover/scenery:scale-[1.02]" viewBox="0 0 500 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skySun" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="bldgGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eff6ff" />
          </linearGradient>
        </defs>

        {/* Soft Background Hills */}
        <path d="M0 240 C120 180 280 195 500 240 V240 H0 Z" fill="#cbd5e1" opacity="0.35" />
        <path d="M0 240 C160 160 340 180 500 215 V240 H0 Z" fill="#93c5fd" opacity="0.3" />

        {/* Radiant Sun Rays */}
        <circle cx="250" cy="130" r="75" fill="url(#skySun)" />
        <circle cx="250" cy="130" r="45" fill="#93c5fd" opacity="0.35" />

        {/* Palm Trees Left */}
        <g stroke="#3b82f6" strokeWidth="3" strokeLinecap="round">
          <path d="M415 240 C425 200 420 170 405 140" fill="none" />
          <path d="M405 140 C385 130 370 140 365 145" />
          <path d="M405 140 C405 120 415 110 430 115" />
          <path d="M405 140 C425 135 440 145 445 155" />
        </g>

        {/* Palm Trees Right */}
        <g stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round">
          <path d="M445 240 C450 210 447 185 437 160" fill="none" />
          <path d="M437 160 C420 152 410 160 405 165" />
          <path d="M437 160 C437 145 445 138 457 142" />
        </g>

        {/* Main Administrative Building */}
        <g fill="url(#bldgGlass)" stroke="#2563eb" strokeWidth="2">
          {/* Main foundation block */}
          <rect x="120" y="150" width="220" height="90" rx="6" />
          {/* Roof Triangular Pediment */}
          <path d="M110 150 L230 90 L350 150 Z" fill="#dbeafe" />
          {/* Top Clock Tower */}
          <rect x="210" y="65" width="40" height="30" rx="3" fill="#ffffff" />
          <path d="M205 65 L230 45 L255 65 Z" fill="#2563eb" />
          <circle cx="230" cy="80" r="7" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
          
          {/* Architectural Pillars */}
          <rect x="150" y="165" width="16" height="75" fill="#bfdbfe" />
          <rect x="190" y="165" width="16" height="75" fill="#bfdbfe" />
          <rect x="254" y="165" width="16" height="75" fill="#bfdbfe" />
          <rect x="294" y="165" width="16" height="75" fill="#bfdbfe" />

          {/* Center Arched Entrance */}
          <path d="M218 240 V185 C218 175 242 175 242 185 V240 Z" fill="#1d4ed8" />

          {/* Windows */}
          <rect x="135" y="165" width="12" height="20" rx="2" fill="#60a5fa" />
          <rect x="313" y="165" width="12" height="20" rx="2" fill="#60a5fa" />
        </g>
      </svg>
    </div>
  )
}

function UserAvatarIllustrationSvg() {
  return (
    <div className="group/avatar relative flex h-16 w-16 items-center justify-center rounded-full cursor-pointer">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 opacity-60 blur-md transition-all duration-300 group-hover/avatar:opacity-100 group-hover/avatar:blur-lg" />
      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-1 shadow-lg ring-2 ring-white dark:ring-slate-800 transform transition-transform duration-300 group-hover/avatar:scale-105">
        <svg className="h-full w-full text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="48" fill="#1e40af" opacity="0.3" />
          <path d="M30 42 C30 25 40 18 50 18 C60 18 70 25 70 42 C65 38 58 35 50 35 C42 35 35 38 30 42 Z" fill="#0f172a" />
          <circle cx="50" cy="45" r="18" fill="#fef08a" />
          <circle cx="44" cy="44" r="2" fill="#0f172a" />
          <circle cx="56" cy="44" r="2" fill="#0f172a" />
          <path d="M45 51 Q50 56 55 51" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M25 85 C25 68 36 62 50 62 C64 62 75 68 75 85 Z" fill="#3b82f6" />
          <path d="M44 62 L50 72 L56 62 Z" fill="#ffffff" />
        </svg>
      </div>
    </div>
  )
}

function SignInForm() {
  const searchParams = useSearchParams()
  const returnUrl = getSafeReturnUrl(searchParams.get("returnUrl") || searchParams.get("from"))
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: true,
    },
  })

  const fillDemoAccount = (acc: (typeof demoAccounts)[0]) => {
    setSelectedDemo(acc.username)
    form.setValue("username", acc.username, { shouldValidate: true })
    form.setValue("password", acc.password, { shouldValidate: true })
    toast.info(`Demo credentials for "${acc.role}" loaded! Click Sign In to proceed.`)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const response: any = await authApi.signIn({
        username: values.username,
        password: values.password,
      })

      const token =
        response?.accessToken ||
        response?.token ||
        response?.data?.accessToken ||
        response?.data?.token

      const refreshToken =
        response?.refreshToken ||
        response?.data?.refreshToken

      if (token) {
        await setAuthCookies(token, refreshToken)
        toast.success("Authentication successful! Welcome to Rumluos System.")
        
        window.location.href = returnUrl
      } else {
        toast.error("Invalid credentials or server response")
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950 lg:flex-row">
      {/* Left Hero Section */}
      <section className="relative hidden h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 p-6 text-white lg:flex lg:w-5/12 xl:w-4/12 xl:p-8">
        {/* Background Ambient Glow Effects */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

        {/* Top Header & Emblem */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <SystemEmblemSvg />
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white xl:text-3xl">
            Rumluos System
          </h1>
          <p className="mt-0.5 text-xs font-semibold tracking-wide text-blue-100">
            System Operations & Management
          </p>
          <p className="mt-0.5 text-[11px] italic text-blue-200/80">
            Tamang Datos, Maayos na System
          </p>
        </div>

        {/* Center Vector Building & Palm Illustration */}
        <div className="relative z-10 my-auto flex justify-center py-2">
          <SceneryIllustrationSvg />
        </div>

        {/* Bottom Footer Copyright */}
        <div className="relative z-10 text-center text-[11px] font-medium text-blue-100/80">
          © {new Date().getFullYear()} Rumluos System. All rights reserved.
        </div>
      </section>

      {/* Right Login Container */}
      <section className="relative flex h-full flex-1 flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        {/* Floating Compact White Card */}
        <div className="w-full max-w-[420px] rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:p-7">
          
          {/* Avatar Header */}
          <div className="flex flex-col items-center text-center">
            <UserAvatarIllustrationSvg />
            <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome Back!
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Sign in to access your system dashboard
            </p>
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-2.5 dark:border-blue-950/50 dark:bg-blue-950/20">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                <Sparkles className="h-3 w-3 text-blue-600" /> Demo Accounts
              </span>
              <span className="text-[9px] font-semibold text-slate-400">1-Click Auto Fill</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon
                const isSelected = selectedDemo === acc.username
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillDemoAccount(acc)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all duration-200 ${
                      isSelected
                        ? `border-blue-600 bg-gradient-to-r ${acc.activeGradient} text-white shadow-md shadow-blue-500/25 scale-[1.02]`
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/80 hover:scale-[1.02] active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 mb-0.5 ${isSelected ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
                    <span className="text-[10px] font-bold truncate w-full">{acc.role}</span>
                    <span className={`text-[9px] truncate w-full ${isSelected ? "text-blue-100" : "text-slate-400"}`}>{acc.username}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
            {/* Email Address / Username Field */}
            <div className="space-y-1">
              <label htmlFor="username" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address or Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="username"
                  placeholder="menglang or name@company.com"
                  autoComplete="username"
                  {...form.register("username")}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                />
              </div>
              {form.formState.errors.username && (
                <p className="text-[11px] font-medium text-rose-500">{form.formState.errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  {...form.register("password")}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 pl-9 pr-10 text-xs text-slate-900 transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-[11px] font-medium text-rose-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            {/* Checkbox and Forgot Password */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 font-medium">
                <Checkbox id="rememberMe" defaultChecked className="rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                <span>Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="mt-2 h-10 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Signing In...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          {/* Security Footer Badges */}
          <div className="mt-5 flex flex-col items-center gap-1.5 border-t border-slate-100 pt-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="flex items-center gap-1 font-medium text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Secure access only
            </span>
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Shield className="h-3 w-3" /> Protected by two-factor authentication
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-100 dark:bg-slate-950"><Loader2 className="h-7 w-7 animate-spin text-blue-600" /></div>}>
      <SignInForm />
    </Suspense>
  )
}
