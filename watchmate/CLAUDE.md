# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Watchmate** is a real-time watch-party web app. Users create or join rooms, share YouTube/local video links, and watch together with synced playback, chat, emoji reactions, and a queue system.

## Commands

### Client (run from `client/`)
```bash
npm run dev        # Start Vite dev server (with --host)
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run format     # Prettier (src/**/*.{ts,tsx})
npm run preview    # Preview production build
```

### Server (run from `server/`)
```bash
npm run dev        # ts-node src/index.ts (port 3001)
npm run build      # tsc
npm start          # node dist/index.js
```

No test suite exists.

## Architecture

### Stack
- **Client:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 3, React Router DOM 7, Socket.IO Client 4.8
- **Server:** Express 5, TypeScript 5.9, Socket.IO 4.8, Node.js
- **No database** — all state is in-memory Maps on the server; data is lost on restart

### Frontend — Feature-Sliced Design (FSD)

```
client/src/
  app/                   # router.tsx — BrowserRouter with two routes: / and /room/:id
  pages/
    home/ui/HomePage     # Landing page (thin, composes modal via useRoomModal)
    room/ui/RoomPage     # Room page (thin, composes all widgets + hooks)
  widgets/               # Large self-contained UI blocks
    room-header/         # Header with room code, copy, user avatars
    room-sidebar/        # Collapsible sidebar (chat + users tabs)
    chat-sidebar/        # ChatPanel (message list + input)
    users-sidebar/       # UsersPanel (user list with ready/host status)
    video-area/          # Video player + ready overlay + reactions bar
    queue-panel/         # Host: queue management + suggestions review
    suggest-panel/       # Viewer: suggest video + view queue
  features/              # User interactions — each exports a custom hook
    room-auth/           # useRoomModal — create/join room modal logic
    room-connection/     # useRoomConnection — socket join, users/host sync
    chat/                # useChat — messages, draft, send
    video-player/        # useVideoPlayer — video URL, countdown, share/clear
    queue/               # useQueue — queue CRUD + drag-and-drop reorder
    suggestions/         # useSuggestions — suggest/accept/reject
    reactions/           # useReactions — floating emoji animations
    ready-system/        # useReadySystem — toggle ready status
  entities/
    room/                # Room types + session helper (sessionStorage wrapper)
  shared/
    api/                 # socket.ts (Socket.IO singleton), rooms.ts (REST), http.ts (fetch wrapper)
    ui/                  # Button, Input components
    types/               # Shared TypeScript types (Message, RoomUser, QueueItem, etc.)
    lib/                 # avatar.ts (color hash), video.ts (YouTube embed URL)
    config/              # API_BASE_URL, SOCKET_URL, REACTION_EMOJIS, AVATAR_COLORS
```

**Rule:** pages import widgets, widgets import features/entities/shared, features import entities/shared. No upward imports.

### Backend — Modular structure

```
server/src/
  index.ts               # Entry point — starts HTTP server on port 3001
  app.ts                 # Express setup + Socket.IO init
  shared/
    types/               # QueueItem, Suggestion, RoomUser, Room, ReadyUpdate
    utils/generators.ts  # generateRoomId, generateHostToken, generateId
  modules/
    state/state.ts       # Single in-memory state (all Maps + helper functions)
    rooms/
      rooms.service.ts   # Business logic: create, findById, verifyPassword
      rooms.router.ts    # Express routes: POST /rooms, GET /rooms/:id, POST /rooms/:id/verify
    socket/
      socket.gateway.ts  # Socket.IO setup — registers all handlers per connection
      handlers/          # One file per concern:
        room.handler     # join-room, disconnect (host assignment, cleanup)
        chat.handler     # chat-message
        video.handler    # share-video, clear-video, share-local-file
        queue.handler    # queue-add/remove/play/reorder/next (host-only guarded)
        suggestions.handler # suggest/accept/reject
        ready.handler    # toggle-ready + auto-countdown when all ready
        reactions.handler   # reaction broadcast
        countdown.handler   # start-countdown (manual trigger)
```

### Communication protocol

**REST (HTTP):**
- `POST /rooms` — create room
- `GET /rooms/:id` — check room exists + privacy
- `POST /rooms/:id/verify` — password check

**Socket.IO events (client → server):**
`join-room`, `chat-message`, `share-video`, `clear-video`, `queue-add`, `queue-remove`, `queue-play`, `queue-next`, `queue-reorder`, `suggest-video`, `accept-suggestion`, `reject-suggestion`, `toggle-ready`, `reaction`, `start-countdown`

**Socket.IO events (server → client):**
`users-update`, `host-update`, `video-update`, `local-file-update`, `ready-update`, `chat-message`, `reaction`, `queue-update`, `suggestions-update`, `countdown`, `user-joined`

### Key patterns

- **Session storage** (`entities/room/model/session.ts`): wraps all `sessionStorage` access — `userName`, `hostToken_{roomId}`, `passwordVerified_{roomId}`
- **Host guard** on server: every queue/suggestion mutation checks `state.roomHosts.get(roomId) === socket.id` before acting
- **Host fallback**: on disconnect, host role transfers to first remaining user
- **Room cleanup**: when last user leaves, all room state Maps are cleared
- **Singleton socket**: `shared/api/socket.ts` maintains one Socket.IO connection, reconnected via `connectSocket()`
