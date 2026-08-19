"use client"

import * as React from "react"
import {
  Building2,
  Users,
  Briefcase,
  MapPin,
  ShieldAlert,
  LayoutDashboard,
  LogOut,
  Settings,
  Contact,
  Package,
  Landmark,
  Receipt,
  FileText,
  ChevronRight,
  Folder,
  ShieldCheck,
  KeyRound,
  Layers,
  Boxes,
  SlidersHorizontal,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { profileApi, authApi, fileUrl } from "@/lib/api/endpoints"
import { clearAuthCookies } from "@/app/actions/auth"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

function SidebarEmblemSvg() {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20 ring-2 ring-primary/20 transition-colors">
      <svg className="size-5" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="46" stroke="#ffffff" strokeWidth="6" />
        <path d="M50 20 L70 32 V54 C70 66 50 78 50 78 C50 78 30 66 30 54 V32 Z" fill="#ffffff" opacity="0.95" />
        <path d="M40 52 L47 58 L62 44" stroke="var(--primary, #2252E9)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

interface SubMenuItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

interface MenuItem {
  title: string
  url?: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: SubMenuItem[]
}

function SidebarCollapsibleGroup({ item, pathname }: { item: MenuItem; pathname: string }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const isChildActive = item.subItems?.some(
    (sub) => pathname === sub.url || pathname.startsWith(`${sub.url}/`)
  )
  const [isOpen, setIsOpen] = React.useState(Boolean(isChildActive))

  React.useEffect(() => {
    if (isChildActive) {
      setIsOpen(true)
    }
  }, [isChildActive])

  // ==========================================
  // Collapsed Mode Rendering (Icon Rail)
  // ==========================================
  if (isCollapsed) {
    return (
      <SidebarMenuItem className="flex justify-center my-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isChildActive}
              className={`size-10 justify-center rounded-xl transition-all duration-200 ${
                isChildActive
                  ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/25"
                  : "bg-slate-100/90 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            />
          }>
            <item.icon className={`size-5 ${isChildActive ? "text-primary-foreground" : "text-slate-600 dark:text-slate-400"}`} />
          </DropdownMenuTrigger>

          {/* Floating Submenu Dropdown in Collapsed Mode */}
          <DropdownMenuContent
            side="right"
            align="start"
            sideOffset={12}
            className="w-52 rounded-2xl p-1.5 shadow-xl border border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 space-y-1"
          >
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
              {item.title}
            </div>
            {item.subItems?.map((sub) => {
              const active = pathname === sub.url || pathname.startsWith(`${sub.url}/`)
              const SubIcon = sub.icon
              return (
                <DropdownMenuItem
                  key={sub.title}
                  render={<Link href={sub.url} />}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs cursor-pointer transition-all ${
                    active
                      ? "border-l-[3px] border-primary bg-primary/10 text-primary font-bold shadow-sm shadow-primary/10"
                      : "border-l-2 border-transparent bg-slate-100/80 text-slate-700 font-semibold dark:bg-slate-800/60 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <SubIcon className={`size-4 ${active ? "text-primary" : "text-slate-500 dark:text-slate-400"}`} />
                  <span>{sub.title}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    )
  }

  // ==========================================
  // Expanded Mode Tree View Rendering
  // ==========================================
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group/collapsible my-1.5">
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<CollapsibleTrigger />}
          className={`h-10.5 rounded-xl px-3.5 transition-all duration-150 border-l-2 ${
            isChildActive
              ? "bg-primary/12 border-primary text-primary font-bold dark:bg-primary/20 shadow-2xs"
              : "bg-slate-100/80 border-transparent text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100 font-medium"
          }`}
        >
          <div className="flex items-center gap-3 w-full">
            <item.icon
              className={`size-4.5 transition-colors ${
                isChildActive ? "text-primary" : "text-slate-500 dark:text-slate-400"
              }`}
            />
            <span className="text-sm font-semibold flex-1 text-left truncate">{item.title}</span>
            <ChevronRight
              className={`size-3.5 transition-transform duration-200 group-data-open/collapsible:rotate-90 ${
                isChildActive ? "text-primary" : "text-slate-400 dark:text-slate-500"
              }`}
            />
          </div>
        </SidebarMenuButton>

        {/* Tree Structure Submenu */}
        <CollapsibleContent className="pt-1 pb-1">
          <div className="ml-5.5 pl-3.5 border-l border-slate-200 dark:border-slate-800 my-1.5 space-y-1.5 relative">
            {item.subItems?.map((subItem) => {
              const isSubActive = pathname === subItem.url || pathname.startsWith(`${subItem.url}/`)
              const SubIcon = subItem.icon

              return (
                <div key={subItem.title} className="relative flex items-center">
                  {/* Tree Branch Horizontal Line Connector */}
                  <span
                    className={`absolute -left-[15px] top-1/2 -translate-y-1/2 transition-all ${
                      isSubActive
                        ? "w-4 h-[2px] bg-primary"
                        : "w-3 h-[1px] bg-slate-300 dark:bg-slate-700"
                    }`}
                  />

                  {/* Submenu Item Pill: Matches parent active style when active */}
                  <SidebarMenuSubButton
                    render={<Link href={subItem.url} />}
                    isActive={isSubActive}
                    className={`flex items-center gap-2.5 w-full h-9 rounded-xl px-3 text-xs transition-all ${
                      isSubActive
                        ? "border-l-[3px] border-primary bg-primary/10 text-primary font-bold shadow-sm shadow-primary/10"
                        : "border-l-2 border-transparent bg-slate-100/70 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-200 font-medium"
                    }`}
                  >
                    <SubIcon className={`size-3.5 shrink-0 transition-colors ${
                      isSubActive
                        ? "text-primary"
                        : "text-slate-500 dark:text-slate-400"
                    }`} />
                    <span className="truncate">{subItem.title}</span>
                  </SidebarMenuSubButton>
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const { data: userProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.me,
    staleTime: 5 * 60 * 1000,
  })

  const handleSignOut = async () => {
    try {
      await authApi.signOut()
    } catch {
      // ignore
    }
    await clearAuthCookies()
    router.push("/sign-in")
  }

  // Administrator visible ONLY when user login as system_admin / isSuperAdmin
  const isSuperAdmin = Boolean(
    userProfile?.isSystemAdmin ||
    userProfile?.grants?.includes("ROLE_SYSTEM_ADMIN") ||
    userProfile?.isSuperAdmin ||
    userProfile?.username === "menglang" ||
    userProfile?.roles?.some((r: any) => r.name === "super_admin" || r.name === "system_admin")
  )

  // 1. Core Operations & Finance Domain
  const operationsDomain: MenuItem = {
    title: "Operations & Finance",
    icon: Layers,
    subItems: [
      { title: "Customers", url: "/customers", icon: Contact },
      { title: "Loans", url: "/loans", icon: Landmark },
      { title: "Invoices", url: "/invoices", icon: FileText },
      { title: "Finance", url: "/finance", icon: Receipt },
    ],
  }

  // 2. Inventory & Vault Domain
  const inventoryDomain: MenuItem = {
    title: "Inventory & Vault",
    icon: Boxes,
    subItems: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Attachments", url: "/attachments", icon: Folder },
    ],
  }

  // 3. Organization Domain
  const organizationDomain: MenuItem = {
    title: "Organization",
    icon: Building2,
    subItems: [
      { title: "Company Profile", url: "/company", icon: Building2 },
      { title: "Branches", url: "/branches", icon: MapPin },
      { title: "Staff", url: "/staff", icon: Briefcase },
    ],
  }

  // 4. Access & Security Domain
  const securityDomain: MenuItem = {
    title: "User Management",
    icon: Users,
    subItems: [
      { title: "Users", url: "/users", icon: Users },
      { title: "Roles", url: "/roles", icon: ShieldCheck },
      { title: "Permissions", url: "/permissions", icon: KeyRound },
    ],
  }

  // 5. Administrator Domain (SHOW ONLY FOR system_admin / menglang)
  const superAdminDomain: MenuItem = {
    title: "Administrator",
    icon: ShieldAlert,
    subItems: [
      { title: "Companies", url: "/super-admin/companies", icon: Building2 },
      { title: "Configuration", url: "/super-admin/configurations", icon: SlidersHorizontal },
      { title: "System Admins", url: "/super-admin/admins", icon: ShieldAlert },
    ],
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className="border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950 transition-all duration-300"
    >
      {/* Header with App Logo & Title */}
      <SidebarHeader className="p-3 pb-2 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center group-data-[collapsible=icon]:justify-center">
            <Link href="/" className="flex items-center gap-3 overflow-hidden rounded-xl p-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
              <SidebarEmblemSvg />
              <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  Rumluos <span className="text-primary">App</span>
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                  {isSuperAdmin ? "System Admin Portal" : userProfile?.company?.name || "System Operations"}
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation Content */}
      <SidebarContent className="px-3.5 py-2 space-y-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-1 group-data-[collapsible=icon]:space-y-1">
        {/* Core Menu */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-2 mb-1.5 group-data-[collapsible=icon]:hidden">
            CORE
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Dashboard Item */}
              <SidebarMenuItem className="flex group-data-[collapsible=icon]:justify-center my-1.5">
                <SidebarMenuButton
                  render={<Link href="/" />}
                  isActive={pathname === "/"}
                  tooltip="Dashboard"
                  className={`flex items-center gap-3 w-full h-10.5 rounded-xl px-3.5 transition-all border-l-2 ${
                    pathname === "/"
                      ? "bg-primary/12 border-primary text-primary font-bold dark:bg-primary/20 shadow-2xs"
                      : "bg-slate-100/80 border-transparent text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100 font-medium"
                  } group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-l-0`}
                >
                  <LayoutDashboard className={`size-4.5 ${pathname === "/" ? "text-primary" : "text-slate-500 dark:text-slate-400"}`} />
                  <span className="text-sm font-semibold group-data-[collapsible=icon]:hidden">Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management & Domains */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-2 mb-1.5 group-data-[collapsible=icon]:hidden">
            DOMAINS & MANAGEMENT
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarCollapsibleGroup item={operationsDomain} pathname={pathname} />
              <SidebarCollapsibleGroup item={inventoryDomain} pathname={pathname} />
              <SidebarCollapsibleGroup item={organizationDomain} pathname={pathname} />
              <SidebarCollapsibleGroup item={securityDomain} pathname={pathname} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Administrator Domain (SHOW ONLY FOR system_admin / menglang) */}
        {isSuperAdmin && (
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase px-2 mb-1.5 group-data-[collapsible=icon]:hidden">
              SYSTEM ADMIN ONLY
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarCollapsibleGroup item={superAdminDomain} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer Profile & Logout Menu */}
      <SidebarFooter className="p-3 border-t border-slate-200/80 dark:border-slate-800 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <SidebarMenu>
          <SidebarMenuItem className="flex group-data-[collapsible=icon]:justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <SidebarMenuButton size="lg" tooltip={userProfile?.firstName || "Profile"} className="hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl p-1.5 transition-all group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center" />
              }>
                <Avatar className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700">
                  <AvatarImage src={fileUrl(userProfile?.avatarKey) || ""} alt={userProfile?.firstName} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    {userProfile?.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 leading-none flex-1 overflow-hidden ml-2 text-left group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {isSuperAdmin ? "@system_admin" : userProfile?.username || "@user"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52 rounded-2xl p-1.5 shadow-xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-950" align="end" side="right" sideOffset={8}>
                <DropdownMenuItem render={<Link href="/profile" />} className="cursor-pointer rounded-xl dark:hover:bg-slate-800">
                  <Settings className="mr-2 h-4 w-4 text-slate-500 dark:text-slate-400" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="rounded-xl text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
