import type { RefObject } from 'react'
import type { Reaction, RoomUser } from '../../../shared/types'
import { Button, Input } from '../../../shared/ui'
import { getYouTubeVideoId } from '../../../shared/lib'
import { REACTION_EMOJIS } from '../../../shared/config'
import { YouTubePlayer } from '../../../features/video-player/ui/YouTubePlayer'
import type { YTPlayer } from '../../../features/video-player/model/ytPlayer'

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
  videoRef: RefObject<HTMLVideoElement | null>
  onInputUrlChange: (v: string) => void
  onShareVideo: (url: string) => void
  onClearVideo: () => void
  onToggleReady: () => void
  onSendReaction: (emoji: string) => void
  onPlayNextFromQueue: () => void
  onYTReady: (player: YTPlayer) => void
  onYTDestroy: () => void
  onYTStateChange: (state: number, currentTime: number) => void
  onLocalVideoPlay: () => void
  onLocalVideoPause: () => void
  onLocalVideoSeeked: () => void
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
  readyUsers, users, currentUserName, inputUrl, videoRef,
  onInputUrlChange, onShareVideo, onClearVideo, onToggleReady, onSendReaction,
  onPlayNextFromQueue, onYTReady, onYTDestroy, onYTStateChange,
  onLocalVideoPlay, onLocalVideoPause, onLocalVideoSeeked, queueLength,
}: Props) => {
  const youtubeId = videoUrl ? getYouTubeVideoId(videoUrl) : null

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="glass-card rounded-2xl flex-1 flex flex-col items-center justify-center relative overflow-hidden group">
        {reactions.map((r) => (
          <div key={r.id} className="absolute text-3xl pointer-events-none"
            style={{ left: `${r.left}%`, bottom: '10px', zIndex: r.zIndex, willChange: 'transform, opacity',
              animation: `float-up-${r.direction} ${r.duration}s ease-out forwards` }}>
            {r.emoji}
          </div>
        ))}

        {localVideo ? (
          <>
            <video
              ref={videoRef}
              src={localVideo}
              width="100%"
              height="100%"
              controls
              className="rounded-lg"
              onPlay={onLocalVideoPlay}
              onPause={onLocalVideoPause}
              onSeeked={onLocalVideoSeeked}
              onEnded={() => { if (autoplay && isHost && queueLength > 0) onPlayNextFromQueue() }}
            />
            {isHost && (
              <button onClick={onClearVideo} className="absolute top-3 right-3 glass-button-secondary px-3 py-1 rounded-lg text-sm z-10 hover:bg-red-500/50">
                ✕ Закрыть
              </button>
            )}
            {!isPlaying && (
              <ReadyOverlay readyUsers={readyUsers} users={users} currentUserName={currentUserName} onToggle={onToggleReady} />
            )}
          </>
        ) : youtubeId ? (
          <>
            <YouTubePlayer
              key={youtubeId}
              videoId={youtubeId}
              onReady={onYTReady}
              onDestroy={onYTDestroy}
              onStateChange={onYTStateChange}
            />
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
            <iframe src={videoUrl} width="100%" height="100%" style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            {isHost && (
              <button onClick={onClearVideo} className="absolute top-3 right-3 glass-button-secondary px-3 py-1 rounded-lg text-sm z-10 hover:bg-red-500/50">
                ✕ Закрыть
              </button>
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

        {/* Панель реакций — появляется при наведении снизу */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex justify-center gap-2 md:gap-4 py-3 px-4
          bg-gradient-to-t from-black/60 to-transparent
          opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
          transition-all duration-200">
          {REACTION_EMOJIS.map((emoji) => (
            <button key={emoji} onClick={() => onSendReaction(emoji)}
              className="text-2xl md:text-3xl hover:scale-125 transition-transform hover:drop-shadow-lg">
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
