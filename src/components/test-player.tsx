"use client"

import { useState } from 'react'
import ReactPlayer from 'react-player'

export function TestPlayer() {
  const [playing, setPlaying] = useState(false)
  const testUrl = 'https://www.youtube.com/watch?v=jfKfPfyJRdk'

  return (
    <div style={{ padding: '20px' }}>
      <h2>ReactPlayer Test</h2>
      
      <div style={{ background: '#000', width: '640px', height: '360px' }}>
        <ReactPlayer
          url={testUrl}
          playing={playing}
          controls={true}
          width="100%"
          height="100%"
          onReady={() => console.log('✅ Test Player Ready')}
          onStart={() => console.log('🎬 Test Player Started')}
          onPlay={() => console.log('▶️ Test Player Playing')}
          onPause={() => console.log('⏸️ Test Player Paused')}
          onError={(e) => console.error('❌ Test Player Error:', e)}
        />
      </div>
      
      <button 
        onClick={() => setPlaying(!playing)}
        style={{ marginTop: '10px', padding: '10px' }}
      >
        {playing ? 'Pause' : 'Play'}
      </button>
      
      <div style={{ marginTop: '10px' }}>
        <p>URL: {testUrl}</p>
        <p>Playing: {playing ? 'Yes' : 'No'}</p>
      </div>
    </div>
  )
}