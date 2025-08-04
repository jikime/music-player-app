/**
 * 이미지 처리 유틸리티 함수들
 */

// 지원되는 이미지 타입
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// 최대 이미지 크기 (1024x1024)
const MAX_IMAGE_SIZE = 1024

/**
 * 파일이 유효한 이미지인지 검증
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: '이미지 파일은 5MB 이하여야 합니다.' }
  }

  // 파일 타입 검증
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'JPEG, PNG, WebP, GIF 형식의 이미지만 지원됩니다.' }
  }

  return { isValid: true }
}

/**
 * 이미지를 리사이즈하고 압축하여 base64로 변환
 */
export function compressImageToBase64(
  file: File,
  maxWidth: number = MAX_IMAGE_SIZE,
  maxHeight: number = MAX_IMAGE_SIZE,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // 원본 크기
        const { width, height } = img

        // 비율을 유지하면서 최대 크기에 맞게 계산
        let newWidth = width
        let newHeight = height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          newWidth = Math.floor(width * ratio)
          newHeight = Math.floor(height * ratio)
        }

        // 캔버스 크기 설정
        canvas.width = newWidth
        canvas.height = newHeight

        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        // base64로 변환 (JPEG 압축)
        const base64 = canvas.toDataURL('image/jpeg', quality)
        resolve(base64)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'))
    }

    // 파일을 이미지로 로드
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * base64 문자열의 크기를 계산 (바이트 단위)
 */
export function getBase64Size(base64String: string): number {
  // base64 헤더 제거
  const base64Data = base64String.split(',')[1] || base64String
  // base64는 4/3 비율로 인코딩되므로 실제 크기 계산
  return Math.floor((base64Data.length * 3) / 4)
}

/**
 * base64 문자열을 사람이 읽기 쉬운 크기로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}