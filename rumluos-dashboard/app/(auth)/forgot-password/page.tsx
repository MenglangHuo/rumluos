"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { authApi } from "@/lib/api/endpoints"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { getErrorMessage } from "@/lib/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export default function ForgotPasswordPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const mutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      toast.success("Password reset instructions have been sent to your email.")
      form.reset()
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values)
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
          Forgot Password
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Enter your email address and we will send you instructions to reset your password.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...form.register("email")}
              className="pl-11 pr-4 bg-slate-100/70 focus:bg-white border-0 text-slate-900 placeholder:text-slate-400 rounded-2xl h-12 text-sm focus-visible:ring-2 focus-visible:ring-slate-300 transition-all shadow-none"
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-500 pl-2 pt-1">{form.formState.errors.email.message}</p>
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
            "Send Reset Instructions"
          )}
        </Button>
      </form>
    </div>
  )
}
