import { useState, type ReactNode, type RefObject } from 'react'
import type { RoomUser, Message } from '../../../shared/types'
import { ChatPanel } from '../../chat-sidebar/ui/ChatPanel'
import { UsersPanel } from '../../users-sidebar/ui/UsersPanel'

type Tab = 'panel' | 'chat' | 'users'

type Props = {
  visible: boolean
  onHide: () => void
  users: RoomUser[]
  hostId: string | null
  mySocketId: string | null
  readyUsers: string[]
  messages: Message[]
  draft: string
  onDraftChange: (v: string) => void
  onSend: () => void
  messagesEndRef: RefObject<HTMLDivElement | null>
  currentUserName: string
  panelContent: ReactNode
  panelLabel: string
  onTransferHost: (userId: string) => void
}

export const RoomSidebar = ({
  visible, onHide, users, hostId, mySocketId, readyUsers,
  messages, draft, onDraftChange, onSend, messagesEndRef, currentUserName,
  panelContent, panelLabel, onTransferHost,
}: Props) => {
  const [tab, setTab] = useState<Tab>('chat')
  const hostUserName = users.find((u) => u.userId === hostId)?.userName


  return (
    <aside className={[
      // mobile: fixed overlay справа
      'fixed top-0 bottom-0 right-0 z-50 w-[85vw] max-w-sm rounded-l-2xl',
      // desktop: сбрасываем fixed в inline
      'md:static md:z-auto md:max-w-none md:rounded-2xl',
      'glass-card flex flex-col min-h-0 transition-all duration-300 overflow-hidden',
      visible
        ? 'translate-x-0 p-4 opacity-100 md:w-80'
        : 'translate-x-full md:translate-x-0 md:w-0 md:p-0 md:opacity-0',
    ].join(' ')}>
      {/* Backdrop — только mobile, внутри aside чтобы избежать React fragment ошибки */}
      {visible && (
        <div
          className="md:hidden fixed inset-0 -z-10 bg-black/50 backdrop-blur-sm"
          onClick={onHide}
        />
      )}

        <div className={`flex flex-col min-h-0 flex-1 transition-opacity duration-200 ${visible ? 'opacity-100 delay-100' : 'opacity-0'}`}>
          <div className="flex gap-2 mb-4 shrink-0">
            {/* Стрелка закрыть */}
            <button onClick={onHide}
              className="p-2 rounded-xl glass text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title="Скрыть панель">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Вкладка: Чат */}
            <button onClick={() => setTab('chat')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${tab === 'chat' ? 'bg-purple-500/30 text-white' : 'glass text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {tab === 'chat' && <span className="text-sm font-medium">Чат</span>}
            </button>

            {/* Вкладка: Очередь / Предложить */}
            <button onClick={() => setTab('panel')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all text-sm ${tab === 'panel' ? 'bg-purple-500/30 text-white font-medium' : 'glass text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              {tab === 'panel' && <span>{panelLabel}</span>}
            </button>

            {/* Вкладка: Участники */}
            <button onClick={() => setTab('users')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${tab === 'users' ? 'bg-purple-500/30 text-white' : 'glass text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm font-medium">{users.length}</span>
            </button>
          </div>

          {tab === 'panel' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {panelContent}
            </div>
          )}
          {tab === 'chat' && (
            <ChatPanel messages={messages} draft={draft} onDraftChange={onDraftChange}
              onSend={onSend} messagesEndRef={messagesEndRef} currentUserName={currentUserName} hostUserName={hostUserName} />
          )}
          {tab === 'users' && (
            <UsersPanel users={users} hostId={hostId} mySocketId={mySocketId} readyUsers={readyUsers} onTransferHost={onTransferHost} />
          )}
        </div>
    </aside>
  )
}
