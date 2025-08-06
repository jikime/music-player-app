import { NextRequest, NextResponse } from 'next/server'
import { supabase, DatabaseSharedSong } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'
import type { SharedSong } from '@/types/music'

// Generate a random share ID (12 characters, URL-safe)
function generateShareId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

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

// POST /api/share - Create a new share link
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { songId, title, description, isPublic = true, expiresAt } = body

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }

    // Verify that the song exists and user has access to it
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('id')
      .eq('id', songId)
      .eq('user_id', currentUser.id)
      .single()

    if (songError || !song) {
      return NextResponse.json({ error: 'Song not found or access denied' }, { status: 404 })
    }

    // Generate unique share ID
    let shareId = generateShareId()
    let attempts = 0
    const maxAttempts = 5

    // Ensure share ID is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from('shared_songs')
        .select('id')
        .eq('share_id', shareId)
        .single()
      
      if (!existing) break
      
      shareId = generateShareId()
      attempts++
    }

    if (attempts === maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique share ID' }, { status: 500 })
    }

    // Create the shared song record
    const { data: sharedSong, error } = await supabase
      .from('shared_songs')
      .insert([{
        song_id: songId,
        user_id: currentUser.id,
        share_id: shareId,
        title,
        description,
        is_public: isPublic,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      }])
      .select()
      .single()

    if (error || !sharedSong) {
      console.error('Error creating share link:', error)
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      )
    }

    // Return the shared song with full URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/share/${shareId}`
    const transformed = transformSharedSong(sharedSong)

    return NextResponse.json({
      ...transformed,
      shareUrl
    })
  } catch (error) {
    console.error('Error creating share link:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/share - Get user's share links
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: sharedSongs, error } = await supabase
      .from('shared_songs')
      .select(`
        *,
        songs!inner (
          id,
          title,
          artist,
          thumbnail,
          duration
        )
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching share links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch share links' },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const result = sharedSongs.map(sharedSong => {
      const transformed = transformSharedSong(sharedSong)
      return {
        ...transformed,
        shareUrl: `${baseUrl}/share/${sharedSong.share_id}`,
        song: {
          id: sharedSong.songs.id,
          title: sharedSong.songs.title,
          artist: sharedSong.songs.artist,
          thumbnail: sharedSong.songs.thumbnail,
          duration: sharedSong.songs.duration
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching share links:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}