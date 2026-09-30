import { useState } from 'react'
import { session, type SessionEndReason } from '@/entities/room'
import { useRoomConnection, ReconnectBanner } from '@/features/room-connection'
import { useChat, useChatUnread, ChatPanel } from '@/features/chat'
import { useReactions } from '@/features/reactions'
import { useVideoPlayer } from '@/features/video-player'
import { useQueue } from '@/features/queue'
import { useSuggestions } from '@/features/suggestions'
import { useReadySystem } from '@/features/ready-system'
import {
  usePlaybackRequests,
  PlaybackRequestToasts,
  RequestAnswerToast,
  type PlaybackRequest,
} from '@/features/playback-requests'
import { useRoomCode } from '@/features/room-code'
import { useTransferHost } from '@/features/transfer-host'
import { useLeaveRoom, LeaveRoomModal } from '@/features/leave-room'
import { RoomHeader } from '@/widgets/room-header'
import { RoomSidebar, SidebarToggle, type SidebarTab } from '@/widgets/room-sidebar'
import { VideoArea } from '@/widgets/video-area'
import { QueuePanel } from '@/widgets/queue-panel'
import { SuggestPanel } from '@/widgets/suggest-panel'
import { UsersPanel } from '@/widgets/users-panel'
import { useHostAlerts } from '../model/useHostAlerts'

type Props = {
  roomId: string
  onSessionEnded: (reason: SessionEndReason) => void
}

const isDesktop = () => typeof window !== 'undefined' && window.innerWidth >= 768

// Комната участника: монтируется только при наличии memberToken
export const RoomSession = ({ roomId, onSessionEnded }: Props) => {
  // На телефоне сайдбар закрыт по умолчанию (чтобы сразу видеть видео), на десктопе — открыт
  const [sidebarVisible, setSidebarVisible] = useState(isDesktop)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chat')
  const [showExitModal, setShowExitModal] = useState(false)
  // Один черновик ссылки: пустой экран хоста и вкладка «Очередь» — одно и то же поле
  const [videoDraft, setVideoDraft] = useState('')

  const { snapshot, connected, users, hostId, myUserId } = useRoomConnection(roomId, { onSessionEnded })
  const isHost = !!myUserId && myUserId === hostId
  const myUserName = users.find((u) => u.userId === myUserId)?.userName ?? session.getUserName() ?? ''

  const chat = useChat(roomId, snapshot, myUserId ? { userId: myUserId, userName: myUserName } : null)
  const { reactions, sendReaction } = useReactions()
  const queue = useQueue(roomId, snapshot)
  const player = useVideoPlayer(roomId, isHost, snapshot, { onEnded: queue.handleVideoEnded })
  const { requests, answerRequest, myRequest, sendRequest } = usePlaybackRequests(isHost)
  const { suggestions, suggestVideo, acceptSuggestion, rejectSuggestion } = useSuggestions(roomId, snapshot)
  const { readyUsers, allReady, toggleReady, startWatching } = useReadySystem(roomId, snapshot)
  const viewersCount = users.filter((u) => u.online && u.userId !== hostId).length
  const { joinCode, regenerate, regenerating } = useRoomCode(roomId, snapshot)
  const transferHost = useTransferHost(roomId)
  const leaveRoom = useLeaveRoom(roomId)

  useHostAlerts(isHost, suggestions.length, requests.length)
  const chatBadge = useChatUnread(chat.messages, myUserId, sidebarVisible && sidebarTab === 'chat')

  const openTab = (tab: SidebarTab) => {
    setSidebarTab(tab)
    setSidebarVisible(true)
  }

  // Действие выполнено — черновик больше не нужен
  const withClearedDraft = (action: (url: string) => void) => (url: string) => {
    action(url)
    setVideoDraft('')
  }
  const playNow = withClearedDraft(player.shareVideo)
  const addToQueue = withClearedDraft(queue.addToQueue)
  const suggest = withClearedDraft(suggestVideo)

  const approveRequest = (req: PlaybackRequest) => {
    if (req.type === 'pause') player.syncPlayback(false)
    else if (req.type === 'play') player.syncPlayback(true)
    else if (req.type === 'change-video' && req.videoUrl) player.shareVideo(req.videoUrl)
    answerRequest(req.id, true)
  }

  const panelContent = isHost ? (
    <QueuePanel
      draft={videoDraft} onDraftChange={setVideoDraft} onAdd={addToQueue} onPlayNow={playNow}
      queue={queue.queue} onRemove={queue.removeFromQueue} onPlay={queue.playFromQueue}
      dragOverIndex={queue.dragOverIndex} onDragStart={queue.setDraggedIndex} onDragOver={queue.setDragOverIndex} onDragEnd={queue.handleDragEnd}
      suggestions={suggestions} onAcceptSuggestion={acceptSuggestion} onRejectSuggestion={rejectSuggestion}
    />
  ) : (
    <SuggestPanel
      draft={videoDraft} onDraftChange={setVideoDraft} onSuggest={suggest}
      queue={queue.queue} mySuggestions={suggestions.filter((s) => s.suggestedById === myUserId)}
    />
  )

  return (
    <div className="h-[100dvh] bg-app text-white flex flex-col overflow-hidden p-3 md:p-5 gap-3">
      {!connected && <ReconnectBanner />}
      {isHost && <PlaybackRequestToasts requests={requests} onApprove={approveRequest} onDismiss={(id) => answerRequest(id, false)} />}
      {!isHost && <RequestAnswerToast request={myRequest} />}

      <RoomHeader
        roomId={roomId} joinCode={joinCode} users={users} hostId={hostId} isHost={isHost}
        isPrivate={snapshot?.room.isPrivate ?? false}
        regeneratingCode={regenerating} onRegenerateCode={regenerate}
        onShowUsers={() => openTab('users')}
        onExit={() => setShowExitModal(true)}
      />

      <div className="relative flex-1 min-h-0 flex flex-col md:flex-row gap-3">
        <div className="flex-1 min-h-0 flex flex-col">
          <VideoArea
            videoUrl={player.videoUrl} isPlaying={player.isPlaying} videoStarted={player.videoStarted}
            countdown={player.countdown} chatMessages={chat.messages} isHost={isHost} reactions={reactions}
            readyUsers={readyUsers} viewersCount={viewersCount} allReady={allReady} myUserId={myUserId}
            onToggleReady={toggleReady} onStartWatching={startWatching}
            onRequestPlayback={sendRequest} requestPending={myRequest?.status === 'pending'}
            nextTitle={queue.queue[0]?.title ?? null} autoplay={queue.autoplay}
            onToggleAutoplay={queue.toggleAutoplay} onNext={queue.playNext} onCloseVideo={player.clearVideo}
            onSendReaction={sendReaction}
            draft={videoDraft} onDraftChange={setVideoDraft} onPlayNow={playNow} onAddToQueue={addToQueue}
            onOpenQueue={() => openTab('panel')}
            onYTReady={player.onYTReady} onYTDestroy={player.onYTDestroy} onYTStateChange={player.onYTStateChange}
          />
        </div>

        {!sidebarVisible && (
          <SidebarToggle
            badge={chatBadge + (isHost ? suggestions.length : 0)}
            onShow={() => setSidebarVisible(true)}
          />
        )}

        {/* Сайдбар — desktop: inline, mobile: fixed overlay */}
        <RoomSidebar
          visible={sidebarVisible}
          onHide={() => setSidebarVisible(false)}
          activeTab={sidebarTab}
          onTabChange={setSidebarTab}
          chatContent={
            <ChatPanel messages={chat.messages} draft={chat.draft} onDraftChange={chat.setDraft}
              onSend={chat.sendMessage} onRetry={chat.retryMessage}
              myUserId={myUserId} hostId={hostId} />
          }
          panelContent={panelContent}
          usersContent={
            <UsersPanel users={users} hostId={hostId} myUserId={myUserId} readyUsers={readyUsers} onTransferHost={transferHost} />
          }
          panelLabel="Очередь"
          usersCount={users.length}
          panelBadge={isHost ? suggestions.length : 0}
          chatBadge={chatBadge}
        />
      </div>

      {showExitModal && <LeaveRoomModal onClose={() => setShowExitModal(false)} onConfirm={leaveRoom} />}
    </div>
  )
}
