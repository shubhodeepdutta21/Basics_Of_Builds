import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Result= {ok: true} | {ok: false; retryAfterSec: number};

const redisUrl= process.env.BOB_KV_REST_API_URL;
const redisToken= process.env.BOB_KV_REST_API_TOKEN;
const redis= redisUrl && redisToken ? new Redis({url: redisUrl, token: redisToken}) : null;

const limiters= new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;

  const id = `${limit}:${windowMs}`;
  let rl = limiters.get(id);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(limit, `${Math.round(windowMs / 1000)} s` as `${number} s`),
      prefix: `bob:rl:${id}`,
    });
    limiters.set(id, rl);
  }
  return rl;
}

type Entry= {count: number; resetAt: number};
const g= globalThis as unknown as {__bobRateLimit?: Map<string, Entry>};
const memStore= (g.__bobRateLimit ??= new Map<string, Entry>());

function memoryLimit(key: string, limit: number, windowMs: number): Result {
  const now = Date.now();

  if (memStore.size > 1000) {
    for (const [k, v] of memStore) if (v.resetAt <= now) memStore.delete(k);
  }

  const entry = memStore.get(key);
  if (!entry || entry.resetAt <= now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<Result> {
    const limiter = getLimiter(limit, windowMs);

  if (limiter) {
    try {
      const { success, reset } = await limiter.limit(key);
      if (success) return { ok: true };
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
    } catch (err) {
      // Redis hiccup: degrade to the per-instance limiter rather than failing the request
      console.error("Redis rate limit failed, falling back to memory:", err);
    }
  }

  return memoryLimit(key, limit, windowMs);
}

export function tooManyRequests(retryAfterSec: number) {
    return NextResponse.json(
        {error: `Too many requests. Please wait ${retryAfterSec}s and try again.`},
        {status: 429, headers: {"Retry-After": String(retryAfterSec)}}
    );
}