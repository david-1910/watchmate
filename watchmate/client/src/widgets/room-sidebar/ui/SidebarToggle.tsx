import { Badge } from '@/shared/ui'

type Props = {
  badge: number
  onShow: () => void
}

const ChevronLeft = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

// Кнопка открытия скрытого сайдбара — вкладка у правого края по центру.
// Родитель должен быть relative; на mobile -right-3 гасит p-3 страницы — вкладка у края экрана
export const SidebarToggle = ({ badge, onShow }: Props) => (
  <button onClick={onShow}
    className="absolute -right-3 md:right-0 top-1/2 -translate-y-1/2 glass-card flex flex-col items-center justify-center gap-1 px-2 py-4 rounded-l-2xl hover:bg-white/10 transition-all"
    title="Показать панель">
    <ChevronLeft className="w-5 h-5 text-white" />
    {badge > 0 && <Badge count={badge} className="min-w-[20px] h-[20px] text-[11px]" />}
  </button>
)
