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

export {
  get,
  setEx,
  isUnmatchedUsers,
  setUnmatchedUsers,
  popUnmatchedUsers,
  removeUnmatchedUsers,
};
