"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBoundedString = exports.isRoomId = exports.isUuid = exports.isObject = void 0;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
exports.isObject = isObject;
const isUuid = (value) => typeof value === 'string' && UUID_V4.test(value);
exports.isUuid = isUuid;
// roomId — UUID строго в нижнем регистре
const isRoomId = (value) => (0, exports.isUuid)(value) && value === value.toLowerCase();
exports.isRoomId = isRoomId;
// Непустая (после trim) строка не длиннее max
const isBoundedString = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
exports.isBoundedString = isBoundedString;
