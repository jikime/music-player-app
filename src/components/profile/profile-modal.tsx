"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { LogOut, User, Music, Heart, Settings } from "lucide-react"

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { data: session } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({ callbackUrl: "/" })
    } catch (error) {
      console.error("Sign out failed:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!session?.user) {
    return null
  }

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>프로필</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(session.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{session.user.name}</h3>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>

          <Separator />

          {/* Profile Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Music className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-medium">My Songs</p>
              <p className="text-xs text-muted-foreground">내 음악</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Heart className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-sm font-medium">Bookmarks</p>
              <p className="text-xs text-muted-foreground">북마크</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Settings</p>
              <p className="text-xs text-muted-foreground">설정</p>
            </div>
          </div>

          <Separator />

          {/* Account Info */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">가입 방법</span>
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {session.user.email?.includes("@") ? "이메일" : "OAuth"}
              </span>
            </div>
          </div>

          <Separator />

          {/* Sign Out Button */}
          <Button 
            onClick={handleSignOut} 
            disabled={isSigningOut}
            variant="destructive"
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isSigningOut ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}