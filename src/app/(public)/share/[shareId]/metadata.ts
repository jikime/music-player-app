import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '공유된 음악',
  description: '친구가 공유한 음악을 들어보세요. 다양한 장르의 음악을 발견하고 공유해보세요.',
  keywords: ['음악 공유', '공유 음악', '음악 감상', '음악 스트리밍', '뮤직 플레이어'],
  openGraph: {
    title: 'VIBE Music - 공유된 음악',
    description: '친구가 공유한 음악을 들어보세요.',
    type: 'music.song',
    url: 'https://music.cookai.dev/share',
    images: [
      {
        url: '/images/vibe_music.png',
        width: 1422,
        height: 1120,
        alt: 'VIBE Music 음악 공유',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIBE Music - 공유된 음악',
    description: '친구가 공유한 음악을 들어보세요',
  },
  alternates: {
    canonical: 'https://music.cookai.dev/share',
  },
}