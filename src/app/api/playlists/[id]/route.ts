import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - 특정 플레이리스트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: playlist, error } = await supabase
      .from('playlists')
      .select(`
        *,
        playlist_songs(
          song_id,
          position,
          songs(*)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
      }
      console.error('Error fetching playlist:', error)
      return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 })
    }

    // Database 형식을 클라이언트 형식으로 변환
    const transformedPlaylist = {
      id: playlist.id,
      name: playlist.name,
      songs: playlist.playlist_songs
        .sort((a: any, b: any) => a.position - b.position)
        .map((ps: any) => ps.song_id),
      createdAt: playlist.created_at ? new Date(playlist.created_at) : new Date(),
      updatedAt: playlist.updated_at ? new Date(playlist.updated_at) : new Date(),
      hasNotification: playlist.has_notification
    }

    return NextResponse.json({ playlist: transformedPlaylist })
  } catch (error) {
    console.error('Error in GET /api/playlists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - 플레이리스트 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, hasNotification } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (hasNotification !== undefined) updateData.has_notification = hasNotification

    const { data: playlist, error } = await supabase
      .from('playlists')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Playlist not found' }, { status: 404 })
      }
      console.error('Error updating playlist:', error)
      return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 })
    }

    // 플레이리스트의 노래들도 가져오기
    const { data: playlistSongs } = await supabase
      .from('playlist_songs')
      .select('song_id, position')
      .eq('playlist_id', params.id)
      .order('position')

    // Database 형식을 클라이언트 형식으로 변환
    const transformedPlaylist = {
      id: playlist.id,
      name: playlist.name,
      songs: playlistSongs?.map(ps => ps.song_id) || [],
      createdAt: playlist.created_at ? new Date(playlist.created_at) : new Date(),
      updatedAt: playlist.updated_at ? new Date(playlist.updated_at) : new Date(),
      hasNotification: playlist.has_notification
    }

    return NextResponse.json({ playlist: transformedPlaylist })
  } catch (error) {
    console.error('Error in PUT /api/playlists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 플레이리스트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting playlist:', error)
      return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Playlist deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/playlists/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}