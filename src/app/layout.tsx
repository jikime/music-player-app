import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "sonner";
import { MusicPlayer } from "@/components/songs/music-player";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://vibemusic.app'),
  title: {
    default: 'VIBE Music - 무료 음악 스트리밍 서비스',
    template: '%s | VIBE Music'
  },
  description: '무료 온라인 음악 스트리밍 서비스. 최신 음악, 플레이리스트, 트렌딩 차트를 즐기세요. PC와 모바일에서 무료로 음악을 들어보세요.',
  keywords: [
    '음악 스트리밍',
    '무료 음악',
    '온라인 음악',
    '플레이리스트',
    '음악 차트',
    'VIBE Music',
    '음악 듣기',
    '무료 스트리밍',
    'K-POP',
    '최신 음악'
  ],
  authors: [{ name: 'VIBE Music Team' }],
  creator: 'VIBE Music',
  publisher: 'VIBE Music',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  openGraph: {
    title: 'VIBE Music - 무료 음악 스트리밍 서비스',
    description: '무료 온라인 음악 스트리밍 서비스. 최신 음악, 플레이리스트, 트렌딩 차트를 즐기세요.',
    url: 'https://vibemusic.app',
    siteName: 'VIBE Music',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VIBE Music - 무료 음악 스트리밍',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VIBE Music - 무료 음악 스트리밍 서비스',
    description: '무료 온라인 음악 스트리밍 서비스. 최신 음악, 플레이리스트, 트렌딩 차트를 즐기세요.',
    images: ['/og-image.png'],
    creator: '@vibemusic',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
      },
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://vibemusic.app',
    languages: {
      'ko-KR': 'https://vibemusic.app',
      'en-US': 'https://vibemusic.app/en',
    },
    types: {
      'application/rss+xml': 'https://vibemusic.app/rss.xml',
    },
  },
  category: 'music',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'VIBE Music',
    description: '무료 온라인 음악 스트리밍 서비스',
    url: 'https://vibemusic.app',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'KRW',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: '1000',
    },
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen overflow-hidden bg-background text-foreground`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors />
          </ThemeProvider>
        </AuthProvider>
        <Script 
          src="https://www.youtube.com/iframe_api" 
          strategy="afterInteractive"
        />
        <MusicPlayer />
      </body>
    </html>
  );
}
