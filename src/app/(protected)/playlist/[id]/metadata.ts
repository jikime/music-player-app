import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '플레이리스트',
  description: '나만의 플레이리스트를 만들고 관리하세요. 좋아하는 음악을 모아서 언제든 감상할 수 있습니다.',
  keywords: ['플레이리스트', '음악 모음', '개인 플레이리스트', '음악 컬렉션', '음악 관리'],
  openGraph: {
    title: 'VIBE Music - 플레이리스트',
    description: '나만의 플레이리스트를 만들고 관리하세요.',
    type: 'music.playlist',
    url: 'https://music.cookai.dev/playlist',
    images: [
      {
        url: '/images/vibe_music.png',
        width: 1422,
        height: 1120,
        alt: 'VIBE Music 플레이리스트',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIBE Music - 플레이리스트',
    description: '나만의 플레이리스트를 만들고 관리하세요',
  },
  alternates: {
    canonical: 'https://music.cookai.dev/playlist',
  },
}