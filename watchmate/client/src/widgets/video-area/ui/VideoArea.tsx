import type { Reaction, RoomUser } from '../../../shared/types'
import { Button, Input } from '../../../shared/ui'
import { getEmbedUrl } from '../../../shared/lib'
import { REACTION_EMOJIS } from '../../../shared/config'

type Props = {
  videoUrl: string
  localVideo: string | null
  isPlaying: boolean
  countdown: number | null
  isHost: boolean
  autoplay: boolean
  reactions: Reaction[]
  readyUsers: string[]
  users: RoomUser[]
  currentUserName: string
  inputUrl: string
  onInputUrlChange: (v: string) => void
  onShareVideo: (url: string) => void
  onClearVideo: () => void
  onToggleReady: () => void
  onSendReaction: (emoji: string) => void
  onPlayNextFromQueue: () => void
  queueLength: number
}

const ReadyOverlay = ({ readyUsers, users, currentUserName, onToggle }: {
  readyUsers: string[]
  users: RoomUser[]
  currentUserName: string
  onToggle: () => void
}) => {
  const myUserId = users.find((u) => u.userName === currentUserName)?.userId ?? ''
  return (
    <div className="absolute inset-0 glass-dark flex flex-col items-center justify-center gap-4">
      <p className="text-2xl font-bold text-glow">Все готовы?</p>
      <p className="text-gray-300">{readyUsers.length}/{users.length} готовы</p>
      <Button onClick={onToggle}>
        {readyUsers.includes(myUserId) ? '✓ Я готов!' : 'Готов!'}
      </Button>
    </div>
  )
}

export const VideoArea = ({
  videoUrl, localVideo, isPlaying, countdown, isHost, autoplay, reactions,
  readyUsers, users, currentUserName, inputUrl, onInputUrlChange,
  onShareVideo, onClearVideo, onToggleReady, onSendReaction, onPlayNextFromQueue, queueLength,
}: Props) => (
  <div className="flex-1 flex flex-col min-h-0">
    <div className="glass-card rounded-2xl flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      {reactions.map((r) => (
        <div key={r.id} className="absolute text-3xl pointer-events-none"
          style={{ left: `${r.left}%`, bottom: '10px', zIndex: r.zIndex, willChange: 'transform, opacity',
            animation: `float-up-${r.direction} ${r.duration}s ease-out forwards` }}>
          {r.emoji}
        </div>
      ))}

      {localVideo ? (
        <>
          <video src={localVideo} width="100%" height="100%" controls className="rounded-lg"
            onEnded={() => { if (autoplay && isHost && queueLength > 0) onPlayNextFromQueue() }} />
          {isHost && (
            <button onClick={onClearVideo} className="absolute top-3 right-3 glass-button-secondary px-3 py-1 rounded-lg text-sm z-10 hover:bg-red-500/50">
              ✕ Закрыть
            </button>
          )}
          {!isPlaying && (
            <ReadyOverlay readyUsers={readyUsers} users={users} currentUserName={currentUserName} onToggle={onToggleReady} />
          )}
        </>
      ) : videoUrl ? (
        <>
          <iframe src={getEmbedUrl(videoUrl, isPlaying)} width="100%" height="100%" style={{ border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          {isHost && (
            <button onClick={onClearVideo} className="absolute top-3 right-3 glass-button-secondary px-3 py-1 rounded-lg text-sm z-10 hover:bg-red-500/50">
              ✕ Закрыть
            </button>
          )}
          {!isPlaying && (
            <ReadyOverlay readyUsers={readyUsers} users={users} currentUserName={currentUserName} onToggle={onToggleReady} />
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 p-8">
          {isHost ? (
            <>
              <p className="text-gray-300 mb-2">Вставьте ссылку на видео</p>
              <div className="flex gap-3 w-full max-w-lg">
                <div className="flex-1">
                  <Input placeholder="YouTube, Vimeo и др..." value={inputUrl} onChange={onInputUrlChange}
                    onKeyDown={(e) => e.key === 'Enter' && onShareVideo(inputUrl)} />
                </div>
                <Button onClick={() => onShareVideo(inputUrl)}>Открыть</Button>
              </div>
            </>
          ) : (
            <p className="text-gray-400">Ожидание видео от хоста...</p>
          )}
        </div>
      )}

      {countdown !== null && (
        <div className="absolute inset-0 glass-dark flex items-center justify-center">
          <span className="text-9xl font-bold text-glow">{countdown === 0 ? '▶️' : countdown}</span>
        </div>
      )}
    </div>

    <div className="glass rounded-2xl mt-4 py-3 px-6 flex justify-center gap-4 shrink-0">
      {REACTION_EMOJIS.map((emoji) => (
        <button key={emoji} onClick={() => onSendReaction(emoji)}
          className="text-3xl hover:scale-125 transition-transform hover:drop-shadow-lg">
          {emoji}
        </button>
      ))}
    </div>
  </div>
)
