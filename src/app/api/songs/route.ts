import { NextRequest, NextResponse } from 'next/server'
import { supabase, DatabaseSong } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'

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

// Optimized song transformation
function transformSong(song: DatabaseSong) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    url: song.url,
    thumbnail: song.thumbnail,
    image_data: song.image_data, // Add image_data field
    lyrics: song.lyrics,
    uploadedAt: song.uploaded_at ? new Date(song.uploaded_at) : new Date(),
    plays: song.plays,
    liked: song.liked,
    shared: song.shared
  }
}

// Optimized batch song transformation
function transformSongs(songs: DatabaseSong[]) {
  return songs.map(transformSong)
}

// GET - Optimized song retrieval with intelligent caching and query optimization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const myOnly = searchParams.get('myOnly') === 'true'
    const allSongs = searchParams.get('allSongs') === 'true'
    
    // Create cache key for this specific request
    const cacheKey = `songs-${myOnly ? 'my' : allSongs ? 'all' : 'default'}-${query || 'no-query'}-${limit || 'no-limit'}`
    
    // Check cache first
    const cached = responseCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json(cached.data)
    }

    // Get current user (cached in auth layer)
    const currentUser = await getCurrentUser()
    
    // Build optimized query based on request type
    let supabaseQuery = supabase
      .from('songs')
      .select('*')

    // Optimize filtering logic - reduce OR conditions complexity
    if (myOnly) {
      // Simple case: only user's songs
      if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      supabaseQuery = supabaseQuery.eq('user_id', currentUser.id)
    } else if (allSongs) {
      // All visible songs - optimize with better indexing strategy
      if (currentUser) {
        // Use more efficient query structure
        supabaseQuery = supabaseQuery.or(`user_id.is.null,shared.eq.true,user_id.eq.${currentUser.id}`)
      } else {
        // Public songs only - most efficient query
        supabaseQuery = supabaseQuery.or('user_id.is.null,shared.eq.true')
      }
    } else {
      // Default: public + user's songs
      if (currentUser) {
        supabaseQuery = supabaseQuery.or(`user_id.is.null,user_id.eq.${currentUser.id}`)
      } else {
        supabaseQuery = supabaseQuery.is('user_id', null)
      }
    }

    // Add search filter if provided - optimize with better text search
    if (query) {
      const searchTerm = `%${query}%`
      supabaseQuery = supabaseQuery.or(
        `title.ilike.${searchTerm},artist.ilike.${searchTerm},album.ilike.${searchTerm}`
      )
    }

    // Apply limit efficiently
    if (limit && limit > 0) {
      supabaseQuery = supabaseQuery.limit(Math.min(limit, 100)) // Cap at 100 for safety
    } else {
      supabaseQuery = supabaseQuery.limit(500) // Default reasonable limit
    }

    // Order by most recent first with optimized index usage
    supabaseQuery = supabaseQuery.order('uploaded_at', { ascending: false })

    // Execute query
    const { data: songs, error } = await supabaseQuery

    if (error) {
      console.error('Error fetching songs:', error)
      return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
    }

    // Transform songs efficiently
    const transformedSongs = transformSongs(songs)

    // Prepare response
    const responseData = { songs: transformedSongs }

    // Cache the response for future identical requests
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
    console.error('Error in GET /api/songs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Optimized song creation with validation caching
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, artist, album, duration, url, thumbnail, image_data, lyrics, plays, liked, shared } = body

    // Debug log for song creation
    console.log('🔍 API creating song:', title?.trim())

    // Enhanced validation with early returns
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!artist?.trim()) {
      return NextResponse.json({ error: 'Artist is required' }, { status: 400 })
    }
    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format (basic check)
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Prepare data for database insertion
    const insertData = {
      title: title.trim(),
      artist: artist.trim(),
      album: album?.trim() || null,
      duration: Math.max(0, duration || 0),
      url: url.trim(),
      thumbnail: thumbnail?.trim() || null,
      image_data: image_data || null, // Don't trim base64 data
      lyrics: lyrics?.trim() || null,
      plays: Math.max(0, plays || 0),
      liked: Boolean(liked),
      shared: Boolean(shared),
      user_id: currentUser.id
    }

    console.log('🗄️ Inserting song into database:', insertData.title)

    // Optimized database insertion
    const { data: song, error } = await supabase
      .from('songs')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating song:', error)
      
      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Song with this URL already exists' }, { status: 409 })
      }
      
      return NextResponse.json({ error: 'Failed to create song' }, { status: 500 })
    }

    console.log('✅ Song created:', song.title)

    // Clear relevant caches
    for (const key of responseCache.keys()) {
      if (key.includes('songs-')) {
        responseCache.delete(key)
      }
    }

    // Transform and return the new song
    const transformedSong = transformSong(song)
    
    console.log('🔄 Returning created song:', transformedSong.title)

    return NextResponse.json(
      { song: transformedSong }, 
      { 
        status: 201,
        headers: {
          'Cache-Control': 'no-cache'
        }
      }
    )

  } catch (error) {
    console.error('Error in POST /api/songs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Optimized song update
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songId = searchParams.get('id')
    
    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates = { ...body }

    // Debug log for song update
    console.log('🔍 API received UPDATE request for song:', songId)
    console.log('📥 Raw request body:', {
      hasImageData: !!body.image_data,
      imageDataLength: body.image_data?.length || 0,
      imageDataType: typeof body.image_data,
      imageDataPreview: body.image_data ? body.image_data.substring(0, 50) + '...' : null,
      allFields: Object.keys(body),
      bodySize: JSON.stringify(body).length
    })

    // Remove undefined/null values and trim strings
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined || updates[key] === null) {
        console.log(`🗑️ Removing null/undefined field: ${key}`)
        delete updates[key]
      } else if (typeof updates[key] === 'string' && key !== 'image_data') {
        // Don't trim image_data as it's base64
        updates[key] = updates[key].trim()
      }
    })

    console.log('🔄 Update fields after processing:', {
      fields: Object.keys(updates).join(', '),
      hasImageDataInUpdates: !!updates.image_data,
      imageDataLengthInUpdates: updates.image_data?.length || 0
    })

    // Validate that user owns the song or has permission
    const { data: existingSong, error: fetchError } = await supabase
      .from('songs')
      .select('user_id, image_data')
      .eq('id', songId)
      .single()
      

    if (fetchError) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    if (existingSong.user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    console.log('🗄️ Before database update:', {
      songId,
      existingImageDataLength: existingSong.image_data?.length || 0,
      newImageDataLength: updates.image_data?.length || 0,
      willUpdateImageData: !!updates.image_data
    })

    // Update the song
    const { data: updatedSong, error } = await supabase
      .from('songs')
      .update(updates)
      .eq('id', songId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating song:', error)
      return NextResponse.json({ error: 'Failed to update song' }, { status: 500 })
    }

    console.log('✅ Song updated successfully:', {
      title: updatedSong.title,
      finalImageDataLength: updatedSong.image_data?.length || 0,
      hasImageDataInResult: !!updatedSong.image_data,
      updatedFields: Object.keys(updates)
    })

    // Clear caches
    for (const key of responseCache.keys()) {
      if (key.includes('songs-')) {
        responseCache.delete(key)
      }
    }

    const transformedSong = transformSong(updatedSong)
    
    console.log('🔄 Returning updated song:', transformedSong.title)

    return NextResponse.json({ song: transformedSong })

  } catch (error) {
    console.error('Error in PUT /api/songs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Optimized song deletion
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songId = searchParams.get('id')
    
    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 })
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership and delete in one query for efficiency
    const { error } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error('Error deleting song:', error)
      return NextResponse.json({ error: 'Failed to delete song or song not found' }, { status: 500 })
    }

    // Clear all song-related caches
    for (const key of responseCache.keys()) {
      if (key.includes('songs-') || key.includes('recently-played') || key.includes('bookmarks')) {
        responseCache.delete(key)
      }
    }

    return NextResponse.json({ message: 'Song deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/songs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}