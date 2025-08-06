import type { Metadata } from 'next'
import HomePage from './page'

export const metadata: Metadata = {
  title: '홈',
  description: '최신 음악과 인기 플레이리스트를 발견하세요. VIBE Music에서 무료로 음악을 스트리밍하세요.',
  openGraph: {
    title: 'VIBE Music - 홈',
    description: '최신 음악과 인기 플레이리스트를 발견하세요. VIBE Music에서 무료로 음악을 스트리밍하세요.',
    type: 'website',
    url: 'https://vibemusic.app',
  },
  alternates: {
    canonical: 'https://vibemusic.app',
  },
}

export default function Page() {
  return <HomePage />
}