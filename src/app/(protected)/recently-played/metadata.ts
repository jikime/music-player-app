import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '최근 재생',
  description: '최근에 들은 음악을 다시 재생하세요. VIBE Music에서 재생 기록을 확인하세요.',
  keywords: ['최근 재생', '재생 기록', '최근 들은 음악', '음악 히스토리', '재생 목록'],
  openGraph: {
    title: 'VIBE Music - 최근 재생',
    description: '최근에 들은 음악을 다시 재생하세요.',
    type: 'music.playlist',
    url: 'https://music.cookai.dev/recently-played',
    images: [
      {
        url: '/images/vibe_music.png',
        width: 1422,
        height: 1120,
        alt: 'VIBE Music 최근 재생',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIBE Music - 최근 재생',
    description: '최근에 들은 음악을 다시 재생하세요',
  },
  alternates: {
    canonical: 'https://music.cookai.dev/recently-played',
  },
  robots: {
    index: false,
    follow: true,
  },
}