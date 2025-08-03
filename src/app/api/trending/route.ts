import { NextRequest, NextResponse } from 'next/server'
import { getTrendingDataFromSupabase } from './supabase-mcp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period_type, date } = body
    
    console.log(`API: Getting trending data for ${period_type} on ${date}`)
    
    // Get data from Supabase via MCP
    const supabaseData = await getTrendingDataFromSupabase(period_type, date)
    
    // Transform to match TrendingSong interface
    const trendingSongs = supabaseData.map(song => ({
      id: song.song_id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      url: song.url,
      thumbnail: song.thumbnail || '',
      uploadedAt: new Date(),
      plays: song.plays,
      liked: song.liked,
      trendingScore: parseFloat(song.trending_score),
      playIncrease: parseFloat(song.play_increase_percent),
      ranking: song.current_ranking,
      previousRanking: song.previous_ranking,
      rankingChange: song.ranking_change
    }))
    
    return NextResponse.json({ 
      success: true, 
      songs: trendingSongs 
    })
  } catch (error) {
    console.error('Error in trending API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending data' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests for trending data
  const { searchParams } = new URL(request.url)
  const periodType = searchParams.get('period_type') || 'weekly'
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  
  // Reuse the POST logic
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ period_type: periodType, date })
  }))
}