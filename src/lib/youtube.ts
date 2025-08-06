/**
 * YouTube 관련 유틸리티 함수들
 */

/**
 * YouTube 썸네일 품질 옵션
 */
export const getThumbnailUrl = (videoId: string, quality: 'max' | 'high' | 'medium' | 'default' = 'max'): string => {
  const qualities = {
    max: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    default: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`
  }
  
  return qualities[quality]
}

/**
 * 최고 품질의 YouTube 썸네일 URL을 가져옵니다
 * maxresdefault가 없는 경우 hqdefault로 폴백
 */
export const getBestThumbnailUrl = (url: string): string => {
  const videoId = extractVideoId(url)
  if (!videoId) return ''
  
  // 최고 품질 썸네일 (1280x720)
  return getThumbnailUrl(videoId, 'max')
}

/**
 * YouTube URL에서 video ID를 추출합니다
 */
export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu\.be\/)([^&\n?#]+)/,
    /(?:youtube\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/v\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * YouTube oEmbed API를 사용하여 동영상 정보를 가져옵니다
 */
export const getYouTubeVideoInfo = async (videoId: string) => {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oembedUrl)
    
    if (!response.ok) {
      throw new Error('Failed to fetch video info from YouTube')
    }
    
    const data = await response.json()
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url
    }
  } catch (error) {
    console.error('Error fetching YouTube video info:', error)
    return null
  }
}

/**
 * YouTube iframe API를 사용하여 동영상의 재생시간을 가져옵니다
 * 클라이언트 사이드에서만 작동합니다
 */
export const getYouTubeDuration = (videoId: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    // YouTube iframe 생성
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '1px'
    iframe.style.height = '1px'
    iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`
    
    document.body.appendChild(iframe)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let player: any = null
    // eslint-disable-next-line prefer-const
    let timeout: NodeJS.Timeout
    
    const cleanup = () => {
      if (timeout) clearTimeout(timeout)
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
      if (player && typeof player.destroy === 'function') {
        player.destroy()
      }
    }
    
    // 30초 타임아웃
    timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout while fetching duration'))
    }, 30000)
    
    // YouTube API가 로드되지 않았다면 로드
    if (!window.YT) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
      
      window.onYouTubeIframeAPIReady = () => {
        createPlayer()
      }
    } else {
      createPlayer()
    }
    
    function createPlayer() {
      try {
        player = new window.YT.Player(iframe, {
          events: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onReady: (event: any) => {
              try {
                const duration = event.target.getDuration()
                cleanup()
                resolve(duration)
              } catch (error) {
                cleanup()
                reject(error)
              }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onError: (error: any) => {
              cleanup()
              reject(new Error(`YouTube player error: ${error.data}`))
            }
          }
        })
      } catch (error) {
        cleanup()
        reject(error)
      }
    }
  })
}

/**
 * HTML5 비디오 요소를 사용하여 재생시간을 가져오는 대안 방법
 * (더 간단하고 안정적)
 */
export const getVideoDurationFromUrl = (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.style.position = 'absolute'
    video.style.left = '-9999px'
    video.style.width = '1px'
    video.style.height = '1px'
    video.muted = true
    video.preload = 'metadata'
    
    const cleanup = () => {
      if (video.parentNode) {
        video.parentNode.removeChild(video)
      }
    }
    
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timeout while loading video metadata'))
    }, 30000)
    
    video.onloadedmetadata = () => {
      clearTimeout(timeout)
      const duration = video.duration
      cleanup()
      resolve(duration)
    }
    
    video.onerror = () => {
      clearTimeout(timeout)
      cleanup()
      reject(new Error('Failed to load video metadata'))
    }
    
    document.body.appendChild(video)
    video.src = url
  })
}

/**
 * YouTube URL의 재생시간을 가져오는 메인 함수
 */
export const fetchYouTubeDuration = async (url: string): Promise<number> => {
  const videoId = extractVideoId(url)
  if (!videoId) {
    throw new Error('Invalid YouTube URL')
  }
  
  try {
    // YouTube iframe API를 사용하여 재생시간 가져오기
    const duration = await getYouTubeDuration(videoId)
    return Math.round(duration)
  } catch (error) {
    console.warn('Failed to get duration from YouTube API, trying alternative method:', error)
    
    try {
      // 대안: 직접 YouTube URL로 시도 (CORS 때문에 작동하지 않을 수 있음)
      const duration = await getVideoDurationFromUrl(url)
      return Math.round(duration)
    } catch (altError) {
      console.error('All methods failed to get duration:', altError)
      // 기본값 반환 (0초)
      return 0
    }
  }
}

/**
 * 이미지 URL을 base64로 변환합니다
 */
export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  console.log('🔄 Converting image to base64:', imageUrl)
  try {
    const response = await fetch(imageUrl, {
      mode: 'cors',
    })
    
    console.log('📥 Fetch response status:', response.status, response.statusText)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    
    const blob = await response.blob()
    console.log('📦 Image blob:', {
      size: blob.size,
      type: blob.type
    })
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          console.log('✅ Successfully converted to base64:', {
            dataLength: reader.result.length,
            startsWithDataUrl: reader.result.startsWith('data:'),
            mimeType: reader.result.substring(5, reader.result.indexOf(';'))
          })
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert image to base64'))
        }
      }
      reader.onerror = (error) => {
        console.error('❌ FileReader error:', error)
        reject(new Error('FileReader error'))
      }
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('❌ Error converting image to base64:', error)
    throw error
  }
}

/**
 * YouTube 썸네일을 base64로 변환합니다
 * 여러 품질 옵션을 시도하여 가장 적합한 이미지를 가져옵니다
 */
export const getYouTubeThumbnailAsBase64 = async (videoId: string): Promise<string | null> => {
  console.log('🖼️ Starting thumbnail conversion for video:', videoId)
  const qualities = ['max', 'high', 'medium', 'default'] as const
  
  for (const quality of qualities) {
    try {
      const thumbnailUrl = getThumbnailUrl(videoId, quality)
      console.log(`🔍 Trying quality "${quality}": ${thumbnailUrl}`)
      
      const base64Data = await convertImageToBase64(thumbnailUrl)
      console.log(`✅ Successfully converted ${quality} quality to base64:`, {
        dataLength: base64Data.length,
        startsWithDataUrl: base64Data.startsWith('data:')
      })
      
      // 기본 placeholder 이미지가 아닌 실제 썸네일인지 확인
      // (YouTube는 썸네일이 없을 때 기본 이미지를 반환함)
      const response = await fetch(thumbnailUrl, { method: 'HEAD' })
      console.log(`📏 Content-Length for ${quality}:`, response.headers.get('content-length'))
      
      // Content-Length가 매우 작으면 기본 이미지일 가능성이 높음
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 1000) {
        console.log(`✅ Using ${quality} quality thumbnail (size: ${contentLength} bytes)`)
        return base64Data
      }
      
      console.warn(`⚠️ Thumbnail quality ${quality} seems to be a placeholder (size: ${contentLength}), trying next quality`)
    } catch (error) {
      console.warn(`❌ Failed to get thumbnail with quality ${quality}:`, error)
      continue
    }
  }
  
  console.error('❌ Failed to get YouTube thumbnail for video:', videoId)
  return null
}

// YouTube iframe API 타입 정의
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}