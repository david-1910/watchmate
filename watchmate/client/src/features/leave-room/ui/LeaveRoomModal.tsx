import { Button, Modal } from '@/shared/ui'

type Props = {
  onClose: () => void
  onConfirm: () => void
}

export const LeaveRoomModal = ({ onClose, onConfirm }: Props) => (
  <Modal onClose={onClose}>
    <div className="glass-card rounded-2xl p-6 md:p-8 z-10 flex flex-col items-center gap-6 w-full max-w-sm">
      <h2 className="text-xl font-bold text-glow">Выйти из комнаты?</h2>
      <p className="text-gray-300 text-center">
        Вы уверены, что хотите покинуть комнату?
      </p>
      <div className="flex gap-4">
        <Button variant="secondary" onClick={onClose}>
          Отмена
        </Button>
        <button
          onClick={onConfirm}
          className="px-6 py-3 rounded-xl font-semibold bg-red-500/80 hover:bg-red-500 border border-red-400/50 transition-all"
        >
          Выйти
        </button>
      </div>
    </div>
  </Modal>
)
