import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// 보호할 페이지 경로 목록 (인증 필요)
const protectedPageRoutes = [
  "/playlist",
]

// 보호할 API 경로 목록 (인증 필요)
const protectedApiRoutes = [
  "/api/playlists",
  "/api/bookmarks",
]

// 인증 페이지 경로 (로그인한 사용자는 접근 불가)
const authPages = [
  "/signin",
  "/signup",
  "/error",
]

// 공개 API 경로 (인증 불필요)
const publicApiRoutes = [
  "/api/auth",
  "/api/songs",
  "/api/recently-played",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Development logging
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] Processing: ${pathname}`)
  }
  
  try {
    // JWT 토큰 확인
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    
    const isAuthenticated = !!token
    
    if (process.env.NODE_ENV === "development") {
      console.log(`[Middleware] Authenticated: ${isAuthenticated}`)
      if (token) {
        console.log(`[Middleware] User: ${token.email}`)
      }
    }
    
    // 정적 파일, _next 경로는 미들웨어 건너뛰기
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/static") ||
      pathname.includes(".") // 파일 확장자가 있는 경우
    ) {
      return NextResponse.next()
    }
    
    // 공개 API 경로 처리
    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }
    
    // 보호된 API 경로 처리
    const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route))
    if (isProtectedApi) {
      if (!isAuthenticated) {
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            message: "Authentication required",
            error: "Unauthorized" 
          }),
          { 
            status: 401, 
            headers: { 
              "Content-Type": "application/json",
              "WWW-Authenticate": "Bearer"
            } 
          }
        )
      }
      // 인증된 사용자는 API 접근 허용
      return NextResponse.next()
    }
    
    // 인증 페이지 처리
    const isAuthPage = authPages.some(page => 
      pathname === `/${page}` || 
      pathname === `/auth/${page}` ||
      pathname.startsWith(`/${page}/`) ||
      pathname.startsWith(`/auth/${page}/`)
    )
    
    if (isAuthPage) {
      // 이미 로그인한 사용자는 메인 페이지로 리다이렉트
      if (isAuthenticated) {
        const redirectUrl = request.nextUrl.searchParams.get("callbackUrl") || "/"
        return NextResponse.redirect(new URL(redirectUrl, request.url))
      }
      // 로그인하지 않은 사용자는 인증 페이지 접근 허용
      return NextResponse.next()
    }
    
    // 보호된 페이지 경로 처리
    const isProtectedPage = protectedPageRoutes.some(route => {
      if (route === "/") {
        return pathname === "/"
      }
      return pathname === route || pathname.startsWith(`${route}/`)
    })
    
    if (isProtectedPage && !isAuthenticated) {
      // 로그인하지 않은 사용자를 로그인 페이지로 리다이렉트
      const signInUrl = new URL("/signin", request.url)
      signInUrl.searchParams.set("callbackUrl", pathname)
      
      if (process.env.NODE_ENV === "development") {
        console.log(`[Middleware] Redirecting to: ${signInUrl.toString()}`)
      }
      
      return NextResponse.redirect(signInUrl)
    }
    
    // 나머지 모든 경로는 접근 허용
    return NextResponse.next()
    
  } catch (error) {
    console.error("[Middleware] Error:", error)
    
    // 에러 발생 시 적절한 처리
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          message: "Internal server error",
          error: "Authentication check failed" 
        }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json" } 
        }
      )
    }
    
    // 페이지 요청의 경우 에러 페이지로 리다이렉트
    return NextResponse.redirect(new URL("/error", request.url))
  }
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - image files (.svg, .png, .jpg, .jpeg, .gif, .webp)
     * - font files (.woff, .woff2, .ttf, .otf)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)$).*)",
  ],
}