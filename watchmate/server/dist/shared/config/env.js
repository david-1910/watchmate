"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const rawClientUrls = process.env.CLIENT_URL ?? 'http://localhost:5173';
exports.env = {
    port: Number(process.env.PORT) || 3001,
    clientUrls: rawClientUrls.split(',').map((u) => u.trim()),
};
