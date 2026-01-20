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

function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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

    socket.on("join-room", (roomId: string) => {
        socket.join(roomId);
        console.log(`${socket.id} вошёл в комнату ${roomId}`);

        socket.to(roomId).emit("user-joined", socket.id);
    });

    socket.on("chat-message", (data: { roomId: string; message: string }) => {
        io.to(data.roomId).emit("chat-message", {
            userId: socket.id,
            message: data.message,
            timestamp: new Date(),
        });
    });

    socket.on("disconnect", () => {
        console.log("Пользователь отключился:", socket.id);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
