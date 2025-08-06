import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, Music } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - 페이지를 찾을 수 없습니다',
  description: '요청하신 페이지를 찾을 수 없습니다. VIBE Music 홈으로 돌아가세요.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" role="main">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <Music className="w-24 h-24 mx-auto text-muted-foreground/30" />
        </div>
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button variant="default" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
          <Link href="/trending">
            <Button variant="outline" className="w-full sm:w-auto">
              <Search className="w-4 h-4 mr-2" />
              트렌딩 보기
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}