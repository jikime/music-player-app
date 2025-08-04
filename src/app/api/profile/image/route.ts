import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 }
      )
    }

    // 파일 크기 체크 (1MB로 제한)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: "이미지 크기는 1MB 이하여야 합니다." },
        { status: 400 }
      )
    }

    // 파일을 Base64로 변환
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // 사용자 프로필 업데이트
    const { error: updateError } = await supabase
      .from('users')
      .update({
        image: dataUrl,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)

    if (updateError) {
      console.error('프로필 업데이트 오류:', updateError)
      return NextResponse.json(
        { error: "프로필 업데이트에 실패했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      message: "프로필 사진이 성공적으로 업데이트되었습니다."
    })

  } catch (error) {
    console.error('이미지 업로드 오류:', error)
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}