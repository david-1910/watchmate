import { state } from '../state/state'
import { playbackService } from '../playback/playback.service'
import { generateId } from '../../shared/utils/generators'
import { QueueItem } from '../../shared/types'

type PlayResult = { video: string; queue: QueueItem[] }

const getQueue = (roomId: string): QueueItem[] => state.roomQueues.get(roomId) ?? []

const add = (roomId: string, url: string, title?: string): QueueItem[] => {
  const queue = [...getQueue(roomId), { id: generateId(), url, title: title || url }]
  state.roomQueues.set(roomId, queue)
  return queue
}

const remove = (roomId: string, itemId: string): QueueItem[] => {
  const queue = getQueue(roomId).filter((i) => i.id !== itemId)
  state.roomQueues.set(roomId, queue)
  return queue
}

// Убирает элемент из очереди и делает его текущим видео комнаты
const takeAndPlay = (roomId: string, item: QueueItem): PlayResult => {
  const queue = remove(roomId, item.id)
  return { video: playbackService.setVideo(roomId, item.url), queue }
}

const play = (roomId: string, itemId: string): PlayResult | null => {
  const item = getQueue(roomId).find((i) => i.id === itemId)
  return item ? takeAndPlay(roomId, item) : null
}

const next = (roomId: string): PlayResult | null => {
  const [first] = getQueue(roomId)
  return first ? takeAndPlay(roomId, first) : null
}

const reorder = (roomId: string, fromIndex: number, toIndex: number): QueueItem[] | null => {
  const queue = [...getQueue(roomId)]
  const isValidIndex = (i: number) => Number.isInteger(i) && i >= 0 && i < queue.length
  if (!isValidIndex(fromIndex) || !isValidIndex(toIndex) || fromIndex === toIndex) return null
  const [moved] = queue.splice(fromIndex, 1)
  queue.splice(toIndex, 0, moved)
  state.roomQueues.set(roomId, queue)
  return queue
}

export const queueService = { getQueue, add, remove, play, next, reorder }
