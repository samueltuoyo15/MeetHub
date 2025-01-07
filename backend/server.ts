import express, {Application, Request, Response} from "express";
import {Server} from "socket.io";
import {createServer} from "http";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
dotenv.config();

const app: Application = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
  });
  
io.on("connection", (socket) => {
  console.log('New client connection:', socket.id);
  
  socket.on("join-room", (roomId) => {
    socket.join(roomId)
    console.log(`client ${socket.id} joined the room  ${roomId}`);
    socket.to(roomId).emit("User joined", socket.id);
  });
  
  socket.on("disconnected", () => console.log('Client Disconnected:', socket.id));
});

server.listen(process.env.PORT, () => console.log(`server is running on http://localhost:${process.env.PORT}`));;