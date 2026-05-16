import { useState, useCallback } from 'react'
import { connectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import { SOCKET_EVENTS } from '../../../shared/config'
import type { QueueItem } from '../../../shared/types'

export const useQueue = (roomId: string | undefined) => {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [queueInput, setQueueInput] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const onQueueUpdate = useCallback((q: QueueItem[]) => setQueue(q), [])
  useSocketEvent<QueueItem[]>(SOCKET_EVENTS.QUEUE_UPDATE, onQueueUpdate, !!roomId)

  const addToQueue = () => {
    if (!queueInput.trim() || !roomId) return
    connectSocket().emit(SOCKET_EVENTS.QUEUE_ADD, { roomId, url: queueInput.trim(), title: queueInput.trim() })
    setQueueInput('')
  }

  const removeFromQueue = (itemId: string) => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.QUEUE_REMOVE, { roomId, itemId })
  }

  const playFromQueue = (itemId: string) => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.QUEUE_PLAY, { roomId, itemId })
  }

  const playNext = () => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.QUEUE_NEXT, { roomId })
  }

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    if (!roomId || fromIndex === toIndex) return
    connectSocket().emit(SOCKET_EVENTS.QUEUE_REORDER, { roomId, fromIndex, toIndex })
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null) {
      reorderQueue(draggedIndex, dragOverIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return {
    queue, queueInput, setQueueInput,
    draggedIndex, setDraggedIndex,
    dragOverIndex, setDragOverIndex,
    addToQueue, removeFromQueue, playFromQueue, playNext, handleDragEnd,
  }
}
