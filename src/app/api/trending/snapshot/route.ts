import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Create a trending snapshot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { period_type, date } = body
    
    console.log(`Creating trending snapshot for ${period_type} on ${date}`)
    
    // Call the save_trending_snapshot function
    const { data: snapshotId, error } = await supabase
      .rpc('save_trending_snapshot', {
        p_period_type: period_type || 'weekly',
        p_snapshot_date: date || new Date().toISOString().split('T')[0]
      })
    
    if (error) {
      console.error('Error creating trending snapshot:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create trending snapshot' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      snapshot_id: snapshotId 
    })
  } catch (error) {
    console.error('Error in trending snapshot API:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create trending snapshot' },
      { status: 500 }
    )
  }
}

// Get trending snapshots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodType = searchParams.get('period_type')
    
    let query = supabase
      .from('trending_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
    
    if (periodType) {
      query = query.eq('period_type', periodType)
    }
    
    const { data: snapshots, error } = await query
    
    if (error) {
      console.error('Error fetching trending snapshots:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch snapshots' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      snapshots: snapshots || [] 
    })
  } catch (error) {
    console.error('Error in trending snapshots GET:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch snapshots' },
      { status: 500 }
    )
  }
}