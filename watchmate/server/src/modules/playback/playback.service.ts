import { state } from '../state/state'
import { PlaybackState } from '../../shared/types'
import { readyService } from '../ready/ready.service'

// '' — видео нет
const getVideo = (roomId: string): string => state.roomCurrentVideo.get(roomId) ?? ''

// Новое видео — сохранённая позиция предыдущего больше не актуальна
const setVideo = (roomId: string, url: string): string => {
  state.roomCurrentVideo.set(roomId, url)
  state.roomPlayback.delete(roomId)
  readyService.cancelCountdown(roomId)
  return url
}

const clearVideo = (roomId: string): string => {
  state.roomCurrentVideo.delete(roomId)
  state.roomPlayback.delete(roomId)
  readyService.cancelCountdown(roomId)
  return ''
}

const savePosition = (roomId: string, { isPlaying, currentTime }: PlaybackState): void => {
  state.roomPlayback.set(roomId, { isPlaying, currentTime, updatedAt: Date.now() })
}

// Текущая позиция с учётом времени, прошедшего с последней синхронизации
const getPosition = (roomId: string): PlaybackState | null => {
  const playback = state.roomPlayback.get(roomId)
  if (!playback) return null
  const elapsed = playback.isPlaying ? (Date.now() - playback.updatedAt) / 1000 : 0
  return { isPlaying: playback.isPlaying, currentTime: playback.currentTime + elapsed }
}

export const playbackService = { getVideo, setVideo, clearVideo, savePosition, getPosition }
