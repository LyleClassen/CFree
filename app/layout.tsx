import type { Metadata } from "next"
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Body / UI voice.
const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

// The "spec sheet" voice — labels, section indices, dates.
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// Display voice — wordmark and section titles, used with restraint.
const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "CFree — Résumé Builder",
  description:
    "Import or build a résumé, score it against the 2026 guidelines, and export an ATS-safe PDF.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontMono.variable,
        fontDisplay.variable
      )}
    >
      <body className="font-sans">
        <ThemeProvider>
          <TooltipProvider delay={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
