import { Clock, Crown } from 'lucide-react'
import type { DisplayMessage } from '../model/types'

type Props = {
  message: DisplayMessage
  isMe: boolean
  isFromHost: boolean
  isLastInGroup: boolean
  animated: boolean
  onRetry?: () => void
}

const StatusMark = ({ message, onRetry }: Pick<Props, 'message' | 'onRetry'>) => {
  if (message.status === 'pending') {
    return <Clock className="w-3 h-3" aria-label="Отправляется" />
  }
  if (message.status === 'failed') {
    return (
      <button onClick={onRetry} className="text-red-300 underline hover:text-white">
        Повторить
      </button>
    )
  }
  return null
}

export const MessageBubble = ({
  message,
  isMe,
  isFromHost,
  isLastInGroup,
  animated,
  onRetry,
}: Props) => (
  <div
    className={`flex ${animated ? 'animate-message-in' : ''} ${isMe ? 'justify-end pr-2' : 'justify-start pl-2'}`}
  >
    <div className="max-w-[80%] relative">
      <div
        className={`px-3 py-1.5 pb-4 rounded-2xl relative ${isMe ? 'bg-purple-500 text-white' : 'bg-slate-700 text-gray-200'} ${message.status === 'failed' ? 'opacity-70' : ''} ${isLastInGroup ? (isMe ? 'rounded-br-none' : 'rounded-bl-none') : ''}`}
      >
        {!isMe && (
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-xs text-purple-400 font-medium">
              {message.userName}
            </span>
            {isFromHost && <Crown className="w-3 h-3 text-yellow-400" aria-label="Хост" />}
          </div>
        )}
        <p className="text-sm break-words">{message.message}</p>
        <span
          className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] ${isMe ? 'text-purple-200' : 'text-gray-500'}`}
        >
          <StatusMark message={message} onRetry={onRetry} />
          {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      {isLastInGroup && (
        <div
          className={`absolute bottom-0 w-2 h-2 ${isMe ? 'right-0 translate-x-full bg-purple-500' : 'left-0 -translate-x-full bg-slate-700'}`}
          style={{
            clipPath: isMe
              ? 'polygon(0 0, 0 100%, 100% 100%)'
              : 'polygon(100% 0, 0 100%, 100% 100%)',
          }}
        />
      )}
    </div>
  </div>
)
