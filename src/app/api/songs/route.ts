import { NextRequest, NextResponse } from 'next/server'
import { supabase, DatabaseSong } from '@/lib/supabase'

// GET - 모든 노래 조회
export async function GET() {
  try {
    const { data: songs, error } = await supabase
      .from('songs')
      .select('*')
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Error fetching songs:', error)
      return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
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
    console.error('Error in GET /api/songs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 새 노래 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, artist, album, duration, url, thumbnail, lyrics, plays, liked } = body

    // 필수 필드 검증
    if (!title || !artist || !url) {
      return NextResponse.json(
        { error: 'Title, artist, and URL are required' },
        { status: 400 }
      )
    }

    const { data: song, error } = await supabase
      .from('songs')
      .insert([{
        title,
        artist,
        album,
        duration: duration || 0,
        url,
        thumbnail,
        lyrics,
        plays: plays || 0,
        liked: liked || false
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating song:', error)
      return NextResponse.json({ error: 'Failed to create song' }, { status: 500 })
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

    return NextResponse.json({ song: transformedSong }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/songs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}