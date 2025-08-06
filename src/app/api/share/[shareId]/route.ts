import { NextRequest, NextResponse } from 'next/server'
import { supabase, DatabaseSharedSong, DatabaseSong } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'
import type { SharedSong } from '@/types/music'

// Transform database shared song to API format
function transformSharedSong(sharedSong: DatabaseSharedSong): SharedSong {
  return {
    id: sharedSong.id,
    songId: sharedSong.song_id,
    userId: sharedSong.user_id.toString(),
    shareId: sharedSong.share_id,
    title: sharedSong.title,
    description: sharedSong.description,
    isPublic: sharedSong.is_public,
    expiresAt: sharedSong.expires_at ? new Date(sharedSong.expires_at) : undefined,
    viewCount: sharedSong.view_count,
    createdAt: new Date(sharedSong.created_at),
    updatedAt: new Date(sharedSong.updated_at)
  }
}

// Transform database song to API format
function transformSong(song: DatabaseSong) {
  return {
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
}

// GET /api/share/[shareId] - Get shared song by share ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await context.params
    console.log('🔍 API: Getting shared song with ID:', shareId)

    if (!shareId) {
      console.log('❌ API: Share ID is missing')
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    // Get the shared song with the associated song data
    console.log('📡 API: Querying Supabase for shared song...')
    const { data: sharedSong, error } = await supabase
      .from('shared_songs')
      .select(`
        *,
        songs!inner (*)
      `)
      .eq('share_id', shareId)
      .single()
    
    console.log('📊 API: Supabase query result:', { sharedSong, error })

    if (error || !sharedSong) {
      console.log('❌ API: Shared song not found, error:', error)
      
      // For testing purposes, return a dummy response if no data found
      if (shareId === 'test123') {
        console.log('🧪 API: Returning test data for shareId: test123')
        return NextResponse.json({
          sharedSong: {
            id: 'test-uuid',
            songId: 'test-song-uuid',
            userId: '1',
            shareId: 'test123',
            title: 'Test Share',
            description: 'This is a test shared song',
            isPublic: true,
            expiresAt: null,
            viewCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          song: {
            id: 'test-song-uuid',
            title: 'Lofi Hip Hop Radio',
            artist: 'Lofi Girl',
            album: 'Study Music',
            duration: 300,
            url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
            thumbnail: 'https://via.placeholder.com/300x300/333/fff?text=Test+Song',
            lyrics: null,
            uploadedAt: new Date().toISOString(),
            plays: 100,
            liked: false,
            shared: 1
          }
        })
      }
      
      return NextResponse.json({ error: 'Shared song not found' }, { status: 404 })
    }

    // Check if the share has expired
    if (sharedSong.expires_at && new Date(sharedSong.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }

    // Check if the share is public or if user has access
    const currentUser = await getCurrentUser()
    if (!sharedSong.is_public && (!currentUser || currentUser.id !== sharedSong.user_id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Increment view count (fire and forget)
    const updateViewCount = async () => {
      try {
        await supabase
          .from('shared_songs')
          .update({ view_count: sharedSong.view_count + 1 })
          .eq('id', sharedSong.id)
        console.log('View count updated')
      } catch (err) {
        console.warn('Failed to update view count:', err)
      }
    }
    void updateViewCount()

    const transformedSharedSong = transformSharedSong(sharedSong)
    const transformedSong = transformSong(sharedSong.songs)

    console.log('✅ API: Returning data:', {
      sharedSong: transformedSharedSong,
      song: transformedSong
    })

    return NextResponse.json({
      sharedSong: transformedSharedSong,
      song: transformedSong
    })
  } catch (error) {
    console.error('Error fetching shared song:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/share/[shareId] - Update shared song
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await context.params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { title, description, isPublic, expiresAt } = body

    // Verify that the user owns this shared song
    const { data: existingShare, error: fetchError } = await supabase
      .from('shared_songs')
      .select('user_id')
      .eq('share_id', shareId)
      .single()

    if (fetchError || !existingShare) {
      return NextResponse.json({ error: 'Shared song not found' }, { status: 404 })
    }

    if (existingShare.user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update the shared song
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (isPublic !== undefined) updateData.is_public = isPublic
    if (expiresAt !== undefined) {
      updateData.expires_at = expiresAt ? new Date(expiresAt).toISOString() : null
    }

    const { data: updatedShare, error } = await supabase
      .from('shared_songs')
      .update(updateData)
      .eq('share_id', shareId)
      .select()
      .single()

    if (error || !updatedShare) {
      console.error('Error updating shared song:', error)
      return NextResponse.json(
        { error: 'Failed to update shared song' },
        { status: 500 }
      )
    }

    const transformed = transformSharedSong(updatedShare)
    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error updating shared song:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/share/[shareId] - Delete shared song
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await context.params
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    // Delete the shared song (only if user owns it)
    const { error } = await supabase
      .from('shared_songs')
      .delete()
      .eq('share_id', shareId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error deleting shared song:', error)
      return NextResponse.json(
        { error: 'Failed to delete shared song or not found' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Shared song deleted successfully' })
  } catch (error) {
    console.error('Error deleting shared song:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}