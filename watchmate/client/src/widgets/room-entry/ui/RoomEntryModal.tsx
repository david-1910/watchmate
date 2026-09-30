import { Modal } from '@/shared/ui'
import { CreateRoomForm } from '@/features/create-room'
import { JoinByCodeForm } from '@/features/join-by-code'
import type { RoomEntryTab } from '../model/types'

type Props = {
  tab: RoomEntryTab
  onTabChange: (tab: RoomEntryTab) => void
  onClose: () => void
}

const TAB_LABELS: Record<RoomEntryTab, string> = {
  create: 'Создать',
  join: 'Войти',
}

// Модалка главной: создание комнаты или вход по коду
export const RoomEntryModal = ({ tab, onTabChange, onClose }: Props) => (
  <Modal onClose={onClose} backdropClassName="bg-black/70 backdrop-blur-md">
    <div className="glass-card rounded-3xl p-8 w-full max-w-md z-10 relative">
      <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">×</button>

      <div className="text-center mb-6">
        <img src="/logo-watchmate.png" alt="WatchMate" className="h-16 w-16 object-contain mx-auto mb-3" />
        <h2 className="text-2xl font-bold"><span className="text-gradient">Watch</span>Mate</h2>
      </div>

      <div className="flex gap-2 mb-6">
        {(['create', 'join'] as const).map((t) => (
          <button key={t} onClick={() => onTabChange(t)} className={`flex-1 py-3 rounded-xl font-semibold transition-all ${tab === t ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'glass hover:bg-white/10'}`}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'create' ? <CreateRoomForm /> : <JoinByCodeForm />}
    </div>
  </Modal>
)
