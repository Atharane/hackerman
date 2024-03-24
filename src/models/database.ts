import { Redis } from "@upstash/redis"

export const redis = new Redis({
  url: "https://apn1-pro-piranha-34850.upstash.io",
  token: process.env.PLASMO_PUBLIC_REDIS_SECRET_TOKEN // shoulb be private, can't seem to figure it out :(
})
