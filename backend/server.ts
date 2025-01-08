import express, { Application } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app: Application = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

const rooms: { [roomId: string]: string[] } = {};

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("create-room", (_, callback) => {
    const roomId = `meet-${uuidv4()}`;
    rooms[roomId] = [];
    callback(roomId);
  });

  socket.on("join-room", (roomId: string, callback) => {
    if (!rooms[roomId]) {
      callback({ success: false, message: "Room does not exist." });
      return;
    }
    rooms[roomId].push(socket.id);
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
    const clientsInRoom = rooms[roomId].filter((id) => id !== socket.id);
    callback({ success: true, participants: clientsInRoom });
  });

  socket.on("offer", (data) => {
    socket.to(data.target).emit("offer", {
      offer: data.offer,
      sender: socket.id,
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.target).emit("answer", {
      answer: data.answer,
      sender: socket.id,
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id,
    });
  });

  socket.on("disconnect", () => {
    for (const roomId of Object.keys(rooms)) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        socket.to(roomId).emit("user-disconnected", socket.id);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
