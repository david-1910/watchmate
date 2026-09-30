"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJoinCode = exports.generateSecretToken = exports.generateId = void 0;
const crypto_1 = require("crypto");
const limits_1 = require("../constants/limits");
const generateId = () => (0, crypto_1.randomUUID)();
exports.generateId = generateId;
// 48 hex-символов: hostToken и memberToken
const generateSecretToken = () => (0, crypto_1.randomBytes)(24).toString('hex');
exports.generateSecretToken = generateSecretToken;
const generateJoinCode = () => Array.from({ length: limits_1.JOIN_CODE_LENGTH }, () => limits_1.JOIN_CODE_ALPHABET[(0, crypto_1.randomInt)(limits_1.JOIN_CODE_ALPHABET.length)]).join('');
exports.generateJoinCode = generateJoinCode;
