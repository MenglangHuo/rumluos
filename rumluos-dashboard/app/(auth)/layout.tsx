import React from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-950">
      {children}
    </div>
  )
}
