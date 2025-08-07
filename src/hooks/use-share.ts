'use client'

import { useState, useCallback } from 'react'
import { Song } from '@/types/music'
import { shareApi } from '@/lib/api'
import { toast } from 'sonner'

interface ShareOptions {
  title?: string
  description?: string
  isPublic?: boolean
  expiresAt?: Date
}

export function useShare() {
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  // Check if Web Share API is available
  const canUseNativeShare = () => {
    if (typeof window === 'undefined') return false
    return 'share' in navigator && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  // Copy to clipboard with fallback
  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      if ('clipboard' in navigator) {
        await navigator.clipboard.writeText(text)
        toast.success('링크가 클립보드에 복사되었습니다')
        return true
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.top = '0'
        textArea.style.left = '0'
        textArea.style.width = '2em'
        textArea.style.height = '2em'
        textArea.style.padding = '0'
        textArea.style.border = 'none'
        textArea.style.outline = 'none'
        textArea.style.boxShadow = 'none'
        textArea.style.background = 'transparent'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          const successful = document.execCommand('copy')
          if (successful) {
            toast.success('링크가 클립보드에 복사되었습니다')
          } else {
            toast.error('복사에 실패했습니다')
          }
          return successful
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('복사에 실패했습니다')
      return false
    }
  }, [])

  // Native share with fallback
  const shareNative = useCallback(async (song: Song, url: string) => {
    if (canUseNativeShare()) {
      try {
        await navigator.share({
          title: `${song.title} - ${song.artist}`,
          text: `VIBE Music에서 "${song.title}"을(를) 들어보세요!`,
          url: url,
        })
        toast.success('공유되었습니다')
        return true
      } catch (err) {
        // User cancelled share or error occurred
        if ((err as Error).name === 'AbortError') {
          return false // User cancelled, don't show error
        }
        console.error('Native share failed:', err)
        // Fall back to clipboard
        return copyToClipboard(url)
      }
    } else {
      // Use clipboard as fallback
      return copyToClipboard(url)
    }
  }, [copyToClipboard])

  // Create share link
  const createShareLink = useCallback(async (song: Song, options?: ShareOptions): Promise<string | null> => {
    try {
      setIsSharing(true)
      const result = await shareApi.create({
        songId: song.id,
        title: options?.title,
        description: options?.description,
        isPublic: options?.isPublic ?? true,
        expiresAt: options?.expiresAt
      })
      setShareUrl(result.shareUrl)
      return result.shareUrl
    } catch (err) {
      console.error('Failed to create share link:', err)
      toast.error('공유 링크 생성에 실패했습니다')
      return null
    } finally {
      setIsSharing(false)
    }
  }, [])

  // Quick share - creates link and immediately shares
  const quickShare = useCallback(async (song: Song) => {
    if (isSharing) return // Prevent multiple calls
    
    try {
      setIsSharing(true)
      
      // Create a simple public share link
      const url = await createShareLink(song, {
        title: `${song.title} - ${song.artist}`,
        description: `VIBE Music에서 공유`,
        isPublic: true
      })

      if (url) {
        await shareNative(song, url)
      }
    } catch (err) {
      console.error('Quick share failed:', err)
      toast.error('공유에 실패했습니다')
    } finally {
      setIsSharing(false)
    }
  }, [createShareLink, shareNative, isSharing])

  // Share to specific platform
  const shareToPlatform = useCallback((url: string, platform: 'kakao' | 'twitter' | 'facebook' | 'whatsapp', song: Song) => {
    const text = `"${song.title}" - ${song.artist} | VIBE Music에서 듣기`
    let shareUrl = ''

    switch (platform) {
      case 'kakao':
        // KakaoTalk share (requires Kakao SDK)
        if (typeof window !== 'undefined' && (window as Window & { Kakao?: { isInitialized(): boolean; Share: { sendDefault(options: unknown): void } } }).Kakao?.isInitialized()) {
          try {
            const kakao = (window as Window & { Kakao?: { Share: { sendDefault(options: unknown): void } } }).Kakao
            if (kakao) {
              kakao.Share.sendDefault({
              objectType: 'music',
              content: {
                title: song.title,
                description: song.artist,
                imageUrl: song.thumbnail || song.image_data || '',
                link: {
                  mobileWebUrl: url,
                  webUrl: url,
                },
              },
              buttons: [
                {
                  title: '음악 듣기',
                  link: {
                    mobileWebUrl: url,
                    webUrl: url,
                  },
                },
              ],
            })
            }
          } catch (error) {
            console.error('Kakao share error:', error)
            toast.error('카카오톡 공유에 실패했습니다')
          }
        } else {
          toast.error('카카오톡 공유를 사용할 수 없습니다')
        }
        return
        
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
        
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
        
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
        break
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }, [])

  return {
    isSharing,
    shareUrl,
    canUseNativeShare: canUseNativeShare(),
    createShareLink,
    shareNative,
    quickShare,
    copyToClipboard,
    shareToPlatform
  }
}