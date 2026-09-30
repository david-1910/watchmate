import type { ReactNode } from 'react'
import { Badge } from '@/shared/ui'
import type { SidebarTab } from '../model/types'

type Props = {
  visible: boolean
  onHide: () => void
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  // Содержимое вкладок собирается на уровне страницы
  chatContent: ReactNode
  panelContent: ReactNode
  usersContent: ReactNode
  panelLabel: string
  usersCount: number
  panelBadge?: number
  chatBadge?: number
}

const TAB_BADGE_CLASS = 'absolute top-1 right-1 min-w-[18px] h-[18px] text-[10px]'

const ICON_CHAT = 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
const ICON_PANEL = 'M4 6h16M4 10h16M4 14h10'
const ICON_USERS = 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'

type TabButtonProps = {
  label: string
  icon: string
  active: boolean
  badge?: number
  count?: number
  onClick: () => void
}

// Вкладки одинаковой ширины (basis-0), подпись всегда под иконкой — размеры не прыгают
const SidebarTabButton = ({ label, icon, active, badge = 0, count, onClick }: TabButtonProps) => (
  <button onClick={onClick} title={label}
    className={`relative flex-1 basis-0 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 rounded-xl transition-all ${active ? 'bg-purple-500/30 border border-purple-400/30 text-white' : 'glass text-gray-400 hover:text-white hover:bg-white/5'}`}>
    {badge > 0 && <Badge count={badge} className={TAB_BADGE_CLASS} />}
    <span className="flex items-center gap-1">
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      {count !== undefined && <span className="text-xs font-semibold">{count}</span>}
    </span>
    <span className="text-[11px] leading-tight font-medium truncate max-w-full">{label}</span>
  </button>
)

export const RoomSidebar = ({
  visible, onHide, activeTab: tab, onTabChange,
  chatContent, panelContent, usersContent,
  panelLabel, usersCount, panelBadge = 0, chatBadge = 0,
}: Props) => {
  const showPanelBadge = panelBadge > 0 && tab !== 'panel'
  const showChatBadge = chatBadge > 0 && tab !== 'chat'

  return (
    <aside className={[
      // mobile: fixed overlay справа
      'fixed top-0 right-0 h-[var(--app-height,100dvh)] z-drawer w-[85vw] max-w-sm rounded-l-2xl',
      // desktop: сбрасываем fixed в inline
      'md:static md:z-auto md:max-w-none md:rounded-2xl',
      'glass-card flex flex-col min-h-0 transition-all duration-300 overflow-hidden',
      visible
        ? 'translate-x-0 p-4 opacity-100 md:w-80'
        // -ml-3 гасит gap-3 родителя, чтобы видео заняло всю ширину
        : 'translate-x-full md:translate-x-0 md:w-0 md:p-0 md:-ml-3 md:opacity-0',
    ].join(' ')}>
      {/* Backdrop — только mobile, внутри aside чтобы избежать React fragment ошибки */}
      {visible && (
        <div
          className="md:hidden fixed inset-0 -z-10 bg-black/50 backdrop-blur-sm"
          onClick={onHide}
        />
      )}

      <div className={`flex flex-col min-h-0 flex-1 transition-opacity duration-200 ${visible ? 'opacity-100 delay-100' : 'opacity-0'}`}>
        <div className="flex gap-1.5 mb-4 shrink-0">
          {/* Стрелка закрыть */}
          <button onClick={onHide}
            className="shrink-0 px-1.5 rounded-xl glass text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            title="Скрыть панель">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <SidebarTabButton label="Чат" active={tab === 'chat'} badge={showChatBadge ? chatBadge : 0}
            onClick={() => onTabChange('chat')} icon={ICON_CHAT} />
          <SidebarTabButton label={panelLabel} active={tab === 'panel'} badge={showPanelBadge ? panelBadge : 0}
            onClick={() => onTabChange('panel')} icon={ICON_PANEL} />
          <SidebarTabButton label="Участники" count={usersCount} active={tab === 'users'}
            onClick={() => onTabChange('users')} icon={ICON_USERS} />
        </div>

        {tab === 'panel' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {panelContent}
          </div>
        )}
        {tab === 'chat' && chatContent}
        {tab === 'users' && usersContent}
      </div>
    </aside>
  )
}

