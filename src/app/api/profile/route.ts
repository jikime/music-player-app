import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { profileSchema } from "@/lib/schemas"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    // 사용자 프로필 정보 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('프로필 조회 오류:', error)
      return NextResponse.json(
        { error: "프로필을 불러오는데 실패했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      profile: user || {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('프로필 조회 오류:', error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // 입력 데이터 유효성 검사
    const validationResult = profileSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "입력 데이터가 올바르지 않습니다.",
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { name, bio } = validationResult.data

    // 사용자 프로필 업데이트
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        name,
        bio,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select()
      .single()

    if (error) {
      console.error('프로필 업데이트 오류:', error)
      return NextResponse.json(
        { error: "프로필 업데이트에 실패했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "프로필이 성공적으로 업데이트되었습니다.",
      profile: updatedUser
    })

  } catch (error) {
    console.error('프로필 업데이트 오류:', error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}