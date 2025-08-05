'use client'

import { useState, useEffect } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useMusicStore } from "@/lib/store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Plus, LogOut, User, Settings } from "lucide-react"
import { AddLinkModal } from "@/components/songs/add-link-modal"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { ProfileModal } from "@/components/layout/profile-modal"
import Link from "next/link"

export function AppHeader() {
  const [addLinkModalOpen, setAddLinkModalOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileName, setProfileName] = useState<string>('')
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { playlists } = useMusicStore()

  // 프로필 이미지 로드
  useEffect(() => {
    const loadProfileImage = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/profile')
          const data = await response.json()
          
          if (data.success && data.profile) {
            // 우선순위: 데이터베이스 이미지 > 구글 로그인 이미지
            const imageUrl = data.profile.image || session.user.image
            setProfileImage(imageUrl)
            setProfileName(data.profile.name || session.user.name || '')
          } else {
            // 프로필이 없으면 구글 로그인 이미지 사용
            setProfileImage(session.user.image || null)
            setProfileName(session.user.name || '')
          }
        } catch (error) {
          console.error('프로필 이미지 로드 오류:', error)
          // 오류 시 구글 로그인 이미지 사용
          setProfileImage(session.user.image || null)
          setProfileName(session.user.name || '')
        }
      } else {
        setProfileImage(null)
        setProfileName('')
      }
    }

    loadProfileImage()
  }, [session])

  const handleSignIn = () => {
    signIn()
  }

  const handleSignOut = () => {
    signOut()
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  // 라우터별 사용자 친화적 제목 매핑
  const routeLabels: Record<string, { title: string; parent?: string; icon?: string }> = {
    '/': { title: 'Home', icon: '🏠' },
    '/trending': { title: 'Trending', icon: '🔥' },
    '/my-songs': { title: 'My Songs', icon: '🎵' },
    '/recently-played': { title: 'Recently Played', icon: '⏰' },
    '/playlist': { title: 'Playlists', icon: '📋' },
    '/signin': { title: 'Sign In', icon: '🔐' },
    '/signup': { title: 'Sign Up', icon: '✍️' },
    '/error': { title: 'Error', icon: '⚠️' },
    // 동적 라우트 패턴
    '/playlist/[id]': { title: 'Playlist', parent: '/playlist', icon: '🎼' }
  }

  // 경로에 따른 breadcrumb 생성 (개선된 버전)
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: Array<{
      label: string;
      href: string;
      isHome?: boolean;
      isCurrent?: boolean;
      icon?: string;
    }> = []

    // 홈은 항상 첫 번째 (모바일에서는 현재 페이지가 홈일 때만 표시)
    const homeLabel = routeLabels['/']
    breadcrumbs.push({ 
      label: homeLabel.title, 
      href: '/', 
      isHome: true,
      icon: homeLabel.icon,
      isCurrent: pathname === '/'
    })

    // 현재 경로가 홈이 아닌 경우 처리
    if (pathname !== '/') {
      // 정확한 경로 매치 시도
      const exactMatch = routeLabels[pathname]
      if (exactMatch) {
        // 부모 경로가 있는 경우 추가
        if (exactMatch.parent && pathname !== exactMatch.parent) {
          const parentMatch = routeLabels[exactMatch.parent]
          if (parentMatch) {
            breadcrumbs.push({
              label: parentMatch.title,
              href: exactMatch.parent,
              icon: parentMatch.icon
            })
          }
        }
        
        breadcrumbs.push({
          label: exactMatch.title,
          href: pathname,
          isCurrent: true,
          icon: exactMatch.icon
        })
      } else {
        // 동적 라우트 처리
        if (pathname.startsWith('/playlist/') && segments.length === 2) {
          // /playlist/[id] 패턴
          const playlistId = segments[1]
          const playlistRoute = routeLabels['/playlist']
          const playlistDetailRoute = routeLabels['/playlist/[id]']
          
          if (playlistRoute) {
            breadcrumbs.push({
              label: playlistRoute.title,
              href: '/playlist',
              icon: playlistRoute.icon
            })
          }
          
          // 실제 플레이리스트 이름 찾기
          const currentPlaylist = playlists.find(p => p.id === playlistId)
          const playlistName = currentPlaylist?.name || playlistDetailRoute?.title || '플레이리스트'
          
          breadcrumbs.push({
            label: playlistName,
            href: pathname,
            isCurrent: true,
            icon: currentPlaylist ? '🎼' : playlistDetailRoute?.icon
          })
        } else {
          // 알 수 없는 라우트의 경우 기본 처리
          const lastSegment = segments[segments.length - 1]
          const friendlyName = lastSegment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
          
          breadcrumbs.push({
            label: friendlyName,
            href: pathname,
            isCurrent: true
          })
        }
      }
    }

    return breadcrumbs
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 safe-area-inset-top">
        {/* Mobile Layout */}
        <div className="md:hidden flex items-center gap-2 px-3 w-full">
          <SidebarTrigger className="-ml-1 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <Breadcrumb>
              <BreadcrumbList>
                {getBreadcrumbs().filter(b => !b.isHome || b.isCurrent).map((breadcrumb, index) => (
                  <div key={`${breadcrumb.href}-${index}`} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className="min-w-0">
                      {breadcrumb.isCurrent ? (
                        <BreadcrumbPage className="text-foreground font-semibold text-sm truncate flex items-center gap-1">
                          {/* {breadcrumb.icon && <span className="text-xs">{breadcrumb.icon}</span>} */}
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          href={breadcrumb.href} 
                          className="text-muted-foreground hover:text-foreground text-sm truncate flex items-center gap-1"
                        >
                          {/* {breadcrumb.icon && <span className="text-xs">{breadcrumb.icon}</span>} */}
                          {breadcrumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {session && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground h-9 w-9"
                onClick={() => setAddLinkModalOpen(true)}
                title="Add YouTube Link"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
            <ThemeToggle className="h-9 w-9" />
            
            {/* Mobile Authentication */}
            {status === "loading" ? (
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profileImage || undefined} alt={session.user?.name || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {profileName ? getUserInitials(profileName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{profileName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleSignIn} className="text-xs px-2 h-9">
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex items-center gap-2 px-4 w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {getBreadcrumbs().map((breadcrumb, index) => (
                  <div key={`${breadcrumb.href}-${index}`} className="flex items-center">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem className={breadcrumb.isHome ? "" : ""}>
                      {breadcrumb.isCurrent ? (
                        <BreadcrumbPage className="text-foreground font-semibold flex items-center gap-1.5">
                          {/* {breadcrumb.icon && <span className="text-sm">{breadcrumb.icon}</span>} */}
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          href={breadcrumb.href} 
                          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                        >
                          {/* {breadcrumb.icon && <span className="text-sm">{breadcrumb.icon}</span>} */}
                          {breadcrumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4 ml-auto pr-4">
            {session && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setAddLinkModalOpen(true)}
                title="Add YouTube Link"
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
            <ThemeToggle />
            
            {/* Desktop Authentication */}
            {status === "loading" ? (
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profileImage || undefined} alt={session.user?.name || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {profileName ? getUserInitials(profileName) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profileName || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setProfileModalOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem> */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleSignIn}>
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {session && (
        <>
          <AddLinkModal 
            open={addLinkModalOpen} 
            onOpenChange={setAddLinkModalOpen} 
          />
          <ProfileModal
            open={profileModalOpen}
            onOpenChange={setProfileModalOpen}
          />
        </>
      )}
    </>
  )
}