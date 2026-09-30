import { getYouTubeVideoId } from '../youtube'

// Источник видео, который умеет синхронизироваться: ID и (для приватных роликов Rutube) ключ доступа
export type VideoSource =
  | { provider: 'youtube'; id: string }
  | { provider: 'rutube'; id: string; privateKey: string | null }

// rutube.ru/video/<id>/, /video/private/<id>/?p=<key>, /play/embed/<id>, /shorts/<id>
const RUTUBE_ID = /rutube\.ru\/(?:video\/(?:private\/)?|play\/embed\/|shorts\/)([a-f0-9]{32})/i

const getRutubeSource = (url: string): VideoSource | null => {
  const match = url.match(RUTUBE_ID)
  if (!match) return null
  const privateKey = url.match(/[?&]p=([\w-]+)/)?.[1] ?? null
  return { provider: 'rutube', id: match[1].toLowerCase(), privateKey }
}

export const parseVideoLink = (url: string): VideoSource | null => {
  const youtubeId = getYouTubeVideoId(url)
  if (youtubeId) return { provider: 'youtube', id: youtubeId }
  return getRutubeSource(url)
}

// Текст ошибки для поля ссылки или null
export const validateVideoLink = (url: string): string | null =>
  parseVideoLink(url) ? null : 'Нужна ссылка на видео YouTube или Rutube'

// Обычная ссылка Rutube → адрес встраиваемого плеера
export const rutubeEmbedUrl = (id: string, privateKey: string | null): string =>
  `https://rutube.ru/play/embed/${id}/${privateKey ? `?p=${privateKey}` : ''}`
