import { Clapperboard } from 'lucide-react'
import { Input } from '@/shared/ui'
import { USERNAME_MAX_LENGTH } from '@/entities/user'
import { useCreateRoom } from '../model/useCreateRoom'

const Spinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

export const CreateRoomForm = () => {
  const {
    userName, setUserName, isPrivate, setIsPrivate,
    password, setPassword, error, loading, submit,
  } = useCreateRoom()
  const onEnter = (e: React.KeyboardEvent) => e.key === 'Enter' && submit()

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Ваше имя</label>
        <Input placeholder="Как вас зовут?" value={userName} onChange={setUserName}
          maxLength={USERNAME_MAX_LENGTH} onKeyDown={onEnter} />
      </div>

      {isPrivate && (
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Пароль комнаты</label>
          <Input placeholder="Придумайте пароль" value={password} onChange={setPassword} onKeyDown={onEnter} />
        </div>
      )}
      <div className="flex items-center justify-between p-3 glass rounded-xl">
        <div>
          <p className="font-medium">Приватная комната</p>
          <p className="text-xs text-gray-400">Потребуется пароль для входа</p>
        </div>
        <button onClick={() => setIsPrivate(!isPrivate)} className={`w-12 h-6 rounded-full transition-colors ${isPrivate ? 'bg-purple-500' : 'bg-gray-600'}`}>
          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {error && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">{error}</div>}

      <button onClick={submit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Загрузка...
          </span>
        ) : (
          <span className="inline-flex items-center justify-center gap-2"><Clapperboard className="w-5 h-5" />Создать комнату</span>
        )}
      </button>
    </div>
  )
}
