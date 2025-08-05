'use client'

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Camera
} from "lucide-react"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { data: session, status } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileName, setProfileName] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
  })

  // 프로필 데이터 로드
  useEffect(() => {
    const loadProfile = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/profile')
          const data = await response.json()
          
          if (data.success && data.profile) {
            setFormData({
              name: data.profile.name || session.user.name || '',
              email: data.profile.email || session.user.email || '',
              bio: data.profile.bio || '',
            })
            setProfileName(data.profile.name || session.user.name || '')
            setProfileImage(data.profile.image || session.user.image || null)
          } else {
            setFormData({
              name: session.user.name || '',
              email: session.user.email || '',
              bio: '',
            })
            setProfileName(session.user.name || '')
            setProfileImage(session.user.image || null)
          }
        } catch (error) {
          console.error('프로필 로드 오류:', error)
          setFormData({
            name: session.user.name || '',
            email: session.user.email || '',
            bio: '',
          })
          setProfileName(session.user.name || '')
        }
      }
    }
    
    if (open && session) {
      loadProfile()
    }
  }, [session, open])

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
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
          name: formData.name.trim(),
          bio: formData.bio.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setProfileName(formData.name) // 저장 후 표시 이름 업데이트
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
    setFormData(prev => ({...prev}))
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
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/api/profile/image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setProfileImage(data.imageUrl)
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
          {/* 배경 그라데이션 */}
          <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 -mx-6 -mt-6 rounded-t-lg" />
          
          <div className="relative -mt-10">
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
                  disabled={uploadingImage}
                  className="relative group cursor-pointer"
                >
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                    <AvatarImage 
                      src={profileImage || undefined} 
                      alt={session.user?.name || "User"} 
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                      {profileName ? getUserInitials(profileName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingImage ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </div>
                </button>
              </div>

              <h1 className="text-xl font-bold mb-2">
                {profileName || "사용자"}
              </h1>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{session.user?.email}</span>
              </div>
            </div>

            {/* 프로필 정보 편집/표시 섹션 */}
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">이름</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">자기소개</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="자신을 소개해보세요"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex-1" disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? '저장 중...' : '저장'}
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
                      {formData.bio || '아직 자기소개를 작성하지 않았습니다.'}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(true)}
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