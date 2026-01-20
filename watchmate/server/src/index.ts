import express from "express";
import cors from "cors";

const app = express();

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

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});
