"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const timings_1 = require("../constants/timings");
// Положительное целое из env, иначе значение по умолчанию
const positiveIntFromEnv = (name, fallback) => {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
};
exports.env = {
    port: positiveIntFromEnv('PORT', 3001),
    // За прокси: IP клиента берётся из X-Forwarded-For
    trustProxy: process.env.TRUST_PROXY === '1',
    memberGraceMs: positiveIntFromEnv('MEMBER_GRACE_MS', timings_1.MEMBER_GRACE_MS),
    roomEmptyTtlMs: positiveIntFromEnv('ROOM_EMPTY_TTL_MS', timings_1.ROOM_EMPTY_TTL_MS),
    hostGraceMs: positiveIntFromEnv('HOST_GRACE_MS', timings_1.HOST_GRACE_MS),
};
