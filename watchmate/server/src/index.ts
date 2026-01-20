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

const rooms = new Map<string, { id: string; createdAt: Date }>();
const userNames = new Map<string, string>();
const userRooms = new Map<string, string>();

function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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

app.post("/rooms", (req, res) => {
    const id = generateRoomId();
    rooms.set(id, { id, createdAt: new Date() });
    console.log(`Комната создана: ${id}`);
    res.json({ id });
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

    socket.on("join-room", (data: { roomId: string; userName: string }) => {
        socket.join(data.roomId);
        userNames.set(socket.id, data.userName);
        userRooms.set(socket.id, data.roomId);
        console.log(`${data.userName} вошёл в комнату ${data.roomId}`);

        io.to(data.roomId).emit("users-update", getRoomUsers(data.roomId));

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

    socket.on("reaction", (data: {roomId: string; emoji: string }) => {
      const userName = userNames.get(socket.id) ||"Аноним";
      io.to(data.roomId).emit("reaction", {
        userId: socket.id,
        userName: userName,
        emoji: data.emoji,
      })
    })

    socket.on("disconnect", () => {
        const userName = userNames.get(socket.id);
        const roomId = userRooms.get(socket.id);
        console.log(`${userName || socket.id} отключился`);
        userNames.delete(socket.id);
        userRooms.delete(socket.id);
        if (roomId) {
            io.to(roomId).emit("users-update", getRoomUsers(roomId));
        }
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
