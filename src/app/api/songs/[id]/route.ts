import { NextRequest, NextResponse } from 'next/server'
import { supabase, DatabaseSong } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'

// 소유권 검증 헬퍼 함수
async function verifyOwnership(songId: string, userId: string) {
  const { data: song, error } = await supabase
    .from('songs')
    .select('user_id')
    .eq('id', songId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return { error: 'Song not found', status: 404 }
    }
    return { error: 'Database error', status: 500 }
  }

  // 공용 노래(user_id가 null)는 수정/삭제 불가
  if (song.user_id === null) {
    return { error: 'Cannot modify public songs', status: 403 }
  }

  // 소유자가 아닌 경우
  if (song.user_id !== userId) {
    return { error: 'Forbidden', status: 403 }
  }

  return { success: true }
}

// GET - 특정 노래 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data: song, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 })
      }
      console.error('Error fetching song:', error)
      return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 })
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
      liked: song.liked,
      shared: song.shared
    }

    return NextResponse.json({ song: transformedSong })
  } catch (error) {
    console.error('Error in GET /api/songs/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - 노래 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 소유권 검증
    const ownershipCheck = await verifyOwnership(id, currentUser.id)
    if (!ownershipCheck.success) {
      return NextResponse.json({ error: ownershipCheck.error }, { status: ownershipCheck.status })
    }

    const body = await request.json()
    const { title, artist, album, duration, url, thumbnail, lyrics, plays, liked, shared } = body

    const updateData: Partial<DatabaseSong> = {}
    if (title !== undefined) updateData.title = title
    if (artist !== undefined) updateData.artist = artist
    if (album !== undefined) updateData.album = album
    if (duration !== undefined) updateData.duration = duration
    if (url !== undefined) updateData.url = url
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail
    if (lyrics !== undefined) updateData.lyrics = lyrics
    if (plays !== undefined) updateData.plays = plays
    if (liked !== undefined) updateData.liked = liked
    if (shared !== undefined) updateData.shared = shared

    const { data: song, error } = await supabase
      .from('songs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Song not found' }, { status: 404 })
      }
      console.error('Error updating song:', error)
      return NextResponse.json({ error: 'Failed to update song' }, { status: 500 })
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
      liked: song.liked,
      shared: song.shared
    }

    return NextResponse.json({ song: transformedSong })
  } catch (error) {
    console.error('Error in PUT /api/songs/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 노래 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 소유권 검증
    const ownershipCheck = await verifyOwnership(id, currentUser.id)
    if (!ownershipCheck.success) {
      return NextResponse.json({ error: ownershipCheck.error }, { status: ownershipCheck.status })
    }

    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting song:', error)
      return NextResponse.json({ error: 'Failed to delete song' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Song deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/songs/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}