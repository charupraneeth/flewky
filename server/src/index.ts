import express from "express";

import https from "https";
import http from "http";
import { Server, Socket } from "socket.io";
import helmet from "helmet";
import { readFileSync } from "fs";
import { config } from "dotenv";
import path from "path";
import cors from "cors";
import jwt from "jsonwebtoken";

import { errorHandler, notFound, verifyRecaptchaHook } from "./middlewares";
import api from "./api";
import { inProd } from "./constants";
import {
  // delRoomId,
  // getRoomId,
  // setRoomId,
  isUnmatchedUsers,
  popUnmatchedUsers,
  removeUnmatchedUsers,
  setUnmatchedUsers,
} from "./redisClient";
import { getCollege, isCollegeMail } from "./utils/validateMail";
import { SocketData } from "./@types";

config({ path: path.join(__dirname, "../.env") });

const port = process.env.PORT || 1337;

const app = express();

let server;

if (inProd) {
  server = http.createServer(app);
} else {
  server = https.createServer(
    {
      key: readFileSync("certificates/key.pem"),
      cert: readFileSync("certificates/cert.pem"),
    },
    app
  );
}
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

async function matchUser(socket: Socket) {
  if (!(await isUnmatchedUsers())) {
    await setUnmatchedUsers(socket.id);
    return;
  }

  const unmatchedUserId: string = await popUnmatchedUsers();
  if (unmatchedUserId === socket.id) return;
  const roomId = unmatchedUserId + "#" + socket.id;
  console.log("unmatched user from redis ", unmatchedUserId);

  const unmatchedSocket = await io.in(unmatchedUserId).fetchSockets();
  if (!unmatchedSocket || !unmatchedSocket.length) {
    console.log("removing from here");
    await removeUnmatchedUsers(unmatchedUserId);
    return await setUnmatchedUsers(socket.id);
  }

  socket.join(roomId);
  socket.data.roomId = roomId;

  console.log("unmatched socket ", unmatchedSocket);

  unmatchedSocket[0].join(roomId);
  unmatchedSocket[0].data.roomId = roomId;

  io.to(socket.id).emit("matchSuccess", {
    isHost: false,
    strangerCollege: unmatchedSocket[0].data?.college,
  });
  io.to(unmatchedUserId).emit("matchSuccess", {
    isHost: true,
    strangerCollege: socket.data?.college,
  });

  console.log("joined", unmatchedUserId, socket.id, roomId);

  // rooms[socket.id] = roomId;
  // rooms[unmatchedUserId] = roomId;
}

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  jwt.verify(token, process.env.JWT_SECRET as any, (err: any, decoded: any) => {
    if (err) {
      console.log(err);
      next(err);
    } else {
      console.log("decoded ", decoded);
      const { data: email } = decoded;
      if (!email) next(new Error("email not found in token"));
      if (!isCollegeMail(email)) next(new Error("invalid token mail"));
      socket.data.college = getCollege(email);
      socket.data.email = email;
      next();
    }
  });
});

io.use(async (socket, next) => {
  const captchaToken = socket.handshake.auth.captchaToken;
  if (!captchaToken) {
    next(new Error("invalid captcha token"));
  }
  verifyRecaptchaHook(captchaToken, next);
});

io.on("connection", (socket) => {
  console.log(`socketd connected `, socket.id);
  console.log("all sockets", io.sockets.allSockets());

  socket.on("connectNewUser", async () => {
    const { roomId } = socket.data as SocketData;
    if (roomId) {
      socket.leave(roomId);
    }
    await matchUser(socket);
  });

  socket.on("message", async (message) => {
    const { roomId } = socket.data as SocketData;
    if (!roomId) return;
    socket.to(roomId).emit("newMessage", message);
  });

  socket.on("typing", async (isTyping: boolean) => {
    const { roomId } = socket.data as SocketData;
    if (!roomId) return;
    if (isTyping === true || isTyping === false) {
      socket.to(roomId).emit("typing", isTyping);
    }
  });

  socket.on("offer", async (data) => {
    const { roomId } = socket.data as SocketData;
    // console.log("offer data", data);
    if (!roomId) return;
    socket.to(roomId).emit("newOffer", data);
  });
  socket.on("answer", async (data) => {
    const { roomId } = socket.data as SocketData;
    if (!roomId) return;
    // console.log("answer data", data);
    socket.to(roomId).emit("newAnswer", data);
  });
  socket.on("iceCandidate", async (data: RTCIceCandidate) => {
    const { roomId } = socket.data as SocketData;
    if (!roomId) return;
    // console.log("ice candidate", data);
    socket.to(roomId).emit("newIceCandidate", data);
  });

  socket.on("endCall", async () => {
    console.log("ended call", socket.id);
    const { roomId } = socket.data as SocketData;
    if (!roomId) return;
    socket.to(roomId).emit("strangerDisconnected");
    const clients = await io.in(roomId).fetchSockets();
    clients.forEach(async (client) => {
      client.leave(roomId);
      console.log("ending ", client.id);
    });
    await removeUnmatchedUsers(socket.id);
  });

  socket.on("disconnect", async () => {
    console.log("disconnected", socket.id);
    const { roomId } = socket.data as SocketData;
    if (!roomId) return;
    socket.to(roomId).emit("strangerDisconnected");
    const clients = await io.in(roomId).fetchSockets();
    clients.forEach((client) => {
      client.leave(roomId);
      console.log("removing ", client.id);
    });
    await removeUnmatchedUsers(socket.id);
  });
});

app.use(helmet());
app.use(express.json());
app.use(cors());

app.use("/api/v1", api);
app.use(notFound);
app.use(errorHandler);
server.listen(port, () => console.log(`listening at port ${port} ${inProd}`));
