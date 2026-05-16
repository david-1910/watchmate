export const getEmbedUrl = (url: string, autoplay = false): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (match) {
    return `https://www.youtube.com/embed/${match[1]}${autoplay ? '?autoplay=1' : ''}`
  }
  return url
}
