import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period_type, date } = body
    
    console.log(`API: Getting trending data for ${period_type} on ${date}`)
    
    // Get real trending data using our new function
    const { data: trendingData, error } = await supabase
      .rpc('get_trending_data', {
        p_period_type: period_type || 'weekly',
        p_snapshot_date: date || new Date().toISOString().split('T')[0]
      })
    
    if (error) {
      console.error('Error fetching trending data:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trending data', details: error },
        { status: 500 }
      )
    }
    
    console.log('Raw trending data from Supabase:', trendingData?.length || 0, 'songs')
    
    // Transform to match TrendingSong interface
    const trendingSongs = (trendingData || []).map((song: {
      song_id: string
      title: string
      artist: string
      album: string | null
      duration: number
      url: string
      thumbnail: string | null
      plays: number
      liked: boolean
      shared: boolean
      current_ranking: number
      previous_ranking: number
      ranking_change: number
      trending_score: string
      play_increase_percent: string
    }) => ({
      id: song.song_id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      url: song.url,
      thumbnail: song.thumbnail || '',
      uploadedAt: new Date(), // We could get this from the database if needed
      plays: song.plays,
      liked: song.liked,
      shared: song.shared,
      trendingScore: parseFloat(song.trending_score || '0'),
      playIncrease: parseFloat(song.play_increase_percent || '0'),
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