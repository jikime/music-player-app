import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '내 음악',
  description: '내가 업로드한 음악을 관리하고 재생하세요. VIBE Music에서 나만의 음악 라이브러리를 만드세요.',
  keywords: ['내 음악', '업로드 음악', '음악 관리', '개인 라이브러리', '음악 컬렉션'],
  openGraph: {
    title: 'VIBE Music - 내 음악',
    description: '내가 업로드한 음악을 관리하고 재생하세요.',
    type: 'music.playlist',
    url: 'https://music.cookai.dev/my-songs',
    images: [
      {
        url: '/images/vibe_music.png',
        width: 400,
        height: 400,
        alt: 'VIBE Music 내 음악',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIBE Music - 내 음악',
    description: '내가 업로드한 음악을 관리하고 재생하세요',
  },
  alternates: {
    canonical: 'https://music.cookai.dev/my-songs',
  },
  robots: {
    index: false,
    follow: true,
  },
}