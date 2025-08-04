import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'
import { validateCoverImage } from '@/lib/playlist-utils'

// GET - 현재 사용자의 플레이리스트 조회 (songs 포함)
export async function GET() {
  try {
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching playlists:', error)
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 })
    }

    // Database 형식을 클라이언트 형식으로 변환
    const transformedPlaylists = playlists.map((playlist: {
      id: string;
      name: string;
      playlist_songs: { song_id: string; position: number }[];
      created_at: string;
      updated_at: string;
      has_notification: boolean;
      description: string;
      cover_image: string;
    }) => ({
      id: playlist.id,
      name: playlist.name,
      songs: playlist.playlist_songs
        .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
        .map((ps: { song_id: string }) => ps.song_id),
      createdAt: playlist.created_at ? new Date(playlist.created_at) : new Date(),
      updatedAt: playlist.updated_at ? new Date(playlist.updated_at) : new Date(),
      hasNotification: playlist.has_notification,
      description: playlist.description,
      coverImage: playlist.cover_image
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
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, coverImage, hasNotification } = body

    // 필수 필드 검증
    if (!name) {
      return NextResponse.json(
        { error: 'Playlist name is required' },
        { status: 400 }
      )
    }

    // 이미지 데이터 검증 및 로깅
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

    const { data: playlist, error } = await supabase
      .from('playlists')
      .insert([{
        name,
        description: description || null,
        cover_image: coverImage || null,
        has_notification: hasNotification || false,
        user_id: currentUser.id
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
      hasNotification: playlist.has_notification,
      description: playlist.description,
      coverImage: playlist.cover_image
    }

    return NextResponse.json({ playlist: transformedPlaylist }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/playlists:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}