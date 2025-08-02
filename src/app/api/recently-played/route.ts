import { NextRequest, NextResponse } from 'next/server'
import { supabase, DatabaseSong } from '@/lib/supabase'

// GET - 최근 재생된 노래들 조회
export async function GET() {
  try {
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recently played songs:', error)
      return NextResponse.json({ error: 'Failed to fetch recently played songs' }, { status: 500 })
    }

    // Database 형식을 클라이언트 형식으로 변환
    const transformedSongs = songs.map((song: DatabaseSong) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      url: song.url,
      thumbnail: song.thumbnail,
      lyrics: song.lyrics,
      uploadedAt: song.uploaded_at ? new Date(song.uploaded_at) : new Date(),
      plays: song.plays,
      liked: song.liked
    }))

    return NextResponse.json({ songs: transformedSongs })
  } catch (error) {
    console.error('Error in GET /api/recently-played:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 재생 기록 업데이트 (plays 카운트 증가)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { songId } = body

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      )
    }

    // 먼저 현재 노래 정보를 가져옴
    const { data: currentSong, error: fetchError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()

    if (fetchError) {
      console.error('Error fetching current song:', fetchError)
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    // plays 카운트를 1 증가하여 업데이트
    const { data: song, error } = await supabase
      .from('songs')
      .update({ 
        plays: (currentSong.plays || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', songId)
      .select()
      .single()

    if (error) {
      console.error('Error updating play count:', error)
      return NextResponse.json({ error: 'Failed to update play count' }, { status: 500 })
    }

    // Database 형식을 클라이언트 형식으로 변환
    const transformedSong = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      url: song.url,
      thumbnail: song.thumbnail,
      lyrics: song.lyrics,
      uploadedAt: song.uploaded_at ? new Date(song.uploaded_at) : new Date(),
      plays: song.plays,
      liked: song.liked
    }

    return NextResponse.json({ song: transformedSong })
  } catch (error) {
    console.error('Error in POST /api/recently-played:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}