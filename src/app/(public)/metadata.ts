import type { Metadata } from 'next'

export const homeMetadata: Metadata = {
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

export const trendingMetadata: Metadata = {
  title: '트렌딩 차트',
  description: '실시간 인기 음악 차트. 일간, 주간, 월간 트렌딩 차트를 확인하고 최신 인기곡을 들어보세요.',
  openGraph: {
    title: 'VIBE Music - 트렌딩 차트',
    description: '실시간 인기 음악 차트. 일간, 주간, 월간 트렌딩 차트를 확인하고 최신 인기곡을 들어보세요.',
    type: 'music.playlist',
    url: 'https://vibemusic.app/trending',
  },
  alternates: {
    canonical: 'https://vibemusic.app/trending',
  },
}