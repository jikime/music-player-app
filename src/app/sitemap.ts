import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://vibemusic.app'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/trending`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/recently-played`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/my-songs`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
  ]

  // TODO: Add dynamic pages (playlists, songs) from database
  // const playlists = await getPublicPlaylists()
  // const dynamicPages = playlists.map((playlist) => ({
  //   url: `${baseUrl}/playlist/${playlist.id}`,
  //   lastModified: playlist.updatedAt,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.5,
  // }))

  return [...staticPages]
}