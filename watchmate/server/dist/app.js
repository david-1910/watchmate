"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = void 0;
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./shared/config/swagger");
const rooms_router_1 = require("./modules/rooms/rooms.router");
const rooms_users_router_1 = require("./modules/rooms/rooms.users.router");
const queue_router_1 = require("./modules/queue/queue.router");
const suggestions_router_1 = require("./modules/suggestions/suggestions.router");
const socket_gateway_1 = require("./modules/socket/socket.gateway");
const errorHandler_1 = require("./shared/middleware/errorHandler");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
});
app.use(express_1.default.json({ limit: '10kb' }));
// Общий лимит: 200 запросов за 15 минут с одного IP
const globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { message: 'Слишком много запросов', code: 'RATE_LIMIT' } },
});
// Создание комнат: 10 комнат в час (защита от спама памяти)
const createRoomLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: { success: false, error: { message: 'Слишком много комнат создано', code: 'RATE_LIMIT' } },
});
// Проверка пароля: 5 попыток за 15 минут (защита от брутфорса)
const verifyLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, error: { message: 'Слишком много попыток входа', code: 'RATE_LIMIT' } },
});
app.use('/api/', globalLimiter);
app.use('/api/docs', swagger_ui_express_1.default.serve);
app.get('/api/docs', swagger_ui_express_1.default.setup(swagger_1.swaggerSpec));
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const io = (0, socket_gateway_1.createSocketGateway)(httpServer);
const api = express_1.default.Router();
api.post('/rooms', createRoomLimiter, (req, res, next) => next());
api.post('/rooms/:roomId/verify', verifyLimiter, (req, res, next) => next());
api.use('/rooms', rooms_router_1.roomsRouter);
api.use('/rooms/:roomId/users', rooms_users_router_1.roomUsersRouter);
api.use('/rooms/:roomId/queue', (0, queue_router_1.createQueueRouter)(io));
api.use('/rooms/:roomId/suggestions', (0, suggestions_router_1.createSuggestionsRouter)(io));
app.use('/api/v1', api);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
