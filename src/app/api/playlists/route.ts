import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'
import { validateCoverImage } from '@/lib/playlist-utils'

// Response cache for identical requests
const responseCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 seconds

// Cache cleanup interval
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      responseCache.delete(key)
    }
  }
}, 60 * 1000) // Cleanup every minute

// GET - Optimized playlist retrieval with separated queries to avoid complex joins
export async function GET() {
  try {
    // Create cache key for user-specific playlists
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cacheKey = `playlists-${currentUser.id}`
    
    // Check cache first
    const cached = responseCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // Step 1: Get playlists efficiently (without complex joins)
    const { data: playlists, error: playlistsError } = await supabase
      .from('playlists')
      .select('id, name, description, cover_image, has_notification, created_at, updated_at')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (playlistsError) {
      console.error('Error fetching playlists:', playlistsError)
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 })
    }

    if (!playlists || playlists.length === 0) {
      const responseData = { playlists: [] }
      
      // Cache empty result briefly
      responseCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      })
      
      return NextResponse.json(responseData)
    }

    // Step 2: Get playlist songs for all playlists efficiently
    const playlistIds = playlists.map(p => p.id)
    const { data: playlistSongs, error: songsError } = await supabase
      .from('playlist_songs')
      .select('playlist_id, song_id, position')
      .in('playlist_id', playlistIds)
      .order('position', { ascending: true })

    if (songsError) {
      console.error('Error fetching playlist songs:', songsError)
      return NextResponse.json({ error: 'Failed to fetch playlist songs' }, { status: 500 })
    }

    // Step 3: Transform data efficiently
    const songsMap = new Map<string, string[]>()
    
    // Group songs by playlist
    if (playlistSongs) {
      for (const ps of playlistSongs) {
        if (!songsMap.has(ps.playlist_id)) {
          songsMap.set(ps.playlist_id, [])
        }
        songsMap.get(ps.playlist_id)!.push(ps.song_id)
      }
    }

    // Transform playlists with optimized object creation
    const transformedPlaylists = playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      songs: songsMap.get(playlist.id) || [],
      createdAt: playlist.created_at ? new Date(playlist.created_at) : new Date(),
      updatedAt: playlist.updated_at ? new Date(playlist.updated_at) : new Date(),
      hasNotification: playlist.has_notification || false,
      description: playlist.description || '',
      coverImage: playlist.cover_image || ''
    }))

    const responseData = { playlists: transformedPlaylists }

    // Cache the response
    responseCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    // Set appropriate cache headers
    const response = NextResponse.json(responseData)
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    response.headers.set('X-Cache-Status', cached ? 'HIT' : 'MISS')
    
    return response

  } catch (error) {
    console.error('Error in GET /api/playlists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Optimized playlist creation with validation caching and cache invalidation
export async function POST(request: NextRequest) {
  try {
    // Get current user (cached in auth layer)
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, coverImage, hasNotification } = body

    // Enhanced validation with early returns
    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Playlist name is required' },
        { status: 400 }
      )
    }

    // Optimized image validation
    if (coverImage) {
      const validation = validateCoverImage(coverImage)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid cover image' },
          { status: 400 }
        )
      }

      const isGradient = coverImage.startsWith('bg-')
      const isBase64 = coverImage.startsWith('data:image/')
      const size = coverImage.length
      console.log(`Playlist Cover Image - Type: ${isGradient ? 'gradient' : isBase64 ? 'base64' : 'unknown'}, Size: ${size} chars`)
      
      if (isBase64) {
        const estimatedBytes = Math.floor((coverImage.split(',')[1]?.length || 0) * 3 / 4)
        console.log(`Base64 image estimated size: ${estimatedBytes} bytes (${(estimatedBytes / 1024).toFixed(2)} KB)`)
        
        // 10MB 제한
        if (estimatedBytes > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Cover image is too large. Maximum size is 10MB.' },
            { status: 400 }
          )
        }
      }
    }

    // Optimized database insertion
    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert([{
        name: name.trim(),
        description: description?.trim() || null,
        cover_image: coverImage?.trim() || null,
        has_notification: Boolean(hasNotification),
        user_id: currentUser.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating playlist:', error)
      
      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Playlist with this name already exists' }, { status: 409 })
      }
      
      return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 })
    }

    // Clear relevant caches
    const userCacheKey = `playlists-${currentUser.id}`
    responseCache.delete(userCacheKey)

    // Transform and return the new playlist
    const transformedPlaylist = {
      id: playlist.id,
      name: playlist.name,
      songs: [],
      createdAt: playlist.created_at ? new Date(playlist.created_at) : new Date(),
      updatedAt: playlist.updated_at ? new Date(playlist.updated_at) : new Date(),
      hasNotification: playlist.has_notification || false,
      description: playlist.description || '',
      coverImage: playlist.cover_image || ''
    }

    return NextResponse.json(
      { playlist: transformedPlaylist }, 
      { 
        status: 201,
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    )

  } catch (error) {
    console.error('Error in POST /api/playlists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}