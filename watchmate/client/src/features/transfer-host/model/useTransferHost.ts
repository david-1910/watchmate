import { useCallback } from 'react'
import { transferHost } from '@/entities/room'

// POST /rooms/:roomId/host — только онлайн-участнику (CONTRACT.md, раздел 5)
export const useTransferHost = (roomId: string) =>
  useCallback(
    (userId: string) => {
      transferHost(roomId, userId).catch(() => {})
    },
    [roomId]
  )
