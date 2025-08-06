import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '트렌딩 차트',
  description: '실시간 인기 음악 차트. 일간, 주간, 월간 트렌딩 차트를 확인하고 최신 인기곡을 들어보세요.',
  keywords: ['트렌딩 음악', '인기 차트', '실시간 차트', '음악 순위', 'TOP 100', '인기곡'],
  openGraph: {
    title: 'VIBE Music - 트렌딩 차트',
    description: '실시간 인기 음악 차트. 일간, 주간, 월간 트렌딩 차트를 확인하고 최신 인기곡을 들어보세요.',
    type: 'music.playlist',
    url: 'https://vibemusic.app/trending',
    images: [
      {
        url: '/og-trending.png',
        width: 1200,
        height: 630,
        alt: 'VIBE Music 트렌딩 차트',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIBE Music - 트렌딩 차트',
    description: '실시간 인기 음악 차트를 확인하세요',
  },
  alternates: {
    canonical: 'https://vibemusic.app/trending',
  },
}