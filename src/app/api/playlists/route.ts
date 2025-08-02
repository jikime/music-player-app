import { NextRequest, NextResponse } from 'next/server'
import { supabase, DatabasePlaylist } from '@/lib/supabase'

// GET - 모든 플레이리스트 조회 (songs 포함)
export async function GET() {
  try {
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_songs(
          song_id,
          position,
          songs(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching playlists:', error)
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 })
    }

    // Database 형식을 클라이언트 형식으로 변환
    const transformedPlaylists = playlists.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      songs: playlist.playlist_songs
        .sort((a: any, b: any) => a.position - b.position)
        .map((ps: any) => ps.song_id),
      createdAt: playlist.created_at ? new Date(playlist.created_at) : new Date(),
      updatedAt: playlist.updated_at ? new Date(playlist.updated_at) : new Date(),
      hasNotification: playlist.has_notification
    }))

    return NextResponse.json({ playlists: transformedPlaylists })
  } catch (error) {
    console.error('Error in GET /api/playlists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 새 플레이리스트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, hasNotification } = body

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { error: 'Playlist name is required' },
        { status: 400 }
      )
    }

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert([{
        name,
        has_notification: hasNotification || false
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating playlist:', error)
      return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 })
    }

    // Database 형식을 클라이언트 형식으로 변환
    const transformedPlaylist = {
      id: playlist.id,
      name: playlist.name,
      songs: [],
      createdAt: playlist.created_at ? new Date(playlist.created_at) : new Date(),
      updatedAt: playlist.updated_at ? new Date(playlist.updated_at) : new Date(),
      hasNotification: playlist.has_notification
    }

    return NextResponse.json({ playlist: transformedPlaylist }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/playlists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}