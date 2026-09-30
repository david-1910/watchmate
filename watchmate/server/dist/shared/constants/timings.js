"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOST_GRACE_MS = exports.ROOM_EMPTY_TTL_MS = exports.MEMBER_GRACE_MS = void 0;
// Значения из CONTRACT.md, раздел 3. Для тестов их можно уменьшить через env (см. shared/config/env.ts)
exports.MEMBER_GRACE_MS = 180000;
exports.ROOM_EMPTY_TTL_MS = 180000;
exports.HOST_GRACE_MS = 30000;
