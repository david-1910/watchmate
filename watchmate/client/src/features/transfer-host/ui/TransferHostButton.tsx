import { Crown } from 'lucide-react'

type Props = {
  onTransfer: () => void
}

export const TransferHostButton = ({ onTransfer }: Props) => (
  <button
    onClick={onTransfer}
    className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg glass hover:bg-yellow-500/20 hover:text-yellow-300 text-gray-300 transition-colors"
    title="Передать права хоста этому участнику"
  >
    <Crown className="w-3.5 h-3.5" />
    Сделать хостом
  </button>
)
