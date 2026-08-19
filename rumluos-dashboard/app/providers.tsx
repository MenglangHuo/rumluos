"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { useState } from "react"

import { QuickActionProvider } from "@/components/quick-action-modal-context"
import { CustomThemeProvider } from "@/components/custom-theme-provider"
import { ThemeCustomizerModal } from "@/components/theme-customizer-modal"
import { CommandPalette } from "@/components/command-palette"
import { UnifiedLoanWizardModal } from "@/components/unified-loan-wizard-modal"
import { QuickPaymentModal } from "@/components/quick-payment-modal"
import { AbaKhqrModal } from "@/components/aba-khqr-modal"
import { PrintReceiptModal } from "@/components/print-receipt-modal"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <CustomThemeProvider>
        <QueryClientProvider client={queryClient}>
          <QuickActionProvider>
            {children}
            <CommandPalette />
            <UnifiedLoanWizardModal />
            <QuickPaymentModal />
            <AbaKhqrModal />
            <PrintReceiptModal />
            <ThemeCustomizerModal />
            <Toaster richColors position="top-right" />
          </QuickActionProvider>
        </QueryClientProvider>
      </CustomThemeProvider>
    </ThemeProvider>
  )
}
