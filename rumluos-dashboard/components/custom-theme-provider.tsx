"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useTheme } from "next-themes"

export interface ThemePreset {
  name: string
  key: string
  light: string
  dark: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Brand Blue (Default)",
    key: "brand",
    light: "#2252E9",
    dark: "#4f7cf8",
  },
  {
    name: "Ocean Blue",
    key: "ocean",
    light: "#0284c7",
    dark: "#38bdf8",
  },
  {
    name: "Royal Purple",
    key: "purple",
    light: "#7c3aed",
    dark: "#a855f7",
  },
  {
    name: "Emerald Green",
    key: "emerald",
    light: "#059669",
    dark: "#34d399",
  },
  {
    name: "Rose Pink",
    key: "rose",
    light: "#e11d48",
    dark: "#fb7185",
  },
  {
    name: "Sunset Amber",
    key: "amber",
    light: "#d97706",
    dark: "#fbbf24",
  },
]

interface CustomThemeContextType {
  preset: string
  setPreset: (presetKey: string) => void
  customColor: string | null
  setCustomColor: (color: string | null) => void
  resetToDefault: () => void
  isCustomizerOpen: boolean
  setIsCustomizerOpen: (open: boolean) => void
}

const CustomThemeContext = createContext<CustomThemeContextType | undefined>(undefined)

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [preset, setPresetState] = useState<string>("brand")
  const [customColor, setCustomColorState] = useState<string | null>(null)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)

  // Load saved theme settings on mount
  useEffect(() => {
    const savedPreset = localStorage.getItem("rumluos_theme_preset")
    const savedCustom = localStorage.getItem("rumluos_theme_custom_color")
    // Validate saved preset key is still valid; fallback to "brand" if stale (e.g. old "teal")
    const isValidPreset = THEME_PRESETS.some((p) => p.key === savedPreset)
    if (savedPreset && isValidPreset) {
      setPresetState(savedPreset)
    } else if (savedPreset && !isValidPreset) {
      // Clear stale preset key and reset to brand default
      localStorage.setItem("rumluos_theme_preset", "brand")
    }
    if (savedCustom) setCustomColorState(savedCustom)
  }, [])

  // Dynamically apply variables to document.documentElement
  useEffect(() => {
    const isDark = resolvedTheme === "dark"
    const root = document.documentElement

    const applyColor = (color: string) => {
      root.style.setProperty("--primary", color)
      root.style.setProperty("--ring", color)
      root.style.setProperty("--chart-1", color)
      root.style.setProperty("--sidebar-primary", color)
      root.style.setProperty("--sidebar-ring", color)
      root.style.setProperty("--sidebar-primary-foreground", "#ffffff")
    }

    if (customColor) {
      applyColor(customColor)
    } else {
      const activePreset = THEME_PRESETS.find((p) => p.key === preset) || THEME_PRESETS[0]
      const color = isDark ? activePreset.dark : activePreset.light
      applyColor(color)
    }
  }, [preset, customColor, resolvedTheme])

  const setPreset = (presetKey: string) => {
    setPresetState(presetKey)
    setCustomColorState(null)
    localStorage.setItem("rumluos_theme_preset", presetKey)
    localStorage.removeItem("rumluos_theme_custom_color")
  }

  const setCustomColor = (color: string | null) => {
    setCustomColorState(color)
    if (color) {
      localStorage.setItem("rumluos_theme_custom_color", color)
    } else {
      localStorage.removeItem("rumluos_theme_custom_color")
    }
  }

  const resetToDefault = () => {
    setPreset("brand")
    setCustomColor(null)
  }

  return (
    <CustomThemeContext.Provider
      value={{
        preset,
        setPreset,
        customColor,
        setCustomColor,
        resetToDefault,
        isCustomizerOpen,
        setIsCustomizerOpen,
      }}
    >
      {children}
    </CustomThemeContext.Provider>
  )
}

export function useCustomTheme() {
  const context = useContext(CustomThemeContext)
  if (!context) {
    throw new Error("useCustomTheme must be used within a CustomThemeProvider")
  }
  return context
}
