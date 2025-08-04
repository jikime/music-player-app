import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Update trending data - creates snapshots for all periods
export async function POST(_request: NextRequest) {
  try {
    const currentDate = new Date().toISOString().split('T')[0]
    const results = []
    
    console.log(`Updating trending data for ${currentDate}`)
    
    // Create snapshots for all periods
    const periods = ['daily', 'weekly', 'monthly']
    
    for (const period of periods) {
      try {
        const { data: snapshotId, error } = await supabase
          .rpc('save_trending_snapshot', {
            p_period_type: period,
            p_snapshot_date: currentDate
          })
        
        if (error) {
          console.error(`Error creating ${period} snapshot:`, error)
          results.push({
            period,
            success: false,
            error: error.message
          })
        } else {
          console.log(`Created ${period} snapshot: ${snapshotId}`)
          results.push({
            period,
            success: true,
            snapshot_id: snapshotId
          })
        }
      } catch (error) {
        console.error(`Error creating ${period} snapshot:`, error)
        results.push({
          period,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // Check if all snapshots were successful
    const allSuccessful = results.every(r => r.success)
    
    return NextResponse.json({ 
      success: allSuccessful,
      message: allSuccessful ? 'All trending snapshots updated successfully' : 'Some snapshots failed',
      results
    }, {
      status: allSuccessful ? 200 : 207 // 207 = Multi-Status
    })
  } catch (error) {
    console.error('Error updating trending data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update trending data' },
      { status: 500 }
    )
  }
}

// Manual trigger for updating trending data
export async function GET() {
  // For security, you might want to add authentication here
  return POST(new NextRequest('http://localhost:3000/api/trending/update', { method: 'POST' }))
}