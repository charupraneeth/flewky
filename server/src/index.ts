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

const unmatchedUsers: Socket[] = [];

const rooms: any = {};

function matchUser(socket: Socket) {
  if (!unmatchedUsers.length) {
    unmatchedUsers.push(socket);
    return;
  }
  const roomId = unmatchedUsers[0].id + "#" + socket.id;
  socket.join(roomId);
  unmatchedUsers[0].join(roomId);
  io.to(roomId).emit("matchSuccess");
  rooms[socket.id] = roomId;
  rooms[unmatchedUsers[0].id] = roomId;
  unmatchedUsers.shift();
}

io.on("connection", (socket) => {
  console.log(`socketd connected `, socket.id);
  console.log(io.sockets.allSockets());

  socket.on("connectNewUser", () => {
    matchUser(socket);
  });

  socket.on("message", (message) => {
    socket.to(rooms[socket.id]).emit("newMessage", message);
  });
  socket.on("disonnect", () => {
    delete rooms[socket.id];
  });
});
httpServer.listen(port, () => console.log(`listening at port ${port}`));
