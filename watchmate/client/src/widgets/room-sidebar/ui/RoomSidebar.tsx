import { useState, type RefObject } from 'react'
import type { RoomUser, Message } from '../../../shared/types'
import { ChatPanel } from '../../chat-sidebar/ui/ChatPanel'
import { UsersPanel } from '../../users-sidebar/ui/UsersPanel'

type Tab = 'chat' | 'users'

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
}

export const RoomSidebar = ({
  visible, onHide, users, hostId, mySocketId, readyUsers,
  messages, draft, onDraftChange, onSend, messagesEndRef, currentUserName,
}: Props) => {
  const [tab, setTab] = useState<Tab>('chat')

  return (
    <aside className={`glass-card rounded-2xl flex flex-col min-h-0 transition-all duration-300 ease-in-out overflow-hidden ${visible ? 'w-80 p-4 opacity-100' : 'w-0 p-0 opacity-0'}`}>
      <div className={`flex flex-col min-h-0 flex-1 w-72 transition-opacity duration-200 ${visible ? 'opacity-100 delay-100' : 'opacity-0'}`}>
        <div className="flex gap-2 mb-4 shrink-0">
          <button onClick={onHide} className="p-2 rounded-xl glass text-gray-400 hover:text-white hover:bg-white/10 transition-all" title="Скрыть панель">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button onClick={() => setTab('chat')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${tab === 'chat' ? 'bg-purple-500/30 text-white' : 'glass text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {tab === 'chat' && <span className="text-sm font-medium">Чат</span>}
          </button>

          <button onClick={() => setTab('users')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${tab === 'users' ? 'bg-purple-500/30 text-white' : 'glass text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-sm font-medium">{users.length}</span>
          </button>
        </div>

        {tab === 'chat' ? (
          <ChatPanel messages={messages} draft={draft} onDraftChange={onDraftChange} onSend={onSend} messagesEndRef={messagesEndRef} currentUserName={currentUserName} />
        ) : (
          <UsersPanel users={users} hostId={hostId} mySocketId={mySocketId} readyUsers={readyUsers} />
        )}
      </div>
    </aside>
  )
}
