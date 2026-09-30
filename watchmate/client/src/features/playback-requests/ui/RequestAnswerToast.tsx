import { Check, X } from 'lucide-react'
import { Portal } from '@/shared/ui'
import type { MyRequest, RequestType } from '../model/types'

const ACCEPTED_TEXT: Record<RequestType, string> = {
  pause: 'Хост поставил паузу',
  play: 'Хост продолжил воспроизведение',
  'change-video': 'Хост сменил видео',
}

// Ответ хоста отправителю запроса; через Portal — виден и в полноэкранном режиме
export const RequestAnswerToast = ({ request }: { request: MyRequest | null }) => {
  if (request?.status !== 'answered') return null
  const { accepted, type } = request

  return (
    <Portal>
      <div role="status"
        className="fixed z-toast top-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:top-24 sm:w-80 surface-floating rounded-2xl p-3 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${accepted ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {accepted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </div>
        <p className="text-sm">{accepted ? ACCEPTED_TEXT[type] : 'Хост отклонил запрос'}</p>
      </div>
    </Portal>
  )
}
