"use client"

import { useState, useEffect, useMemo } from "react"
import { Music } from "lucide-react"

interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "Loading music library..." }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("Initializing...")

  const steps = useMemo(() => [
    "Initializing...",
    "Loading songs...",
    "Fetching playlists...",
    "Setting up player...",
    "Almost ready..."
  ], [])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15 + 5
        if (newProgress >= 100) {
          clearInterval(interval)
          return 100
        }
        
        // Update step based on progress
        const stepIndex = Math.floor((newProgress / 100) * steps.length)
        setCurrentStep(steps[Math.min(stepIndex, steps.length - 1)])
        
        return newProgress
      })
    }, 200)

    return () => clearInterval(interval)
  }, [steps])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md w-full px-6">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Music className="w-10 h-10 text-primary" />
            </div>
            {/* <div className="absolute -top-1 -right-1">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
            </div> */}
          </div>
        </div>

        {/* Main message */}
        <h2 className="text-xl font-semibold text-foreground mb-2">{message}</h2>
        
        {/* Current step */}
        <p className="text-sm text-muted-foreground mb-8">{currentStep}</p>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>

        {/* Progress percentage */}
        <p className="text-xs text-muted-foreground">
          {Math.round(Math.min(progress, 100))}%
        </p>
      </div>
    </div>
  )
}