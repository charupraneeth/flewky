import Redis from "ioredis";
import { Socket } from "socket.io";
import { inProd } from "./constants";

let redis: Redis.Redis;
// create and connect redis client to local instance.
if (inProd) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  redis = new Redis();
}
// Print ready msg to the console
redis.connect(() => console.log("redis connected"));

async function get(key: string) {
  const value = await redis.get(key);
  return value;
}
async function del(key: string) {
  await redis.del(key);
}

async function setEx(key: string, ttl: number, value: string) {
  await redis.setex(key, ttl, value);
}
async function isUnmatchedUsers() {
  return await redis.llen("unmatchedUsers");
}

async function setUnmatchedUsers(socketId: string) {
  await redis.rpush("unmatchedUsers", socketId);
}
async function popUnmatchedUsers() {
  return await redis.lpop("unmatchedUsers");
}
async function removeUnmatchedUsers(socketId: string) {
  console.log("removing socket ", socketId);
  await redis.lrem("unmatchedUser", 0, socketId);
}

async function setRoomId(socketId: string, roomId: string) {
  console.log("adding room");
  await redis.hset("rooms", socketId, roomId);
}

async function getRoomId(socketId: string) {
  console.log("log getting room id");
  const roomId = await redis.hget("rooms", socketId);
  return roomId;
}

async function delRoomId(socketId: string) {
  console.log("del room id");
  await redis.hdel("rooms", socketId);
}

export {
  get,
  del,
  setEx,
  isUnmatchedUsers,
  setUnmatchedUsers,
  popUnmatchedUsers,
  removeUnmatchedUsers,
  setRoomId,
  getRoomId,
  delRoomId,
};
