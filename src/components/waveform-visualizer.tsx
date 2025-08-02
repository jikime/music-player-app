"use client"

import { useEffect, useRef } from "react"
import WaveSurfer from "wavesurfer.js"
import { useMusicStore } from "@/lib/store"

interface WaveformVisualizerProps {
  audioUrl: string | null
  onSeek?: (time: number) => void
}

export function WaveformVisualizer({ audioUrl, onSeek }: WaveformVisualizerProps) {
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const { playerState } = useMusicStore()
  const { currentTime } = playerState

  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return

    let isCancelled = false

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#8b5cf6',
      progressColor: '#c084fc',
      cursorColor: '#ffffff',
      barWidth: 3,
      barRadius: 3,
      cursorWidth: 2,
      height: 80,
      barGap: 2,
      normalize: true,
      backend: 'WebAudio',
      mediaControls: false,
      interact: true,
      fillParent: true,
    })

    // Load audio with error handling
    try {
      wavesurfer.load(audioUrl)
    } catch (error) {
      console.error('WaveSurfer load error:', error)
      return
    }

    // Event listeners - only for seeking, ReactPlayer handles playback
    wavesurfer.on('seeking', (progress) => {
      if (!isCancelled) {
        const time = progress * wavesurfer.getDuration()
        if (onSeek) {
          onSeek(time)
        }
      }
    })

    wavesurfer.on('click', () => {
      if (!isCancelled) {
        const clickTime = wavesurfer.getCurrentTime()
        if (onSeek) {
          onSeek(clickTime)
        }
      }
    })

    wavesurfer.on('error', (error) => {
      console.error('WaveSurfer error:', error)
    })

    if (!isCancelled) {
      wavesurferRef.current = wavesurfer
    }

    return () => {
      isCancelled = true
      try {
        wavesurfer.destroy()
      } catch (error) {
        console.error('WaveSurfer destroy error:', error)
      }
    }
  }, [audioUrl, onSeek])

  // Don't sync playback state - ReactPlayer handles this
  // Waveform is only for visualization and seeking

  // Sync current time from ReactPlayer to WaveSurfer visualization
  useEffect(() => {
    if (!wavesurferRef.current) return
    
    const duration = wavesurferRef.current.getDuration()
    if (duration > 0) {
      const progress = currentTime / duration
      wavesurferRef.current.seekTo(progress)
    }
  }, [currentTime])

  if (!audioUrl) {
    return (
      <div className="w-full h-20 bg-white/5 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">No audio loaded</p>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <div 
        ref={waveformRef} 
        className="w-full cursor-pointer"
      />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl" />
    </div>
  )
}