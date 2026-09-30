import { LogIn } from 'lucide-react'
import { Input } from '@/shared/ui'
import { useJoinByCode } from '../model/useJoinByCode'

// Длина поля с учётом дефиса: XXX-XXX
const CODE_INPUT_LENGTH = 7

export const JoinByCodeForm = () => {
  const { code, setCode, error, loading, submit } = useJoinByCode()

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-gray-400 mb-1 block">Войти по коду</label>
        <Input placeholder="XXX-XXX" value={code} onChange={setCode}
          maxLength={CODE_INPUT_LENGTH} autoCapitalize="characters" autoComplete="off"
          className="font-mono tracking-widest text-center text-lg"
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </div>

      {error && <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">{error}</div>}

      <button onClick={submit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl font-semibold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100">
        {loading ? 'Поиск...' : (
          <span className="inline-flex items-center justify-center gap-2"><LogIn className="w-5 h-5" />Присоединиться</span>
        )}
      </button>
    </div>
  )
}
