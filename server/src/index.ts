import express from "express";

import https from "https";
import http from "http";
import { Server, Socket } from "socket.io";
import { readFileSync } from "fs";
import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, "../.env") });

const port = process.env.PORT || 1337;

const app = express();

let server;
const inDev = process.env.NODE_ENV === "development";

if (inDev) {
  server = https.createServer(
    {
      key: readFileSync("certificates/key.pem"),
      cert: readFileSync("certificates/cert.pem"),
    },
    app
  );
} else {
  server = http.createServer(app);
}
const io = new Server(server, {
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
  io.to(roomId).emit("matchSuccess", unmatchedUser.id);
  console.log("joined", unmatchedUser.id, socket.id, roomId);

  rooms[socket.id] = roomId;
  rooms[unmatchedUser.id] = roomId;
  unmatchedUsers.delete(unmatchedUser.id);
}

io.on("connection", (socket) => {
  console.log(`socketd connected `, socket.id);
  console.log("all sockets", io.sockets.allSockets());

  socket.on("ping", async () => {
    const sockets = await io.sockets.allSockets();
    io.to(socket.id).emit("pong", `clients connected : ${sockets.size}`);
  });
  socket.on("connectNewUser", () => {
    if (rooms[socket.id]) {
      socket.leave(rooms[socket.id]);
      delete rooms[socket.id];
    }
    matchUser(socket);
  });

  socket.on("message", (message) => {
    socket.to(rooms[socket.id]).emit("newMessage", message);
  });

  socket.on("typing", (isTyping: boolean) => {
    if (isTyping === true || isTyping === false) {
      socket.to(rooms[socket.id]).emit("typing", isTyping);
    }
  });

  socket.on("offer", (data) => {
    const roomId = rooms[socket.id];
    console.log("offer data", data);

    socket.to(roomId).emit("newOffer", data);
  });
  socket.on("answer", (data) => {
    const roomId = rooms[socket.id];
    console.log("answer data", data);

    socket.to(roomId).emit("newAnswer", data);
  });
  socket.on("iceCandidate", (data: RTCIceCandidate) => {
    const roomId = rooms[socket.id];
    console.log("ice candidate", data);

    socket.to(roomId).emit("newIceCandidate", data);
  });

  socket.on("disconnect", async () => {
    console.log("disconnected", socket.id);
    const roomId = rooms[socket.id];
    socket.to(roomId).emit("strangerDisconnected");
    const clients = await io.in(roomId).fetchSockets();
    clients.forEach((client) => {
      client.leave(roomId);
      console.log("removing ", client.id);

      delete rooms[client.id];
    });
    unmatchedUsers.delete(socket.id);
  });
});
server.listen(port, () => console.log(`listening at port ${port} ${inDev}`));
