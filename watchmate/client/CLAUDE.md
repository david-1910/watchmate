# client/CLAUDE.md — strict rules for the frontend

These rules are **mandatory**. They add to `../CLAUDE.md`. If a task can't be done without breaking a rule, stop and ask the user. Don't work around the rule.

## Scope boundary
- Work **only** inside `client/`. Never edit `server/`. If a change needs a server change (new event, new field, new endpoint), stop and describe exactly what the server must provide.
- Never invent a socket event, payload field, or REST field. The contract is `../CONTRACT.md`. Implement it exactly, and don't edit it.
- `shared/config/socketEvents.ts` and `shared/config/countdown.ts` mirror the server. Change them only in sync with the server constants, and only when the user asked for it.

## Feature-Sliced Design — hard rules
Layers, top to bottom: `app → pages → widgets → features → entities → shared`.

1. **Imports go down only.** A layer may import only from layers below it. Never import upward, and never import sideways between slices of the same layer (for example, feature → feature or widget → widget). If two slices need the same thing, move it down a layer.
2. **Public API only.** Import a slice through its root `index.ts` (`@/features/chat`), never through its internal files (`@/features/chat/model/useChat`). `shared` is imported by segment (`@/shared/ui`, `@/shared/lib`, `@/shared/api`, `@/shared/config`). Use the `@/` alias for anything outside the current slice. Use relative imports only inside a slice.
3. **Segments:** `ui/` (components), `model/` (hooks, state, types), `api/` (requests), `lib/` (pure helpers), `config/` (constants). Put code in the segment that matches its role.
4. **Layer responsibilities:**
   - `shared`: reusable, business-agnostic code (UI kit, http/socket clients, `useSocketEvent`, YouTube helpers, env). It must not know about rooms, users, or chat.
   - `entities`: business nouns (room, user, message, reaction, video): types, display components, entity API. No user actions.
   - `features`: a single user action or scenario (send a message, toggle ready, transfer the host role). Each one has a `use*` hook in `model/` and, if needed, UI in `ui/`.
   - `widgets`: compose features and entities into page blocks. No socket or REST calls of their own; they get data and callbacks through props or feature hooks.
   - `pages`: composition only. `RoomPage` wires the feature hooks and passes their results to widgets. Keep business logic out of pages.
   - `app`: providers, router, global styles.
5. **Side-effect boundaries:**
   - Socket: subscribe only through `useSocketEvent` from `@/shared/lib`. Emit only through `connectSocket()` from `@/shared/api`, and only from a feature's `model/`. Always use `SOCKET_EVENTS.*` and never string literals.
   - REST: only through `http` from `@/shared/api`, wrapped in an entity's `api/` (e.g. `entities/room/api`).
   - `sessionStorage`: only through `entities/room/model/session.ts`.
   - UI components (`ui/`) don't call socket or REST directly and don't hold business logic. They render props and call callbacks.
6. Don't create new layers, folders outside FSD, or "utils"/"helpers"/"common" dumps.

## Code principles
- **SRP:** one component or hook does one job. If a file mixes rendering, state, and side effects, split it into `ui/` and `model/`. Aim for components under ~150 lines and one exported hook per `use*.ts`.
- **Open/closed:** extend through props, config objects, and composition. Don't pile `if (type === ...)` branches into shared components.
- **Dependency inversion:** widgets and UI depend on props and interfaces, not on concrete sockets or APIs.
- **DRY:** before writing code, search the codebase for an existing component, hook, type, or constant (`shared/ui`, `shared/lib`, `entities/*`). Reuse it, and don't duplicate types that already exist in `entities/*/model/types.ts`. Extract a shared helper only after the second real repetition.
- **KISS / YAGNI:** write the simplest code that solves the task. Add no speculative abstractions, generic frameworks, or unused props or options, and don't refactor beyond the task.
- TypeScript strict: no `any`, no `@ts-ignore`, no non-null `!` unless it's truly guaranteed.
- React: correct hook dependencies, stable callbacks (`useCallback`) for handlers passed to `useSocketEvent`, cleanup in every effect.
- User-facing strings and code comments are in Russian. Follow `client/.prettierrc`.
- **Layers (z-index):** keep layering minimal.
  - Floating UI (modals, toasts, banners) renders through `Portal` from `@/shared/ui` into the end of `body`, so no parent stacking context (`glass`/`backdrop-filter` creates one) can trap it.
  - At page level, use only the named scale in `tailwind.config.js` (`z-nav`, `z-drawer`, `z-modal`, `z-toast`); popovers also go through `Portal` with fixed position. Never use numeric `z-*`, `z-[..]`, or an inline `zIndex`.
  - Inside the video card, don't use z-index at all. Order overlays in the DOM (player → guard → reactions → sound → ready → countdown); the card is `isolate`.
  - Floating surfaces use `.surface-floating` (opaque), not the translucent `glass-card`.
  - After changing `tailwind.config.js`, restart `npm run dev`, because the dev server doesn't pick up new theme keys.

## Definition of done
- `npm run build` passes (this is the type-check).
- No upward or sideways imports and no deep imports into another slice's internals.
- Remove dead code, unused exports, and orphaned files that your change produced.
- Report which files changed and why, and any server-side dependency your change needs.
