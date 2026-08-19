"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authApi } from "@/lib/api/endpoints"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertCircle, Lock, ArrowLeft } from "lucide-react"
import React, { Suspense } from "react"
import Link from "next/link"

const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const mutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: () => {
      toast.success("Password reset successfully. You can now sign in.")
      router.push("/sign-in")
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!token) return
    mutation.mutate({ token, password: values.password })
  }

  if (!token) {
    return (
      <div className="bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-[32px] p-8 sm:p-10 text-center space-y-4 w-full">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Invalid or Missing Token</h2>
        <p className="text-slate-500 text-sm">Please request a new password reset link.</p>
        <Button className="w-full bg-[#1d232a] hover:bg-[#0f1318] text-white rounded-2xl h-12 text-sm font-medium transition-all" onClick={() => router.push('/forgot-password')}>
          Request Reset Link
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-[32px] p-8 sm:p-10 w-full">
      <Link
        href="/sign-in"
        className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to sign in
      </Link>

      <div className="text-left space-y-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Reset Password
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              id="password"
              type="password"
              placeholder="New Password"
              {...form.register("password")}
              className="pl-11 pr-4 bg-slate-100/70 focus:bg-white border-0 text-slate-900 placeholder:text-slate-400 rounded-2xl h-12 text-sm focus-visible:ring-2 focus-visible:ring-slate-300 transition-all shadow-none"
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-500 pl-2 pt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm New Password"
              {...form.register("confirmPassword")}
              className="pl-11 pr-4 bg-slate-100/70 focus:bg-white border-0 text-slate-900 placeholder:text-slate-400 rounded-2xl h-12 text-sm focus-visible:ring-2 focus-visible:ring-slate-300 transition-all shadow-none"
            />
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-red-500 pl-2 pt-1">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#1d232a] hover:bg-[#0f1318] text-white rounded-2xl h-12 text-sm font-medium transition-all shadow-md active:scale-[0.99] mt-2"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
