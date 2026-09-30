"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cors = void 0;
// Ручные CORS-заголовки: отражаем Origin запроса
const cors = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
};
exports.cors = cors;
