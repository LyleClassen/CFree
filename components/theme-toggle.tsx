"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // Theme is only known on the client; sync once after mount to avoid a
  // hydration mismatch on the icon.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={isDark ? "Switch to light" : "Switch to dark"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {mounted && (
              <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} />
            )}
          </Button>
        }
      />
      <TooltipContent>
        Toggle theme <kbd className="ml-1 font-mono opacity-70">D</kbd>
      </TooltipContent>
    </Tooltip>
  )
}
