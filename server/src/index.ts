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

import { errorHandler, notFound } from "./middlewares/errorHandle";
import { verifyRecaptchaHook } from "./middlewares/captcha";

import api from "./api";
import { corsWhitelist, inProd, inStaging, maxReports } from "./constants";
import {
  // delRoomId,
  // getRoomId,
  // setRoomId,
  isUnmatchedUsers,
  popUnmatchedUsers,
  redis,
  removeUnmatchedUsers,
  setUnmatchedUsers,
} from "./redisClient";
import { getCollege, isCollegeMail } from "./utils/validateMail";
import { SocketData } from "./@types";
import { rlSocketClient } from "./middlewares/rateLimit";
import { Twilio } from "twilio";

config({ path: path.join(__dirname, "../.env") });

const port = process.env.PORT || 1337;

const app = express();

const twilioClient = new Twilio(
  // @ts-ignore next-line
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);

let server;

if (inProd || inStaging) {
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
    origin: corsWhitelist,
  },
});

async function matchUser(socket: Socket) {
  if (!(await isUnmatchedUsers())) {
    await setUnmatchedUsers(socket.id);
    return;
  }
  const { reports } = socket.data;
  reports && console.log("reports new match ", reports);
  if (reports >= maxReports) {
    io.to(socket.id).emit("ban");
    socket.disconnect();
    console.log("banned ", socket.id, socket?.data?.email);
    return;
  }
  const unmatchedUserId: string = await popUnmatchedUsers();
  if (unmatchedUserId === socket.id) return;
  const roomId = unmatchedUserId + "#" + socket.id;
  console.log("unmatched user from redis ", unmatchedUserId);

  const unmatchedSocket = await io.in(unmatchedUserId).fetchSockets();

  if (!unmatchedSocket || !unmatchedSocket.length) {
    await setUnmatchedUsers(socket.id);
    return;
  }

  const unmatchedSocketReports = unmatchedSocket[0]?.data?.reports;
  unmatchedSocketReports &&
    console.log("reports un match ", unmatchedSocketReports);
  if (
    unmatchedSocketReports &&
    parseInt(unmatchedSocketReports) >= maxReports
  ) {
    io.to(socket.id).emit("ban");
    socket.disconnect();
    console.log("banned ", socket.id, socket?.data?.email);
    // push the socket in queue
    await setUnmatchedUsers(socket.id);
    return;
  }

  socket.join(roomId);
  socket.data.roomId = roomId;

  // console.log("unmatched socket ", unmatchedSocket);

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
  try {
    const token = socket.handshake.auth.token;
    await rlSocketClient.consume(token);
    jwt.verify(
      token,
      process.env.JWT_SECRET as any,
      async (err: any, decoded: any) => {
        if (err) {
          console.log(err);
          next(err);
        } else {
          console.log("decoded ", decoded);
          const { data: email } = decoded;
          if (!email) next(new Error("email not found in token"));
          if (!isCollegeMail(email)) next(new Error("invalid token mail"));
          const reports = await redis.get(`ban:${email}`);
          if (reports && parseInt(reports) >= maxReports) {
            next(new Error("you have been banned for inppropriate acivity"));
            return;
          }
          socket.data.college = getCollege(email);
          socket.data.email = email;
          socket.data.reports = reports ? parseInt(reports) : 0;
          // const token = await twilioClient.tokens.create();

          next();
        }
      }
    );
  } catch (error) {
    next(error as Error);
  }
});

// io.use(async (socket, next) => {
//   const captchaToken = socket.handshake.auth.captchaToken;
//   if (!captchaToken) {
//     next(new Error("invalid captcha token"));
//   }
//   verifyRecaptchaHook(captchaToken, next);
// });

io.on("connection", (socket) => {
  console.log(`socketd connected `, socket.id);
  twilioClient.tokens
    .create({ ttl: 3600 + 120 })
    .then((token) => {
      console.log(token);
      io.to(socket.id).emit("iceServers", { iceServers: token.iceServers });
    })
    .catch((err) => {
      console.log(err);
      io.to(socket.id).emit("iceServers", { iceServers: null });
    });
  io.sockets.allSockets().then((data) => console.log(data.size));
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

  socket.on("report", async () => {
    try {
      const { roomId } = socket.data as SocketData;
      if (!roomId) return;
      // console.log("ice candidate", data);
      const reportedId = roomId.split("#").find((id) => id !== socket.id);
      if (!reportedId) return;
      const reportedSocket = await io.in(reportedId).fetchSockets();
      const reportedEmail = reportedSocket[0]?.data?.email;
      console.log(reportedEmail);
      const prevReports = reportedSocket[0].data.reports;
      if (!isNaN(parseInt(prevReports))) {
        reportedSocket[0].data.reports = parseInt(prevReports) + 1;
        console.log("new reports ", reportedSocket[0].data.reports);
      }
      if (!reportedEmail) return;
      await redis.incr(`ban:${reportedEmail}`);
      if (parseInt(prevReports) === maxReports - 1) {
        await redis.expire(`ban:${reportedEmail}`, 60 * 60 * 24);
        io.to(reportedId).emit("ban");
        return;
      }
      await redis.expire(`ban:${reportedEmail}`, 60 * 10);
    } catch (error) {
      console.log("failed to report");
    }
  });

  socket.on("endCall", async () => {
    const { roomId } = socket.data as SocketData;
    if (!roomId) return;
    socket.to(roomId).emit("strangerDisconnected");
    const clients = await io.in(roomId).fetchSockets();
    clients.forEach(async (client) => {
      client.leave(roomId);
      // console.log("ending ", client.id);
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

const corsOptions = {
  origin: corsWhitelist,
};

app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));

app.use("/api/v1", api);
app.use(notFound);
app.use(errorHandler);
server.listen(port, () => console.log(`listening at port ${port} ${inProd}`));
