import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'

// GET - 현재 사용자의 북마크 조회
export async function GET() {
  try {
    console.log('GET /api/bookmarks called')
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      console.log('No current user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('Current user:', currentUser.id)

    const { data: bookmarks, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        songs(*)
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookmarks:', error)
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
    }

    console.log('Bookmarks fetched from DB:', bookmarks?.length || 0)

    // Database 형식을 클라이언트 형식으로 변환
    const transformedBookmarks = bookmarks.map((bookmark: { id: string; song_id: string; created_at: string }) => ({
      id: bookmark.id,
      songId: bookmark.song_id,
      createdAt: bookmark.created_at ? new Date(bookmark.created_at) : new Date()
    }))

    console.log('Transformed bookmarks:', transformedBookmarks.length)
    return NextResponse.json({ bookmarks: transformedBookmarks })
  } catch (error) {
    console.error('Error in GET /api/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 북마크 추가
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

    const { data: bookmark, error } = await supabase
      .from('bookmarks')
      .insert([{
        song_id: songId,
        user_id: currentUser.id
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        return NextResponse.json(
          { error: 'Song is already bookmarked' },
          { status: 409 }
        )
      }
      console.error('Error creating bookmark:', error)
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
    }

    // Database 형식to 클라이언트 형식으로 변환
    const transformedBookmark = {
      id: bookmark.id,
      songId: bookmark.song_id,
      createdAt: bookmark.created_at ? new Date(bookmark.created_at) : new Date()
    }

    return NextResponse.json({ bookmark: transformedBookmark }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - 북마크 제거 (by songId)
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
      .from('bookmarks')
      .delete()
      .eq('song_id', songId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error deleting bookmark:', error)
      return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Bookmark deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}