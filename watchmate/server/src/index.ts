import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());

const rooms = new Map<string, { id: string; createdAt: Date; hostToken: string }>();
const userNames = new Map<string, string>();
const userRooms = new Map<string, string>();
const readyUsers = new Map<string, Set<string>>();
const roomHosts = new Map<string, string>();

function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generateHostToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getRoomUsers(roomId: string): { userId: string; userName: string }[] {
    const users: { userId: string; userName: string }[] = [];
    userRooms.forEach((room, userId) => {
        if (room === roomId) {
            users.push({
                userId,
                userName: userNames.get(userId) || "Аноним",
            });
        }
    });
    return users;
}

function getRoomReadyUsers(roomId: string): string[] {
    return Array.from(readyUsers.get(roomId) || []);
}

app.post("/rooms", (req, res) => {
    const id = generateRoomId();
    const hostToken = generateHostToken();
    rooms.set(id, { id, createdAt: new Date(), hostToken });
    console.log(`Комната создана: ${id}`);
    res.json({ id, hostToken });
});

app.get("/rooms/:id", (req, res) => {
    const { id } = req.params;
    const room = rooms.get(id.toUpperCase());
    if (room) {
        res.json(room);
    } else {
        res.status(404).json({ error: "Комната не найдена" });
    }
});

io.on("connection", (socket) => {
    console.log("Пользователь подключился:", socket.id);

    socket.on("join-room", (data: { roomId: string; userName: string; hostToken?: string }) => {
        socket.join(data.roomId);
        userNames.set(socket.id, data.userName);
        userRooms.set(socket.id, data.roomId);
        console.log(`${data.userName} вошёл в комнату ${data.roomId}`);

        const room = rooms.get(data.roomId);

        // Если передан правильный токен хоста - делаем этого пользователя хостом
        if (data.hostToken && room && room.hostToken === data.hostToken) {
            roomHosts.set(data.roomId, socket.id);
            console.log(`${data.userName} стал хостом комнаты ${data.roomId} (создатель)`);
        }
        // Если хоста нет и токен не передан - первый становится хостом (fallback)
        else if (!roomHosts.has(data.roomId)) {
            roomHosts.set(data.roomId, socket.id);
            console.log(`${data.userName} стал хостом комнаты ${data.roomId} (первый)`);
        }

        io.to(data.roomId).emit("users-update", getRoomUsers(data.roomId));
        io.to(data.roomId).emit("host-update", roomHosts.get(data.roomId));

        socket.to(data.roomId).emit("user-joined", {
            userId: socket.id,
            userName: data.userName,
        });
    });

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
    });

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
            io.to(roomId).emit("users-update", getRoomUsers(roomId));
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
