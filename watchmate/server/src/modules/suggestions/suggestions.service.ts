import { state } from '../state/state'
import { queueService } from '../queue/queue.service'
import { generateId } from '../../shared/utils/generators'
import { Suggestion, QueueItem } from '../../shared/types'

type SuggestParams = { url: string; title?: string; userName: string; userId: string }

const getSuggestions = (roomId: string): Suggestion[] => state.roomSuggestions.get(roomId) ?? []

const suggest = (roomId: string, { url, title, userName, userId }: SuggestParams): Suggestion[] => {
  const suggestions = [
    ...getSuggestions(roomId),
    { id: generateId(), url, title: title || url, suggestedBy: userName, suggestedById: userId },
  ]
  state.roomSuggestions.set(roomId, suggestions)
  return suggestions
}

const reject = (roomId: string, suggestionId: string): Suggestion[] => {
  const filtered = getSuggestions(roomId).filter((s) => s.id !== suggestionId)
  state.roomSuggestions.set(roomId, filtered)
  return filtered
}

const accept = (roomId: string, suggestionId: string): { suggestions: Suggestion[]; queue: QueueItem[] } | null => {
  const suggestion = getSuggestions(roomId).find((s) => s.id === suggestionId)
  if (!suggestion) return null

  const queue = queueService.add(roomId, suggestion.url, suggestion.title)
  const suggestions = reject(roomId, suggestionId)
  return { suggestions, queue }
}

export const suggestionsService = { getSuggestions, suggest, accept, reject }
