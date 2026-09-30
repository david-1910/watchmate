# server/CLAUDE.md — strict rules for the backend

These rules are **mandatory**. They add to `../CLAUDE.md`. If a task can't be done without breaking a rule, stop and ask the user. Don't work around the rule.

## Scope boundary
- Work **only** inside `server/`. Never edit `client/`.
- **The contract with the client is `../CONTRACT.md`.** Implement it exactly. Don't edit it, and don't add, rename, or omit anything it defines. If it's missing something, stop and ask the user.
- `shared/constants/socketEvents.ts` and `shared/constants/countdown.ts` are mirrored on the client. Change them only in sync, and only when asked.

## Layered architecture — hard rules
`app.ts` → routers / socket handlers (transport) → services (domain) → `state` (storage). Dependencies point one way only.

1. **Transport layer is thin.** `modules/*/*.router.ts` and `modules/socket/handlers/*.handler.ts` only:
   - parse and validate input (`validate([...])` for REST, type checks for socket payloads),
   - check authorization (`requireHost` for REST, `isInRoom` / `isHost` from `socket.guards.ts` for sockets),
   - call a service function,
   - send the response (`sendSuccess` / `sendError`) or emit events.

   No business logic and no direct `state` mutation in routers or handlers.
2. **Services own the domain logic** (`rooms`, `queue`, `suggestions`, `playback`, `ready`). REST and socket paths for the same action must call the **same** service function. Services never import Express or Socket.IO types (`req`, `res`, `socket`, `io`). They take plain data and return plain data.
3. **State access only through services.** `modules/state/state.ts` is read and written by services, not by routers, handlers, or middleware (the guards in `socket.guards.ts` may read it).
4. **Module boundaries:** a module doesn't import another module's internals. Call the other module's service. Cross-cutting code goes to `shared/` (`config`, `constants`, `middleware`, `types`, `utils`).
5. **Sockets:**
   - Every handler is registered with `onEvent` from `socket.guards.ts`, never with raw `socket.on`, so a malformed payload can't crash the process.
   - Treat every payload as untrusted. Validate its type, shape, and length before use. `null`, strings, and missing fields must be handled gracefully.
   - Every mutating event checks `isInRoom`. Host-only actions (playback control, video change, queue management, transfer the host role) must check `isHost`.
   - New handler file → add it to `HANDLERS` in `socket.gateway.ts`. Always use `SOCKET_EVENTS.*`, never string literals.
6. **REST:**
   - Routes are mounted under `/api/v1` in `app.ts`. Read `:roomId` via `getRoomIdParam(req)`.
   - Always respond through `shared/utils/response.ts`.
   - Update the `@swagger` JSDoc when you change a route.
   - Rate limiters live in `shared/middleware/rateLimit.ts`.
7. Don't add dependencies, a database, or new top-level folders without the user's approval.

## Code principles
- **SRP:** one function does one thing. Handlers stay a few lines. Split long service functions.
- **Open/closed:** add a new feature as a new module, handler file, or service function. Don't grow switch/if chains in existing code.
- **Dependency inversion:** transport depends on services, and services depend on state. Never the reverse.
- **DRY:** reuse existing guards, validators, response helpers, generators, and types from `shared/`. Before writing a helper, search for an existing one. Keep types in `shared/types` or the module, not re-declared per file.
- **KISS / YAGNI:** write the simplest solution. Add no speculative abstractions, classes, DI containers, or config options nobody asked for, and don't refactor beyond the task.
- TypeScript strict: no `any`, no `@ts-ignore`.
- Log messages, error messages, and comments are in Russian.

## Definition of done
- `npm run build` passes. Because `dist/` is committed, the rebuilt `dist/` must match `src/`.
- Server starts (`npm start`), and the affected REST and socket flows were exercised.
- Remove dead code and orphaned files that your change produced.
- Report which files changed and why, and any change the client must make.
