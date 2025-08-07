'use client'

import * as React from "react"

// Breakpoints based on Tailwind CSS defaults
const BREAKPOINTS = {
  mobile: 640,    // sm: 640px
  tablet: 768,    // md: 768px
  laptop: 1024,   // lg: 1024px
  desktop: 1280,  // xl: 1280px
  wide: 1536      // 2xl: 1536px
} as const

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'wide'

export interface ResponsiveState {
  isMobile: boolean
  isTablet: boolean
  isLaptop: boolean
  isDesktop: boolean
  isWide: boolean
  deviceType: DeviceType
  width: number
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.tablet - 1}px)`)
    const onChange = () => {
      const newIsMobile = window.innerWidth < BREAKPOINTS.tablet
      setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev)
    }
    mql.addEventListener("change", onChange)
    onChange() // 초기값 설정
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = React.useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isLaptop: false,
        isDesktop: true,
        isWide: false,
        deviceType: 'desktop',
        width: 1280
      }
    }
    
    const width = window.innerWidth
    return {
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.laptop,
      isLaptop: width >= BREAKPOINTS.laptop && width < BREAKPOINTS.desktop,
      isDesktop: width >= BREAKPOINTS.desktop && width < BREAKPOINTS.wide,
      isWide: width >= BREAKPOINTS.wide,
      deviceType: getDeviceType(width),
      width
    }
  })

  React.useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth
      const newState = {
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.laptop,
        isLaptop: width >= BREAKPOINTS.laptop && width < BREAKPOINTS.desktop,
        isDesktop: width >= BREAKPOINTS.desktop && width < BREAKPOINTS.wide,
        isWide: width >= BREAKPOINTS.wide,
        deviceType: getDeviceType(width),
        width
      }
      setState(prev => {
        // 상태가 실제로 변경된 경우에만 업데이트
        if (prev.width !== newState.width || prev.deviceType !== newState.deviceType) {
          return newState
        }
        return prev
      })
    }

    updateState()
    
    let timeoutId: NodeJS.Timeout
    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateState, 100)
    }

    window.addEventListener('resize', debouncedUpdate)
    return () => {
      window.removeEventListener('resize', debouncedUpdate)
      clearTimeout(timeoutId)
    }
  }, [])

  return state
}

function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile'
  if (width < BREAKPOINTS.laptop) return 'tablet'
  if (width < BREAKPOINTS.desktop) return 'laptop'
  if (width < BREAKPOINTS.wide) return 'desktop'
  return 'wide'
}

// Utility hook for common responsive patterns
export function useBreakpoint(breakpoint: keyof typeof BREAKPOINTS) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
    const onChange = () => {
      const newMatches = window.innerWidth >= BREAKPOINTS[breakpoint]
      setMatches(prev => prev !== newMatches ? newMatches : prev)
    }
    mql.addEventListener("change", onChange)
    onChange() // 초기값 설정
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return !!matches
}
