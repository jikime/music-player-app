"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"

interface ImageWithFallbackProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  fallbackSrc?: string
  timeout?: number
}

export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = "/placeholder.svg",
  timeout = 1000,
  ...props
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc)
  const [hasFailed, setHasFailed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(true)

  useEffect(() => {
    // If src is empty or already failed, use fallback immediately
    if (!src || hasFailed) {
      setCurrentSrc(fallbackSrc)
      return
    }

    // Reset state for new src
    setCurrentSrc(src)
    setHasFailed(false)
    isLoadingRef.current = true

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set timeout to fallback if loading takes too long
    timeoutRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        setCurrentSrc(fallbackSrc)
        setHasFailed(true)
        isLoadingRef.current = false
      }
    }, timeout)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [src, fallbackSrc, timeout])

  const handleLoad = () => {
    isLoadingRef.current = false
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleError = () => {
    isLoadingRef.current = false
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (!hasFailed) {
      setCurrentSrc(fallbackSrc)
      setHasFailed(true)
    }
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  )
}