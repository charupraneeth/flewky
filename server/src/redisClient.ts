import Redis from "ioredis";
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

export { get, setEx };
