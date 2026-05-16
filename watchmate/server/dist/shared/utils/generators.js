"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = exports.generateHostToken = exports.generateRoomId = void 0;
const generateRoomId = () => Math.random().toString(36).substring(2, 8).toUpperCase();
exports.generateRoomId = generateRoomId;
const generateHostToken = () => Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
exports.generateHostToken = generateHostToken;
const generateId = () => Date.now().toString();
exports.generateId = generateId;
