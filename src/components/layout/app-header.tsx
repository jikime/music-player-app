'use client'

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
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
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function AppHeader() {
  const [addLinkModalOpen, setAddLinkModalOpen] = useState(false)
  const { data: session, status } = useSession()
  const pathname = usePathname()

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

  // 경로에 따른 breadcrumb 생성
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: Array<{
      label: string;
      href: string;
      isHome?: boolean;
      isCurrent?: boolean;
      isLink?: boolean;
    }> = [
      { label: 'VIBE Music', href: '/', isHome: true }
    ]

    // 현재 경로에 따른 breadcrumb 매핑
    if (pathname === '/') {
      breadcrumbs.push({ label: 'Discover', href: '/', isCurrent: true })
    } else if (pathname === '/trending') {
      breadcrumbs.push({ label: 'Trending', href: '/trending', isCurrent: true })
    } else if (pathname.startsWith('/playlist/')) {
      breadcrumbs.push({ label: 'Playlists', href: '/playlist', isLink: true })
      // playlist ID가 있는 경우
      if (segments.length > 1) {
        breadcrumbs.push({ label: `Playlist ${segments[1]}`, href: pathname, isCurrent: true })
      }
    } else {
      // 기본적으로 현재 경로의 마지막 segment를 사용
      const currentSegment = segments[segments.length - 1]
      if (currentSegment) {
        breadcrumbs.push({ 
          label: currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1), 
          href: pathname, 
          isCurrent: true 
        })
      }
    }

    return breadcrumbs
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                        <BreadcrumbPage className="text-foreground font-semibold text-sm truncate">
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          href={breadcrumb.href} 
                          className="text-muted-foreground hover:text-foreground text-sm truncate"
                        >
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
                      <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                        {session.user?.name ? getUserInitials(session.user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{session.user?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
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
                        <BreadcrumbPage className="text-foreground font-semibold">
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink 
                          href={breadcrumb.href} 
                          className="text-muted-foreground hover:text-foreground"
                        >
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
                      <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {session.user?.name ? getUserInitials(session.user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
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
        <AddLinkModal 
          open={addLinkModalOpen} 
          onOpenChange={setAddLinkModalOpen} 
        />
      )}
    </>
  )
}