import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // В продакшене заменить на конкретный домен
        methods: ["GET", "POST"],
    },
});

type QueueItem = {
    id: string;
    url: string;
    title: string;
};

type Suggestion = {
    id: string;
    url: string;
    title: string;
    suggestedBy: string;
    suggestedById: string;
};

app.use(cors());
app.use(express.json());

const rooms = new Map<
    string,
    {
        id: string;
        createdAt: Date;
        hostToken: string;
        isPrivate: boolean;
        password?: string;
    }
>();
const userNames = new Map<string, string>();
const userRooms = new Map<string, string>();
const readyUsers = new Map<string, Set<string>>();
const roomHosts = new Map<string, string>();
const roomQueues = new Map<string, QueueItem[]>();
const roomSuggestions = new Map<string, Suggestion[]>();


function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateHostToken(): string {
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

function getRoomUsers(roomId: string): { userId: string; userName: string }[] {
    const users: { userId: string; userName: string }[] = [];
    const hostId = roomHosts.get(roomId);

    userRooms.forEach((room, userId) => {
        if (room === roomId) {
            users.push({
                userId,
                userName: userNames.get(userId) || "Аноним",
            });
        }
    });

    // Сортируем так, чтобы хост всегда был первым
    users.sort((a, b) => {
        if (a.userId === hostId) return -1;
        if (b.userId === hostId) return 1;
        return 0;
    });

    return users;
}

function getRoomReadyUsers(roomId: string): string[] {
    return Array.from(readyUsers.get(roomId) || []);
}

app.post("/rooms", (req, res) => {
    const id = generateRoomId();
    const hostToken = generateHostToken();
    const { isPrivate, password } = req.body || {};

    rooms.set(id, {
        id,
        createdAt: new Date(),
        hostToken,
        isPrivate: !!isPrivate,
        password: isPrivate ? password : undefined,
    });

    console.log(
        `Комната создана: ${id} (${isPrivate ? "приватная" : "публичная"})`,
    );
    res.json({ id, hostToken, isPrivate: !!isPrivate });
});

app.get("/rooms/:id", (req, res) => {
    const { id } = req.params;
    const room = rooms.get(id.toUpperCase());
    if (room) {
        // Не отправляем пароль клиенту
        res.json({
            id: room.id,
            createdAt: room.createdAt,
            isPrivate: room.isPrivate,
        });
    } else {
        res.status(404).json({ error: "Комната не найдена" });
    }
});

// Проверка пароля для приватной комнаты
app.post("/rooms/:id/verify", (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const room = rooms.get(id.toUpperCase());

    if (!room) {
        return res.status(404).json({ error: "Комната не найдена" });
    }

    if (!room.isPrivate) {
        return res.json({ success: true });
    }

    if (room.password === password) {
        return res.json({ success: true });
    } else {
        return res.status(401).json({ error: "Неверный пароль" });
    }
});

io.on("connection", (socket) => {
    console.log("Пользователь подключился:", socket.id);

    socket.on(
        "join-room",
        (data: { roomId: string; userName: string; hostToken?: string }) => {
            socket.join(data.roomId);
            userNames.set(socket.id, data.userName);
            userRooms.set(socket.id, data.roomId);
            console.log(`${data.userName} вошёл в комнату ${data.roomId}`);

            const room = rooms.get(data.roomId);

            // Если передан правильный токен хоста - делаем этого пользователя хостом
            if (data.hostToken && room && room.hostToken === data.hostToken) {
                roomHosts.set(data.roomId, socket.id);
                console.log(
                    `${data.userName} стал хостом комнаты ${data.roomId} (создатель)`,
                );
            }
            // Если хоста нет и токен не передан - первый становится хостом (fallback)
            else if (!roomHosts.has(data.roomId)) {
                roomHosts.set(data.roomId, socket.id);
                console.log(
                    `${data.userName} стал хостом комнаты ${data.roomId} (первый)`,
                );
            }

            io.to(data.roomId).emit("users-update", getRoomUsers(data.roomId));
            io.to(data.roomId).emit("host-update", roomHosts.get(data.roomId));

            socket.to(data.roomId).emit("user-joined", {
                userId: socket.id,
                userName: data.userName,
            });
        },
    );

    socket.on("chat-message", (data: { roomId: string; message: string }) => {
        const userName = userNames.get(socket.id) || "Аноним";
        io.to(data.roomId).emit("chat-message", {
            userId: socket.id,
            userName: userName,
            message: data.message,
            timestamp: new Date(),
        });
    });

    socket.on("start-countdown", (roomId: string) => {
        io.to(roomId).emit("countdown", 3);

        setTimeout(() => {
            io.to(roomId).emit("countdown", 2);
        }, 1000);

        setTimeout(() => {
            io.to(roomId).emit("countdown", 1);
        }, 2000);

        setTimeout(() => {
            io.to(roomId).emit("countdown", 0);
        }, 3000);
    });

    socket.on("reaction", (data: { roomId: string; emoji: string }) => {
        const userName = userNames.get(socket.id) || "Аноним";
        io.to(data.roomId).emit("reaction", {
            userId: socket.id,
            userName: userName,
            emoji: data.emoji,
        });
    });

    socket.on("share-video", (data: { roomId: string; videoUrl: string }) => {
        io.to(data.roomId).emit("video-update", data.videoUrl);
    });

    socket.on("clear-video", (roomId: string) => {
        io.to(roomId).emit("video-update", "");
        io.to(roomId).emit("local-file-update", null);
    });

    socket.on(
        "share-local-file",
        (data: { roomId: string; fileName: string }) => {
            io.to(data.roomId).emit("local-file-update", data.fileName);
        },
    );

    socket.on("toggle-ready", (roomId: string) => {
        if (!readyUsers.has(roomId)) {
            readyUsers.set(roomId, new Set());
        }

        const roomReady = readyUsers.get(roomId)!;

        if (roomReady.has(socket.id)) {
            roomReady.delete(socket.id);
        } else {
            roomReady.add(socket.id);
        }

        const readyList = getRoomReadyUsers(roomId);
        const totalUsers = getRoomUsers(roomId).length;

        io.to(roomId).emit("ready-update", {
            readyUsers: readyList,
            allReady: readyList.length === totalUsers && totalUsers > 0,
        });

        // Автостарт когда все готовы
        if (readyList.length === totalUsers && totalUsers > 0) {
            io.to(roomId).emit("countdown", 3);
            setTimeout(() => io.to(roomId).emit("countdown", 2), 1000);
            setTimeout(() => io.to(roomId).emit("countdown", 1), 2000);
            setTimeout(() => {
                io.to(roomId).emit("countdown", 0);
                // Сбросить готовность после старта
                readyUsers.set(roomId, new Set());
                io.to(roomId).emit("ready-update", {
                    readyUsers: [],
                    allReady: false,
                });
            }, 3000);
        }
    });

    socket.on(
        "queue-add",
        ({
            roomId,
            url,
            title,
        }: {
            roomId: string;
            url: string;
            title: string;
        }) => {
            if (roomHosts.get(roomId) !== socket.id) return;

            const queue = roomQueues.get(roomId) || [];
            const newItem: QueueItem = {
                id: Date.now().toString(),
                url,
                title,
            };
            queue.push(newItem);
            roomQueues.set(roomId, queue);

            io.to(roomId).emit("queue-update", queue);
        },
    );

    socket.on(
        "queue-remove",
        ({ roomId, itemId }: { roomId: string; itemId: string }) => {
            if (roomHosts.get(roomId) !== socket.id) return;

            const queue = roomQueues.get(roomId) || [];
            const filtered = queue.filter((item) => item.id !== itemId);
            roomQueues.set(roomId, filtered);

            io.to(roomId).emit("queue-update", filtered);
        },
    );

    socket.on(
        "queue-play",
        ({ roomId, itemId }: { roomId: string; itemId: string }) => {
            if (roomHosts.get(roomId) !== socket.id) return;

            const queue = roomQueues.get(roomId) || [];
            const item = queue.find((i) => i.id === itemId);

            if (item) {
                const filtered = queue.filter((i) => i.id !== itemId);
                roomQueues.set(roomId, filtered);
                io.to(roomId).emit("queue-update", filtered);
                io.to(roomId).emit("video-update", item.url);
            }
        },
    );

    socket.on(
        "queue-reorder",
        ({
            roomId,
            fromIndex,
            toIndex,
        }: {
            roomId: string;
            fromIndex: number;
            toIndex: number;
        }) => {
            if (roomHosts.get(roomId) !== socket.id) return;

            const queue = roomQueues.get(roomId) || [];
            if (
                fromIndex < 0 ||
                fromIndex >= queue.length ||
                toIndex < 0 ||
                toIndex >= queue.length
            )
                return;

            // Удаляем элемент из старой позиции
            const [movedItem] = queue.splice(fromIndex, 1);
            // Вставляем в новую позицию
            queue.splice(toIndex, 0, movedItem);

            roomQueues.set(roomId, queue);
            io.to(roomId).emit("queue-update", queue);
        },
    );

    socket.on(
        "suggest-video",
        ({
            roomId,
            url,
            title,
        }: {
            roomId: string;
            url: string;
            title: string;
        }) => {
            const userName = userNames.get(socket.id) || "Аноним";
            const suggestions = roomSuggestions.get(roomId) || [];

            const newSuggestion: Suggestion = {
                id: Date.now().toString(),
                url,
                title,
                suggestedBy: userName,
                suggestedById: socket.id,
            };

            suggestions.push(newSuggestion);
            roomSuggestions.set(roomId, suggestions);

            io.to(roomId).emit("suggestions-update", suggestions);
        },
    );

    // Хост принимает предложение
    socket.on(
        "accept-suggestion",
        ({
            roomId,
            suggestionId,
        }: {
            roomId: string;
            suggestionId: string;
        }) => {
            if (roomHosts.get(roomId) !== socket.id) return;

            const suggestions = roomSuggestions.get(roomId) || [];
            const suggestion = suggestions.find((s) => s.id === suggestionId);

            if (suggestion) {
                // Добавляем в очередь
                const queue = roomQueues.get(roomId) || [];
                const newItem: QueueItem = {
                    id: Date.now().toString(),
                    url: suggestion.url,
                    title: suggestion.title,
                };
                queue.push(newItem);
                roomQueues.set(roomId, queue);

                // Удаляем из предложений
                const filtered = suggestions.filter(
                    (s) => s.id !== suggestionId,
                );
                roomSuggestions.set(roomId, filtered);

                io.to(roomId).emit("queue-update", queue);
                io.to(roomId).emit("suggestions-update", filtered);
            }
        },
    );

    // Хост отклоняет предложение
    socket.on(
        "reject-suggestion",
        ({
            roomId,
            suggestionId,
        }: {
            roomId: string;
            suggestionId: string;
        }) => {
            if (roomHosts.get(roomId) !== socket.id) return;

            const suggestions = roomSuggestions.get(roomId) || [];
            const filtered = suggestions.filter((s) => s.id !== suggestionId);
            roomSuggestions.set(roomId, filtered);

            io.to(roomId).emit("suggestions-update", filtered);
        },
    );

    socket.on("disconnect", () => {
        const userName = userNames.get(socket.id);
        const roomId = userRooms.get(socket.id);
        console.log(`${userName || socket.id} отключился`);
        userNames.delete(socket.id);
        userRooms.delete(socket.id);
        if (roomId && readyUsers.has(roomId)) {
            readyUsers.get(roomId)!.delete(socket.id);
            io.to(roomId).emit("ready-update", {
                readyUsers: getRoomReadyUsers(roomId),
                allReady: false,
            });
        }
        if (roomId && roomHosts.get(roomId) === socket.id) {
            const remainingUsers = getRoomUsers(roomId);
            if (remainingUsers.length > 0) {
                roomHosts.set(roomId, remainingUsers[0].userId);
                io.to(roomId).emit("host-update", remainingUsers[0].userId);
                console.log(`Новый хост: ${remainingUsers[0].userName}`);
            } else {
                roomHosts.delete(roomId);
            }
        }
        if (roomId) {
            const remainingUsers = getRoomUsers(roomId);
            io.to(roomId).emit("users-update", remainingUsers);

            // Удаляем комнату если все вышли
            if (remainingUsers.length === 0) {
                rooms.delete(roomId);
                roomHosts.delete(roomId);
                readyUsers.delete(roomId);
                console.log(`Комната ${roomId} удалена (все вышли)`);
            }
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
