import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

export async function getSecret(keyName) {
  return await redis.get(keyName);
}

export async function saveSecret(keyName, value) {
  return await redis.set(keyName, value);
}

export async function deleteSecret(keyName) {
  return await redis.del(keyName);
}
