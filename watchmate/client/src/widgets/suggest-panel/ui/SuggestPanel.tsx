import { useState } from 'react'
import type { QueueItem } from '../../../shared/types'
import type { RequestType } from '../../../features/playback-requests'

type Props = {
  queue: QueueItem[]
  suggestInput: string
  onSuggestInputChange: (v: string) => void
  onSuggest: () => void
  onSendRequest: (type: RequestType, videoUrl?: string) => void
  hasVideo: boolean
}

export const SuggestPanel = ({ queue, suggestInput, onSuggestInputChange, onSuggest, onSendRequest, hasVideo }: Props) => {
  const [changeVideoUrl, setChangeVideoUrl] = useState('')
  const [showChangeInput, setShowChangeInput] = useState(false)
  const [sent, setSent] = useState<string | null>(null)

  const handleRequest = (type: RequestType, videoUrl?: string) => {
    onSendRequest(type, videoUrl)
    setSent(type)
    setTimeout(() => setSent(null), 3000)
    if (type === 'change-video') { setShowChangeInput(false); setChangeVideoUrl('') }
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-3 overflow-hidden">
      <h3 className="text-lg font-bold shrink-0">Предложить видео</h3>

      <div className="flex gap-2 shrink-0">
        <input type="text" placeholder="YouTube URL..." value={suggestInput}
          onChange={(e) => onSuggestInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSuggest()}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
        <button onClick={onSuggest} className="px-3 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-sm transition-colors">+</button>
      </div>
      <p className="text-xs text-gray-500 shrink-0">Хост увидит ваше предложение</p>

      {hasVideo && (
        <>
          <div className="border-t border-white/10 shrink-0" />
          <p className="text-sm font-semibold text-gray-300 shrink-0">Запросить у хоста</p>

          {sent ? (
            <p className="text-xs text-green-400 shrink-0">✓ Запрос отправлен</p>
          ) : (
            <div className="flex flex-col gap-2 shrink-0">
              <button onClick={() => handleRequest('pause')}
                className="w-full px-3 py-2 glass rounded-lg text-sm hover:bg-white/10 transition-colors text-left">
                ⏸ Поставить на паузу
              </button>
              <button onClick={() => handleRequest('play')}
                className="w-full px-3 py-2 glass rounded-lg text-sm hover:bg-white/10 transition-colors text-left">
                ▶ Продолжить воспроизведение
              </button>
              <button onClick={() => setShowChangeInput((p) => !p)}
                className="w-full px-3 py-2 glass rounded-lg text-sm hover:bg-white/10 transition-colors text-left">
                🔄 Сменить видео
              </button>
              {showChangeInput && (
                <div className="flex gap-2">
                  <input type="text" placeholder="YouTube URL..." value={changeVideoUrl}
                    onChange={(e) => setChangeVideoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && changeVideoUrl.trim() && handleRequest('change-video', changeVideoUrl.trim())}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50" />
                  <button
                    onClick={() => changeVideoUrl.trim() && handleRequest('change-video', changeVideoUrl.trim())}
                    className="px-3 py-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-sm transition-colors">
                    →
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {queue.length > 0 && (
        <>
          <div className="border-t border-white/10 shrink-0" />
          <h4 className="text-sm font-bold text-gray-400 shrink-0">Очередь ({queue.length})</h4>
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {queue.map((item, index) => (
              <div key={item.id} className="glass rounded-lg p-2 flex items-center gap-2">
                <span className="text-purple-400 text-sm font-bold">{index + 1}</span>
                <span className="flex-1 text-sm truncate">{item.title}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
