# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Watchmate** is a real-time watch-party web app. Users create or join rooms (optionally password-protected), share YouTube links, and watch together with synced playback, chat, emoji reactions, a ready-check countdown, and a host-controlled queue with viewer suggestions.

The git root is one level up (`../`); the app lives in this `watchmate/` directory with separate `client/` and `server/` npm projects (no workspace tooling — install/run each separately).

## Commands

### Client (run from `client/`)
```bash
npm run dev        # Vite dev server on :5173 (with --host)
npm run build      # tsc -b && vite build  — this is also the type-check
npm run lint       # ESLint
npm run format     # Prettier (src/**/*.{ts,tsx})
```

### Server (run from `server/`)
```bash
npm run dev        # tsx watch src/index.ts (port 3001, restarts on every file change)
npm run build      # tsc → dist/
npm start          # node dist/index.js
```

Swagger UI is served at `http://localhost:3001/api/docs`. Paths come from the `@swagger` JSDoc blocks in `modules/**/*.router.{ts,js}` (scanned relative to `__dirname`, so it works under both ts-node and `dist/`). Component schemas and tags are defined in `shared/config/swagger.ts`. Update the JSDoc when you change a route.

No test suite exists. Verify changes with `npm run build` in the affected project(s).

Env: copy `.env.example` in each project. Client: `VITE_API_URL`, `VITE_SOCKET_URL`. Server: `PORT`, `TRUST_PROXY` (and test-only timer overrides). CORS is handled by a manual middleware (`shared/middleware/cors.ts`) that reflects the request Origin, so there is no client URL setting.

Note: both `client/dist/` and `server/dist/` are committed to git. Vercel builds and serves only the client as an SPA, configured by `vercel.json` at the **repo root** (`cd watchmate/client`, output `watchmate/client/dist`), so it works regardless of the Vercel Root Directory setting. The server is deployed separately (Render). Work only on `main`.

## Mandatory rules for AI agents
- **Stay within the architecture.** The frontend follows Feature-Sliced Design. The backend follows transport → services → state. The detailed, binding rules are in `client/CLAUDE.md` and `server/CLAUDE.md`. Read the one for the side you work on before you change code.
- **Stay within your side.** An agent working on the client doesn't edit `server/`, and the reverse.
- **`CONTRACT.md` is the single source of truth** for the client↔server API: REST, socket events, payloads, timings, and client flows. Implement it exactly. Never change it on your own. If it's missing something, stop and ask the user.
- **SOLID, DRY, KISS** in all code: single responsibility, extend without modifying, depend on abstractions; reuse before you write; choose the simplest solution and add nothing speculative.
- If a task can't be done within these rules, stop and ask. Don't bend the architecture.

## Architecture

The client↔server API (REST, socket events, payloads, timings, client flows) is specified in **`CONTRACT.md`**. This section covers only the code layout.

### Stack
- **Client:** React 19, TypeScript, Vite, Tailwind CSS 3, React Router 7, Socket.IO client. Playback supports **YouTube** (IFrame API: loader `shared/lib/youtube/ytApi.ts`, component `shared/ui/YouTubePlayer`) and **Rutube** (postMessage embed API: `shared/ui/RutubePlayer`). Both expose the same `YTPlayer` interface, so `useVideoPlayer` is source-agnostic. Links are parsed in one place, `shared/lib/video` (`parseVideoLink` / `validateVideoLink`); a regular Rutube link is converted to its embed URL. Icons come from `lucide-react`, the icon set shadcn/ui uses.
- **Server:** Express 5, Socket.IO 4, TypeScript (CommonJS).
- **No database.** All state lives in in-memory Maps in `server/src/modules/state/state.ts` and is lost on restart.
- Rooms are deleted `ROOM_EMPTY_TTL_MS` (3 min) after the last member goes offline.
- Offline members are removed after `MEMBER_GRACE_MS` (3 min).
- The host role moves to someone else after `HOST_GRACE_MS` (30 s) of the host being offline.

### Protocol in one paragraph
- A user is a **member** with a stable `userId` and a secret `memberToken`, issued by `POST /rooms/:roomId/members`. The socket is only a delivery channel and never an identity.
- **REST** carries every command and the history. That covers chat, video, queue, suggestions, ready, host transfer, and the `/state` snapshot.
- **Socket** carries server push, plus three disposable client events: `playback-sync`, `reaction`, `playback-request`. It authenticates in the handshake with `auth: { roomId, memberToken }`. There's no `join-room`, and payloads never carry `roomId`.
- On every connect, the client re-fetches `/state` and `/messages?afterSeq=<lastSeq>`.
- The room URL uses `roomId` (a lowercase UUID). Joining by hand uses a separate 6-character `joinCode`, which the host can regenerate.

### Frontend — Feature-Sliced Design
`client/src/` is organized as `app → pages → widgets → features → entities → shared`. The binding rules are in `client/CLAUDE.md`.

- `app/`:
  - `App.tsx`: StrictMode and the router.
  - `router.tsx`: `/` and `/:roomSlug` (room URLs are `/room-<roomId>`, parsed by `parseRoomSlug`).
  - `styles/index.css`.
- `pages/room/ui/RoomPage.tsx` is the gate: loading → not found → join form → room. `RoomSession.tsx` is the composition root and mounts only while a `memberToken` exists. It wires these feature hooks and passes their results into widgets:
  - `useRoomConnection`, `useChat`, `useVideoPlayer`, `useQueue`, `useSuggestions`
  - `useReadySystem`, `useReactions`, `usePlaybackRequests`
  - `useRoomCode`, `useTransferHost`, `useLeaveRoom`
- `entities/room`:
  - Every room-state type from `CONTRACT.md` §4. They live together so that `RoomSnapshot` doesn't import sibling entities.
  - `api/`: `roomApi` (public), `memberClient` (Bearer `memberToken`, clears it on `UNAUTHORIZED`), `mediaApi`.
  - `session.ts`: the only access point to sessionStorage (`userName`, `hostToken_{roomId}`, `memberToken_{roomId}`).
  - `lib/joinCode.ts`: code normalization and formatting.
- `entities/message`: `ChatMessage`, `messageApi`, and `MessageBubble` with the pending/sent/failed states.
- `features/room-connection`: the socket lifecycle. It connects with an auth callback, fetches `/state` on every connect, reconnects after a server disconnect or a middleware rejection, and shows `ReconnectBanner`.
- `features/chat`: optimistic send with `clientId` and retries. `lastSeq` is a **contiguous** cursor (see `CONTRACT.md` §7).
- `shared/api`:
  - `http.ts`: `createApiClient` with the `{ success, data }` envelope.
  - `errors.ts`: `API_ERROR_CODE`, `ApiError`.
  - `socket.ts`: the singleton socket, `autoConnect: false`, and `setSocketAuth`.
- `shared/lib/useSocketEvent` is the only way to subscribe to socket events.
- Beware: Tailwind scans all of `src/` as plain text, so identifiers that match utility names (e.g. a variable named `container`) generate unused CSS.

### Backend — transport → services → state
The binding rules are in `server/CLAUDE.md`.

- `app.ts`: CORS (`shared/middleware/cors.ts`), JSON body limit (10kb), the global `/api/` rate limit, and routers under **`/api/v1`**. Read `:roomId` with `getRoomIdParam(req)`, which validates the UUID format. Rate limiters live in `shared/middleware/rateLimit.ts`.
- Modules:
  - `rooms`: creation, `joinCode`, lookup by code, code regeneration.
  - `members`: members, the online/offline state, grace timers, and `host.service` for the host role.
  - `chat`: `seq` numbering and idempotent POST.
  - `snapshot`: `/state`.
  - `playback`: current video and position.
  - `queue`, `suggestions`.
  - `ready`: ready state and the countdown (only one runs at a time).
  - `auth`: `requireRoom`, `requireMember`, `requireHost`.
- Services never touch Socket.IO. They publish domain events on `shared/utils/roomEvents.ts` (an EventEmitter), and `modules/socket/socket.broadcaster.ts` turns those into socket broadcasts. Timers go through `shared/utils/timers.ts`, keyed by room.
- `modules/socket/socket.gateway.ts`:
  - Handshake auth in `io.use`, which sets `socket.data = { roomId, userId }`.
  - A per-IP connection cap (uses `X-Forwarded-For` when `TRUST_PROXY=1`), rejected with `RATE_LIMIT`.
  - A per-socket flood limit that **drops** extra events.
  - Handlers in `handlers/`: `presence`, `playback`, `reactions`, `request`. Each subscribes via `onEvent` from `socket.guards.ts`, which catches exceptions from malformed payloads.
- REST responses always go through `shared/utils/response.ts` (`sendSuccess`/`sendError`). Validate request bodies with `validate([...rules])`.
- Timing and limit constants are in `shared/constants/timings.ts` and `limits.ts`. The three timers can be overridden through env for tests only (see `.env.example`).

### Shared constants (keep in sync)
`SOCKET_EVENTS` is defined twice:
- `server/src/shared/constants/socketEvents.ts`
- `client/src/shared/config/socketEvents.ts`

Both must contain exactly the events in `CONTRACT.md` §6. The same goes for `COUNTDOWN_START`/`COUNTDOWN_INTERVAL_MS`, `MESSAGE_MAX_LENGTH`, and `USERNAME_MAX_LENGTH`. Always use the constants, never string literals.

### Conventions
- User-facing strings, server log messages, and code comments are in **Russian**. Match this when adding messages.
- Prettier config is in `client/.prettierrc`.
