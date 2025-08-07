import type { Metadata } from 'next'

export const homeMetadata: Metadata = {
  title: '홈',
  description: '최신 음악과 인기 플레이리스트를 발견하세요. VIBE Music에서 무료로 음악을 스트리밍하세요.',
  keywords: ['음악 스트리밍', 'VIBE Music', '무료 음악', '플레이리스트', '음악 감상'],
  openGraph: {
    title: 'VIBE Music - 홈',
    description: '최신 음악과 인기 플레이리스트를 발견하세요. VIBE Music에서 무료로 음악을 스트리밍하세요.',
    type: 'website',
    url: 'https://music.cookai.dev',
    images: [
      {
        url: '/images/vibe_music.png',
        width: 1422,
        height: 1120,
        alt: 'VIBE Music',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIBE Music',
    description: '최신 음악과 인기 플레이리스트를 발견하세요',
    images: ['/images/vibe_music.png'],
  },
  alternates: {
    canonical: 'https://music.cookai.dev',
  },
}

export const trendingMetadata: Metadata = {
  title: '트렌딩 차트',
  description: '실시간 인기 음악 차트. 일간, 주간, 월간 트렌딩 차트를 확인하고 최신 인기곡을 들어보세요.',
  openGraph: {
    title: 'VIBE Music - 트렌딩 차트',
    description: '실시간 인기 음악 차트. 일간, 주간, 월간 트렌딩 차트를 확인하고 최신 인기곡을 들어보세요.',
    type: 'music.playlist',
    url: 'https://music.cookai.dev/trending',
  },
  alternates: {
    canonical: 'https://music.cookai.dev/trending',
  },
}