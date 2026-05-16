import { state } from '../state/state'
import { generateId } from '../../shared/utils/generators'
import { Suggestion, QueueItem } from '../../shared/types'

const getSuggestions = (roomId: string): Suggestion[] => state.roomSuggestions.get(roomId) ?? []

const suggest = (roomId: string, url: string, title: string, userName: string, userId: string): Suggestion[] => {
  const suggestions = [
    ...getSuggestions(roomId),
    { id: generateId(), url, title: title || url, suggestedBy: userName, suggestedById: userId },
  ]
  state.roomSuggestions.set(roomId, suggestions)
  return suggestions
}

const accept = (roomId: string, suggestionId: string): { suggestions: Suggestion[]; queue: QueueItem[] } | null => {
  const suggestions = getSuggestions(roomId)
  const suggestion = suggestions.find((s) => s.id === suggestionId)
  if (!suggestion) return null

  const queue = [...(state.roomQueues.get(roomId) ?? []), {
    id: generateId(),
    url: suggestion.url,
    title: suggestion.title,
  }]
  state.roomQueues.set(roomId, queue)

  const filtered = suggestions.filter((s) => s.id !== suggestionId)
  state.roomSuggestions.set(roomId, filtered)

  return { suggestions: filtered, queue }
}

const reject = (roomId: string, suggestionId: string): Suggestion[] => {
  const filtered = getSuggestions(roomId).filter((s) => s.id !== suggestionId)
  state.roomSuggestions.set(roomId, filtered)
  return filtered
}

export const suggestionsService = { getSuggestions, suggest, accept, reject }
