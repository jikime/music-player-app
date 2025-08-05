'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  User, 
  Mail, 
  Edit3, 
  Save, 
  X,
  Camera,
  Loader2
} from "lucide-react"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ProfileData {
  name: string
  email: string
  bio: string
  image: string | null
}

// 프로필 데이터 캐시
const profileCache = new Map<string, { data: ProfileData; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5분

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { data: session, status } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    bio: '',
    image: null
  })

  // 세션에서 초기 데이터 추출 (메모이제이션)
  const initialProfileData = useMemo((): ProfileData => ({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    bio: '',
    image: session?.user?.image || null
  }), [session?.user])

  // 캐시된 프로필 데이터 가져오기
  const getCachedProfile = useCallback((userId: string): ProfileData | null => {
    const cached = profileCache.get(userId)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [])

  // 프로필 데이터 캐시에 저장
  const setCachedProfile = useCallback((userId: string, data: ProfileData) => {
    profileCache.set(userId, { data, timestamp: Date.now() })
  }, [])

  // 프로필 데이터 로드
  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) return

    // 1. 먼저 초기 데이터로 즉시 표시
    setProfileData(initialProfileData)

    // 2. 캐시 확인
    const cached = getCachedProfile(session.user.id)
    if (cached) {
      setProfileData(cached)
      return
    }

    // 3. API에서 최신 데이터 로드
    setIsLoadingProfile(true)
    try {
      const response = await fetch('/api/profile')
      const data = await response.json()
      
      const profileData: ProfileData = {
        name: data.profile?.name || session.user.name || '',
        email: data.profile?.email || session.user.email || '',
        bio: data.profile?.bio || '',
        image: data.profile?.image || session.user.image || null
      }

      // 캐시에 저장
      setCachedProfile(session.user.id, profileData)
      setProfileData(profileData)
    } catch (error) {
      console.error('프로필 로드 오류:', error)
      // 오류 시 초기 데이터 유지
      toast.error('프로필 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingProfile(false)
    }
  }, [session, initialProfileData, getCachedProfile, setCachedProfile])

  // 모달이 열릴 때 프로필 로드
  useEffect(() => {
    if (open && session) {
      loadProfile()
    }
  }, [open, session, loadProfile])

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleSave = async () => {
    if (!profileData.name.trim()) {
      toast.error('이름은 필수 항목입니다.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name.trim(),
          bio: profileData.bio.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        // 캐시 업데이트
        if (session?.user?.id) {
          setCachedProfile(session.user.id, profileData)
        }
        setIsEditing(false)
        toast.success('프로필이 성공적으로 업데이트되었습니다!')
      } else {
        toast.error(data.error || '프로필 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      toast.error('프로필 업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // 편집 모드 취소 시 원본 데이터로 복구
    loadProfile()
    setIsEditing(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (1MB)
    if (file.size > 1024 * 1024) {
      toast.error('이미지 크기는 1MB 이하여야 합니다.')
      return
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다.')
      return
    }

    setUploadingImage(true)
    const uploadFormData = new FormData()
    uploadFormData.append('image', file)

    try {
      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        // 프로필 데이터 업데이트
        const updatedProfileData = { ...profileData, image: data.imageUrl }
        setProfileData(updatedProfileData)
        
        // 캐시도 업데이트
        if (session?.user?.id) {
          setCachedProfile(session.user.id, updatedProfileData)
        }
        
        toast.success('프로필 사진이 업데이트되었습니다.')
      } else {
        toast.error(data.error || '이미지 업로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      toast.error('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploadingImage(false)
    }
  }

  if (status === "loading") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted animate-pulse mx-auto" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-32 mx-auto animate-pulse" />
                <div className="h-3 bg-muted rounded w-24 mx-auto animate-pulse" />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!session) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">로그인이 필요합니다</h2>
              <p className="text-muted-foreground text-sm">
                프로필을 보려면 먼저 로그인해주세요.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>프로필</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 프로필 로딩 상태 */}
          {isLoadingProfile && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">프로필 정보를 불러오는 중...</span>
              </div>
            </div>
          )}

          <div className="relative">
            {/* 아바타 섹션 */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage || isLoadingProfile}
                  className="relative group cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoadingProfile ? (
                    <div className="w-24 h-24 border-4 border-background shadow-lg rounded-full bg-muted animate-pulse" />
                  ) : (
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                      <AvatarImage 
                        src={profileData.image || undefined} 
                        alt={profileData.name || "User"} 
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {profileData.name ? getUserInitials(profileData.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </button>
              </div>

              {isLoadingProfile ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32 mx-auto" />
                  <Skeleton className="h-4 w-48 mx-auto" />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold mb-2">
                    {profileData.name || "사용자"}
                  </h1>
                  
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{profileData.email}</span>
                  </div>
                </>
              )}
            </div>

            {/* 프로필 정보 편집/표시 섹션 */}
            <div className="space-y-4">
              {isLoadingProfile ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <Skeleton className="h-10 w-32 mx-auto" />
                </div>
              ) : isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="이름을 입력하세요"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">자기소개</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="자신을 소개해보세요"
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          저장 중...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          저장
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                      <X className="w-4 h-4 mr-2" />
                      취소
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pb-4">
                    <Label className="text-sm font-medium text-muted-foreground">자기소개</Label>
                    <p className="mt-2 text-sm leading-relaxed text-center">
                      {profileData.bio || '아직 자기소개를 작성하지 않았습니다.'}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
                      disabled={isLoadingProfile}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      프로필 편집
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}