import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://vibemusic.app'
  
  // Fetch latest songs for RSS feed
  const { data: songs } = await supabase
    .from('songs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  const rssItems = songs?.map(song => `
    <item>
      <title><![CDATA[${song.title}]]></title>
      <description><![CDATA[${song.artist}${song.album ? ` - ${song.album}` : ''}]]></description>
      <link>${baseUrl}/song/${song.id}</link>
      <guid isPermaLink="true">${baseUrl}/song/${song.id}</guid>
      <pubDate>${new Date(song.created_at).toUTCString()}</pubDate>
      <enclosure url="${song.url}" type="audio/mpeg" />
      ${song.thumbnail ? `<media:thumbnail url="${song.thumbnail}" />` : ''}
    </item>
  `).join('') || ''

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VIBE Music - 최신 음악</title>
    <description>VIBE Music의 최신 음악을 구독하세요</description>
    <link>${baseUrl}</link>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}