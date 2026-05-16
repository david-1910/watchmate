import { useState, useCallback } from 'react'
import { connectSocket } from '../../../shared/api'
import { useSocketEvent } from '../../../shared/lib'
import { SOCKET_EVENTS } from '../../../shared/config'
import type { Suggestion } from '../../../shared/types'

export const useSuggestions = (roomId: string | undefined) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestInput, setSuggestInput] = useState('')

  const onSuggestions = useCallback((s: Suggestion[]) => setSuggestions(s), [])
  useSocketEvent<Suggestion[]>(SOCKET_EVENTS.SUGGESTIONS_UPDATE, onSuggestions, !!roomId)

  const suggestVideo = () => {
    if (!suggestInput.trim() || !roomId) return
    connectSocket().emit(SOCKET_EVENTS.SUGGEST_VIDEO, {
      roomId,
      url: suggestInput.trim(),
      title: suggestInput.trim(),
    })
    setSuggestInput('')
  }

  const acceptSuggestion = (suggestionId: string) => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.ACCEPT_SUGGESTION, { roomId, suggestionId })
  }

  const rejectSuggestion = (suggestionId: string) => {
    if (!roomId) return
    connectSocket().emit(SOCKET_EVENTS.REJECT_SUGGESTION, { roomId, suggestionId })
  }

  return { suggestions, suggestInput, setSuggestInput, suggestVideo, acceptSuggestion, rejectSuggestion }
}
