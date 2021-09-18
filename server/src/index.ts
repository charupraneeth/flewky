import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const port = process.env.PORT || 1337;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

interface RoomMap {
  [socketId: string]: string;
}

const unmatchedUsers: Map<string, Socket> = new Map();

const rooms: RoomMap = {};

function matchUser(socket: Socket) {
  if (!unmatchedUsers.size) {
    unmatchedUsers.set(socket.id, socket);
    return;
  }

  const iterator = unmatchedUsers.values();
  const unmatchedUser: Socket = iterator.next().value;
  if (unmatchedUser.id === socket.id) return;
  const roomId = unmatchedUser.id + "#" + socket.id;
  socket.join(roomId);
  unmatchedUser.join(roomId);
  io.to(roomId).emit("matchSuccess");
  console.log("joined", unmatchedUser.id, socket.id, roomId);

  rooms[socket.id] = roomId;
  rooms[unmatchedUser.id] = roomId;
  unmatchedUsers.delete(unmatchedUser.id);
}

io.on("connection", (socket) => {
  console.log(`socketd connected `, socket.id);
  console.log("all sockets", io.sockets.allSockets());

  socket.on("connectNewUser", () => {
    matchUser(socket);
  });

  socket.on("message", (message) => {
    socket.to(rooms[socket.id]).emit("newMessage", message);
  });
  socket.on("disconnect", () => {
    console.log("disconnected", socket.id);

    delete rooms[socket.id];
    unmatchedUsers.delete(socket.id);
  });
});
httpServer.listen(port, () => console.log(`listening at port ${port}`));
