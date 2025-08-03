export const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const formatPlays = (plays: number) => {
  return plays.toLocaleString()
}

export const getTotalDuration = (songs: Array<{ duration: number }>) => {
  const totalSeconds = songs.reduce((total, song) => total + song.duration, 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}