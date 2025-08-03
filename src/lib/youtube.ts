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

// YouTube iframe API 타입 정의
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}