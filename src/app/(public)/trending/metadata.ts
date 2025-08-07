import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '트렌딩 차트',
  description: '실시간 인기 음악 차트. 일간, 주간, 월간 트렌딩 차트를 확인하고 최신 인기곡을 들어보세요.',
  keywords: ['트렌딩 음악', '인기 차트', '실시간 차트', '음악 순위', 'TOP 100', '인기곡'],
  openGraph: {
    title: 'VIBE Music - 트렌딩 차트',
    description: '실시간 인기 음악 차트. 일간, 주간, 월간 트렌딩 차트를 확인하고 최신 인기곡을 들어보세요.',
    type: 'music.playlist',
    url: 'https://music.cookai.dev/trending',
    images: [
      {
        url: '/images/vibe_music.png',
        width: 1422,
        height: 1120,
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
    canonical: 'https://music.cookai.dev/trending',
  },
}