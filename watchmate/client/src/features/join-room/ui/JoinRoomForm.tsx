import { Lock } from 'lucide-react'
import { Button, Input } from '@/shared/ui'
import { USERNAME_MAX_LENGTH } from '@/entities/user'
import { useJoinRoom } from '../model/useJoinRoom'

type Props = {
  roomId: string
  isPrivate: boolean
  onBack: () => void
}

export const JoinRoomForm = ({ roomId, isPrivate, onBack }: Props) => {
  const {
    userName, setUserName, password, setPassword, error, loading, submit,
  } = useJoinRoom(roomId, isPrivate)
  const onEnter = (e: React.KeyboardEvent) => e.key === 'Enter' && submit()

  return (
    <div className="min-h-screen bg-app text-white flex flex-col items-center justify-center relative">
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 glass px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Назад
      </button>

      <div className="glass-card rounded-3xl p-10 flex flex-col items-center">
        <img src="/logo-watchmate.png" alt="WatchMate" className="h-16 w-16 object-contain mb-3" />
        <h1 className="text-4xl font-bold mb-2 text-glow">WatchMate</h1>
        <p className={`text-gray-300 ${isPrivate ? 'mb-2' : 'mb-8'}`}>Вход в комнату</p>
        {isPrivate && (
          <p className="text-purple-400 text-sm mb-6 inline-flex items-center gap-1.5"><Lock className="w-4 h-4" />Приватная комната</p>
        )}
        <div className="flex flex-col gap-4 w-full min-w-[280px]">
          <Input placeholder="Введи своё имя" value={userName} onChange={setUserName}
            maxLength={USERNAME_MAX_LENGTH} onKeyDown={onEnter} />
          {isPrivate && (
            <Input type="password" placeholder="Пароль комнаты" value={password} onChange={setPassword} onKeyDown={onEnter} />
          )}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Вход...' : 'Войти в комнату'}
          </Button>
        </div>
      </div>
    </div>
  )
}
