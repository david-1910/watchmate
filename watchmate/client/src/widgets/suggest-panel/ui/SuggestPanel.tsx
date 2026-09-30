import { Clock, Send } from 'lucide-react'
import { LinkInput } from '@/shared/ui'
import { validateVideoLink } from '@/shared/lib'
import type { QueueItem, Suggestion } from '@/entities/room'

type Props = {
  draft: string
  onDraftChange: (value: string) => void
  onSuggest: (url: string) => void
  queue: QueueItem[]
  mySuggestions: Suggestion[]
}

// Очередь зрителя: предложить видео, свои предложения на рассмотрении и что будет дальше
export const SuggestPanel = ({ draft, onDraftChange, onSuggest, queue, mySuggestions }: Props) => (
  <div className="w-full h-full flex flex-col min-h-0 gap-4 overflow-y-auto">
    <section className="flex flex-col gap-2 shrink-0">
      <h3 className="text-lg font-bold">Предложить видео</h3>
      <LinkInput value={draft} onChange={onDraftChange} placeholder="Ссылка на YouTube или Rutube" validate={validateVideoLink}
        actions={[{ label: 'Предложить хосту', icon: <Send className="w-4 h-4" />, onClick: onSuggest, primary: true }]} />
      <p className="text-xs text-gray-500">Хост решит, добавить ли видео в очередь</p>
    </section>

    {mySuggestions.length > 0 && (
      <section className="flex flex-col gap-2 shrink-0">
        <h4 className="text-sm font-semibold text-gray-300">Ваши предложения</h4>
        {mySuggestions.map((s) => (
          <div key={s.id} className="glass rounded-xl p-2 flex items-center gap-2">
            <span className="flex-1 text-sm truncate">{s.title}</span>
            <span className="inline-flex items-center gap-1 text-xs text-yellow-300 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              ждёт хоста
            </span>
          </div>
        ))}
      </section>
    )}

    <section className="flex flex-col gap-2 min-h-0">
      <h4 className="text-sm font-semibold text-gray-300">Дальше в очереди{queue.length > 0 ? ` · ${queue.length}` : ''}</h4>
      {queue.length === 0 ? (
        <p className="text-gray-500 text-sm">Очередь пуста</p>
      ) : (
        queue.map((item, index) => (
          <div key={item.id} className="glass rounded-xl p-2 flex items-center gap-2">
            <span className="text-purple-400 text-sm font-bold w-4 shrink-0">{index + 1}</span>
            <span className="flex-1 text-sm truncate">{item.title}</span>
          </div>
        ))
      )}
    </section>
  </div>
)
