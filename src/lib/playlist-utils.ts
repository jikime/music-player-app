/**
 * 플레이리스트 관련 유틸리티 함수들
 */

/**
 * 플레이리스트 커버 이미지가 그래디언트 색상인지 확인
 */
export function isGradientCover(coverImage?: string): boolean {
  return coverImage?.startsWith('bg-') ?? false
}

/**
 * 플레이리스트 커버 이미지가 실제 이미지(base64)인지 확인
 */
export function isImageCover(coverImage?: string): boolean {
  return coverImage ? !isGradientCover(coverImage) : false
}

/**
 * 플레이리스트 커버 타입 확인
 */
export function getCoverType(coverImage?: string): 'gradient' | 'image' | 'none' {
  if (!coverImage) return 'none'
  if (isGradientCover(coverImage)) return 'gradient'
  return 'image'
}

/**
 * base64 이미지 문자열인지 확인
 */
export function isBase64Image(str?: string): boolean {
  if (!str) return false
  return str.startsWith('data:image/') && str.includes('base64,')
}

/**
 * 플레이리스트 커버 이미지 유효성 검증
 */
export function validateCoverImage(coverImage?: string): { isValid: boolean; error?: string } {
  if (!coverImage) {
    return { isValid: true } // 빈 이미지는 유효함 (기본 처리)
  }

  // 그래디언트 색상인 경우
  if (isGradientCover(coverImage)) {
    // Tailwind 그래디언트 클래스 형식 검증
    const gradientPattern = /^bg-gradient-to-[a-z]{1,2}\s+from-[a-z]+-\d{3}\s+to-[a-z]+-\d{3}$/
    if (!gradientPattern.test(coverImage)) {
      return { isValid: false, error: '유효하지 않은 그래디언트 형식입니다.' }
    }
    return { isValid: true }
  }

  // Base64 이미지인 경우
  if (isBase64Image(coverImage)) {
    // 기본적인 base64 형식 검증
    try {
      const base64Data = coverImage.split(',')[1]
      if (!base64Data || base64Data.length === 0) {
        return { isValid: false, error: '유효하지 않은 base64 이미지입니다.' }
      }
      return { isValid: true }
    } catch (error) {
      return { isValid: false, error: 'base64 이미지 파싱 오류입니다.' }
    }
  }

  // 그 외의 경우는 유효하지 않음
  return { isValid: false, error: '지원하지 않는 커버 이미지 형식입니다.' }
}

/**
 * 플레이리스트 커버 이미지의 크기를 추정 (바이트 단위)
 */
export function getEstimatedCoverImageSize(coverImage?: string): number {
  if (!coverImage) return 0
  
  if (isGradientCover(coverImage)) {
    return coverImage.length * 2 // UTF-8 문자열 크기 추정
  }
  
  if (isBase64Image(coverImage)) {
    const base64Data = coverImage.split(',')[1] || coverImage
    return Math.floor((base64Data.length * 3) / 4) // base64 디코딩 후 크기
  }
  
  return coverImage.length * 2 // 기본 문자열 크기
}