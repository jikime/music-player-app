import { NextRequest, NextResponse } from 'next/server'

// Admin endpoint to trigger trending updates
export async function POST(_request: NextRequest) {
  try {
    // Optional: Add admin authentication here
    // const currentUser = await getCurrentUser()
    // if (!currentUser || !currentUser.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    
    // Call the trending update endpoint
    const updateResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/trending/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const result = await updateResponse.json()
    
    return NextResponse.json({
      success: result.success,
      message: 'Trending data update triggered',
      details: result
    })
  } catch (error) {
    console.error('Error triggering trending update:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger trending update' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST(new NextRequest('http://localhost:3000/api/admin/trending-update', { method: 'POST' }))
}