"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./shared/config/env");
app_1.httpServer.listen(env_1.env.port, () => {
    console.log(`Сервер запущен: http://localhost:${env_1.env.port}`);
});
