import { useState, useCallback, useEffect } from 'react'
import { useSocketEvent } from '@/shared/lib'
import { SOCKET_EVENTS } from '@/shared/config'
import {
  addToQueue as addToQueueRequest,
  removeFromQueue as removeFromQueueRequest,
  playQueueItem,
  playNextInQueue,
  reorderQueue,
  type QueueItem,
  type RoomSnapshot,
} from '@/entities/room'

// Ошибки команд игнорируем: актуальная очередь приходит через queue-update
const ignore = () => {}

export const useQueue = (roomId: string, snapshot: RoomSnapshot | null) => {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [autoplay, setAutoplay] = useState(false)

  useEffect(() => {
    if (snapshot) setQueue(snapshot.queue)
  }, [snapshot])

  const onQueueUpdate = useCallback((q: QueueItem[]) => setQueue(q), [])
  useSocketEvent(SOCKET_EVENTS.QUEUE_UPDATE, onQueueUpdate)

  const addToQueue = (url: string) => {
    addToQueueRequest(roomId, url, url).catch(ignore)
  }

  const removeFromQueue = (itemId: string) => {
    removeFromQueueRequest(roomId, itemId).catch(ignore)
  }

  const playFromQueue = (itemId: string) => {
    playQueueItem(roomId, itemId).catch(ignore)
  }

  const playNext = useCallback(() => {
    playNextInQueue(roomId).catch(ignore)
  }, [roomId])

  // Автопереход к следующему видео по окончании текущего
  const handleVideoEnded = useCallback(() => {
    if (autoplay && queue.length > 0) playNext()
  }, [autoplay, queue.length, playNext])

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderQueue(roomId, draggedIndex, dragOverIndex).catch(ignore)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return {
    queue,
    dragOverIndex, setDraggedIndex, setDragOverIndex,
    addToQueue, removeFromQueue, playFromQueue, playNext, handleDragEnd,
    autoplay, toggleAutoplay: () => setAutoplay((p) => !p), handleVideoEnded,
  }
}
