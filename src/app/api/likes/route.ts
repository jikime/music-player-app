import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'

// GET - 현재 사용자의 좋아요 목록 조회
export async function GET() {
  try {
    console.log('GET /api/likes called')
    
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('No current user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('Current user:', currentUser.id)

    const { data: likes, error } = await supabase
      .from('likes')
      .select(`
        *,
        songs(*)
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching likes:', error)
      return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
    }

    console.log('Likes fetched from DB:', likes?.length || 0)

    // Database 형식을 클라이언트 형식으로 변환
    const transformedLikes = likes.map((like: { 
      id: string; 
      song_id: string; 
      created_at: string; 
      songs: {
        id: string;
        title: string;
        artist: string;
        album: string;
        duration: number;
        url: string;
        thumbnail: string;
        image_data: string;
        lyrics: string;
        uploaded_at: string;
        plays: number;
        liked: boolean;
        shared: boolean;
      }
    }) => ({
      id: like.id,
      songId: like.song_id,
      createdAt: like.created_at ? new Date(like.created_at) : new Date(),
      song: {
        id: like.songs.id,
        title: like.songs.title,
        artist: like.songs.artist,
        album: like.songs.album,
        duration: like.songs.duration,
        url: like.songs.url,
        thumbnail: like.songs.thumbnail,
        image_data: like.songs.image_data,
        lyrics: like.songs.lyrics,
        uploadedAt: like.songs.uploaded_at ? new Date(like.songs.uploaded_at) : new Date(),
        plays: like.songs.plays,
        liked: like.songs.liked,
        shared: like.songs.shared
      }
    }))

    console.log('Transformed likes:', transformedLikes.length)
    return NextResponse.json({ likes: transformedLikes })
  } catch (error) {
    console.error('Error in GET /api/likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 좋아요 추가
export async function POST(request: NextRequest) {
  try {
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { songId } = body

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      )
    }

    const { data: like, error } = await supabase
      .from('likes')
      .insert([{
        song_id: songId,
        user_id: currentUser.id
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        return NextResponse.json(
          { error: 'Song is already liked' },
          { status: 409 }
        )
      }
      console.error('Error creating like:', error)
      return NextResponse.json({ error: 'Failed to create like' }, { status: 500 })
    }

    // Database 형식to 클라이언트 형식으로 변환
    const transformedLike = {
      id: like.id,
      songId: like.song_id,
      createdAt: like.created_at ? new Date(like.created_at) : new Date()
    }

    return NextResponse.json({ like: transformedLike }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 좋아요 제거 (by songId)
export async function DELETE(request: NextRequest) {
  try {
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const songId = searchParams.get('songId')

    if (!songId) {
      return NextResponse.json(
        { error: 'Song ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('song_id', songId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error deleting like:', error)
      return NextResponse.json({ error: 'Failed to delete like' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Like deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/likes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}