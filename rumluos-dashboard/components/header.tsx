"use client"

import { Bell, Sun, Moon, RefreshCw, SlidersHorizontal, Globe, Plus, Sparkles, Command, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useCustomTheme } from "@/components/custom-theme-provider"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useQuery } from "@tanstack/react-query"
import { profileApi, fileUrl } from "@/lib/api/endpoints"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useQuickActions } from "@/components/quick-action-modal-context"
import React from "react"

import { CompanySwitcher } from "@/components/header/company-switcher"

export function Header() {
  const { setTheme, theme } = useTheme()
  const { setIsCustomizerOpen } = useCustomTheme()
  const { setCommandPaletteOpen } = useQuickActions()

  const { data: userProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.me,
    staleTime: 5 * 60 * 1000,
  })

  const userName = userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : "John Smith"
  const userRole = userProfile?.isSystemAdmin ? "@system_admin" : userProfile?.isSuperAdmin ? "@admin" : userProfile?.roles?.[0]?.name ? `@${userProfile.roles[0].name.toLowerCase()}` : "@manager"

  return (
    <header className="sticky top-0 z-20 flex h-20 shrink-0 items-center justify-between border-b border-slate-200/70 bg-white/82 px-4 shadow-sm shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/82 dark:shadow-black/20 md:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" />
        
        {/* Company Switcher for System Admin */}
        <CompanySwitcher />

        {/* Welcome Greeting */}
        <div className="hidden sm:block">
          <h2 className="text-base font-bold leading-snug tracking-tight text-slate-950 dark:text-white">
            Good Morning, {userProfile?.firstName || "John"}
          </h2>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
            Your latest system updates here
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {/* Prominent [+ Quick Action] Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="group relative flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 px-3.5 py-2 text-xs font-bold shadow-md shadow-primary/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary-foreground/90 animate-pulse" />
          <span>+ Quick Action</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-lg border border-primary-foreground/30 bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            <Command className="h-2.5 w-2.5" /> K
          </kbd>
        </button>
        {/* Quick Icon Actions */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200/70 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/70">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Globe className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            onClick={() => setIsCustomizerOpen(true)}
            title="Customize Theme & Base Colors"
          >
            <Palette className="h-4 w-4 text-primary" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            title="Toggle Light/Dark Mode"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3 border-l border-slate-200/70 pl-2 dark:border-slate-800">
          <Avatar className="h-9 w-9 rounded-xl border border-violet-200 dark:border-violet-500/30">
            <AvatarImage src={fileUrl(userProfile?.avatarKey) || ""} alt={userName} />
            <AvatarFallback className="rounded-xl bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">
              {userProfile?.firstName?.[0] || "J"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold leading-snug text-slate-950 dark:text-white">{userName}</span>
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{userRole}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
