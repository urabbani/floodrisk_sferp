import * as React from "react"

// Responsive breakpoints (in pixels, matching Tailwind defaults)
export const BREAKPOINTS = {
  sm: 640,   // Small screens (landscape phones)
  md: 768,   // Medium screens (tablets)
  lg: 1024,  // Large screens (small laptops)
  xl: 1280,  // Extra large screens (desktops)
} as const

const MOBILE_BREAKPOINT = BREAKPOINTS.md

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    setIsInitialized(true)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false until initialized to avoid hydration mismatch
  return isInitialized ? isMobile : false
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)
  const [isInitialized, setIsInitialized] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => {
      setMatches(mql.matches)
    }
    mql.addEventListener("change", onChange)
    setMatches(mql.matches)
    setIsInitialized(true)
    return () => mql.removeEventListener("change", onChange)
  }, [query])

  return isInitialized ? matches : false
}

// Convenience hooks for common breakpoints
export function useIsSmall() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`)
}

export function useIsTablet() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`)
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`)
}
