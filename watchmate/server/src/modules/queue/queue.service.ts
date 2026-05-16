import { state } from '../state/state'
import { generateId } from '../../shared/utils/generators'
import { QueueItem } from '../../shared/types'

const getQueue = (roomId: string): QueueItem[] => state.roomQueues.get(roomId) ?? []

const add = (roomId: string, url: string, title: string): QueueItem[] => {
  const queue = [...getQueue(roomId), { id: generateId(), url, title: title || url }]
  state.roomQueues.set(roomId, queue)
  return queue
}

const remove = (roomId: string, itemId: string): QueueItem[] => {
  const queue = getQueue(roomId).filter((i) => i.id !== itemId)
  state.roomQueues.set(roomId, queue)
  return queue
}

const play = (roomId: string, itemId: string): { queue: QueueItem[]; url: string } | null => {
  const queue = getQueue(roomId)
  const item = queue.find((i) => i.id === itemId)
  if (!item) return null
  const filtered = queue.filter((i) => i.id !== itemId)
  state.roomQueues.set(roomId, filtered)
  return { queue: filtered, url: item.url }
}

const next = (roomId: string): { queue: QueueItem[]; url: string } | null => {
  const queue = getQueue(roomId)
  if (!queue.length) return null
  const [first, ...rest] = queue
  state.roomQueues.set(roomId, rest)
  return { queue: rest, url: first.url }
}

const reorder = (roomId: string, fromIndex: number, toIndex: number): QueueItem[] | null => {
  const queue = [...getQueue(roomId)]
  if (
    fromIndex < 0 || fromIndex >= queue.length ||
    toIndex < 0 || toIndex >= queue.length ||
    fromIndex === toIndex
  ) return null
  const [moved] = queue.splice(fromIndex, 1)
  queue.splice(toIndex, 0, moved)
  state.roomQueues.set(roomId, queue)
  return queue
}

export const queueService = { getQueue, add, remove, play, next, reorder }
