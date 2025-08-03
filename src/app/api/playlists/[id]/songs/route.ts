import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - 플레이리스트에 노래 추가
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { songId } = body

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      )
    }

    // 현재 플레이리스트의 마지막 position 값 가져오기
    const { data: lastSong } = await supabase
      .from('playlist_songs')
      .select('position')
      .eq('playlist_id', id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = lastSong ? lastSong.position + 1 : 0

    // 플레이리스트에 노래 추가
    const { data: playlistSong, error } = await supabase
      .from('playlist_songs')
      .insert([{
        playlist_id: id,
        song_id: songId,
        position: nextPosition
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        return NextResponse.json(
          { error: 'Song is already in this playlist' },
          { status: 409 }
        )
      }
      console.error('Error adding song to playlist:', error)
      return NextResponse.json({ error: 'Failed to add song to playlist' }, { status: 500 })
    }

    // 플레이리스트의 updated_at 업데이트
    await supabase
      .from('playlists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ 
      message: 'Song added to playlist successfully',
      playlistSong: {
        id: playlistSong.id,
        playlistId: playlistSong.playlist_id,
        songId: playlistSong.song_id,
        position: playlistSong.position
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/playlists/[id]/songs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 플레이리스트에서 노래 제거
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const songId = searchParams.get('songId')

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', id)
      .eq('song_id', songId)

    if (error) {
      console.error('Error removing song from playlist:', error)
      return NextResponse.json({ error: 'Failed to remove song from playlist' }, { status: 500 })
    }

    // 플레이리스트의 updated_at 업데이트
    await supabase
      .from('playlists')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ message: 'Song removed from playlist successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/playlists/[id]/songs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}