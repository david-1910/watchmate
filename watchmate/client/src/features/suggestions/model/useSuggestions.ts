import { useState, useCallback, useEffect } from 'react'
import { useSocketEvent } from '@/shared/lib'
import { SOCKET_EVENTS } from '@/shared/config'
import {
  suggestVideo as suggestVideoRequest,
  acceptSuggestion as acceptSuggestionRequest,
  rejectSuggestion as rejectSuggestionRequest,
  type Suggestion,
  type RoomSnapshot,
} from '@/entities/room'

// Ошибки команд игнорируем: актуальный список приходит через suggestions-update
const ignore = () => {}

export const useSuggestions = (roomId: string, snapshot: RoomSnapshot | null) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    if (snapshot) setSuggestions(snapshot.suggestions)
  }, [snapshot])

  const onSuggestions = useCallback((s: Suggestion[]) => setSuggestions(s), [])
  useSocketEvent(SOCKET_EVENTS.SUGGESTIONS_UPDATE, onSuggestions)

  const suggestVideo = (url: string) => {
    suggestVideoRequest(roomId, url, url).catch(ignore)
  }

  const acceptSuggestion = (suggestionId: string) => {
    acceptSuggestionRequest(roomId, suggestionId).catch(ignore)
  }

  const rejectSuggestion = (suggestionId: string) => {
    rejectSuggestionRequest(roomId, suggestionId).catch(ignore)
  }

  return { suggestions, suggestVideo, acceptSuggestion, rejectSuggestion }
}
