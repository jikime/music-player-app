import { NextRequest, NextResponse } from 'next/server'
import { supabase, DatabaseSong } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/server-auth'

// GET - 최근 재생된 노래들 조회 (인증된 사용자 전용)
export async function GET() {
  try {
    // 현재 로그인된 사용자 확인
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 사용자의 재생 기록에서 최근 재생된 노래들을 가져옴
    const { data: playHistory, error } = await supabase
      .from('play_history')
      .select(`
        played_at,
        songs:song_id (
          id,
          title,
          artist,
          album,
          duration,
          url,
          thumbnail,
          lyrics,
          uploaded_at,
          plays,
          liked,
          shared
        )
      `)
      .eq('user_id', currentUser.id)
      .order('played_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching recently played songs:', error)
      return NextResponse.json({ error: 'Failed to fetch recently played songs' }, { status: 500 })
    }

    // Database 형식을 클라이언트 형식으로 변환
    const transformedSongs = playHistory
      .filter((history: { songs: DatabaseSong | null }) => history.songs) // null인 경우 필터링 (삭제된 노래)
      .map((history: { songs: DatabaseSong }) => {
        const song = history.songs
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
      })

    return NextResponse.json({ songs: transformedSongs })
  } catch (error) {
    console.error('Error in GET /api/recently-played:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - 재생 기록 업데이트 (plays 카운트 증가 + 재생 기록 저장)
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

    // 먼저 현재 노래 정보를 가져옴
    const { data: currentSong, error: fetchError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()

    if (fetchError) {
      console.error('Error fetching current song:', fetchError)
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    // 트랜잭션으로 처리: plays 카운트 증가 + 재생 기록 저장
    const [playCountResult, playHistoryResult] = await Promise.all([
      // 1. plays 카운트를 1 증가하여 업데이트
      supabase
        .from('songs')
        .update({ 
          plays: (currentSong.plays || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', songId)
        .select()
        .single(),
      
      // 2. 재생 기록을 play_history 테이블에 저장
      supabase
        .from('play_history')
        .insert({
          user_id: currentUser.id,
          song_id: songId,
          played_at: new Date().toISOString()
        })
    ])

    if (playCountResult.error) {
      console.error('Error updating play count:', playCountResult.error)
      return NextResponse.json({ error: 'Failed to update play count' }, { status: 500 })
    }

    if (playHistoryResult.error) {
      console.error('Error saving play history:', playHistoryResult.error)
      // 재생 기록 저장 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
    }

    const song = playCountResult.data

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
    console.error('Error in POST /api/recently-played:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}