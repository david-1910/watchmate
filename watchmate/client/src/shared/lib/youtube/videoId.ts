// ID ролика из ссылок youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/ (включая m. и music.)
export const getYouTubeVideoId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/
  )
  return match ? match[1] : null
}

