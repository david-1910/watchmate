export const getYouTubeVideoId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

export const getEmbedUrl = (url: string, autoplay = false): string => {
  const videoId = getYouTubeVideoId(url)
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1' : ''}`
  }
  return url
}
