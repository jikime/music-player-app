"use client"

import { useState, useEffect } from "react"

interface LoadingBarProps {
  isLoading?: boolean
  message?: string
  className?: string
}

export function LoadingBar({ isLoading = true, message, className = "" }: LoadingBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setProgress(100)
      return
    }

    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 10 + 5
        const newProgress = prev + increment
        if (newProgress >= 90) {
          clearInterval(interval)
          return 90 // Don't complete unless isLoading becomes false
        }
        return newProgress
      })
    }, 150)

    return () => clearInterval(interval)
  }, [isLoading])

  if (!isLoading && progress === 100) {
    return null
  }

  return (
    <div className={`w-full ${className}`}>
      {message && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{message}</span>
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-muted/50 rounded-full h-1">
        <div 
          className="bg-primary h-1 rounded-full transition-all duration-200 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

export function Skeleton({ className = "", children }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-muted/50 rounded ${className}`}>
      {children}
    </div>
  )
}

export function LoadingContent({ 
  isLoading, 
  children, 
  fallback 
}: { 
  isLoading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  if (isLoading) {
    return fallback || (
      <div className="space-y-4">
        <LoadingBar message="Loading content..." />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}