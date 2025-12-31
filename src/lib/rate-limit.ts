import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

let redisInstance: Redis | null = null
let ratelimitInstance: Ratelimit | null = null
let projectRatelimitInstance: Ratelimit | null = null
let fileRatelimitInstance: Ratelimit | null = null
let settingsRatelimitInstance: Ratelimit | null = null

function getRedis(): Redis {
  if (!redisInstance) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis environment variables not configured')
    }
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redisInstance
}

function getRatelimit(type: 'agent' | 'project' | 'file' | 'settings'): Ratelimit {
  const redis = getRedis()
  
  switch (type) {
    case 'agent':
      if (!ratelimitInstance) {
        ratelimitInstance = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(10, '1 m'),
          analytics: true,
          prefix: 'rivryn-agent',
        })
      }
      return ratelimitInstance
    case 'project':
      if (!projectRatelimitInstance) {
        projectRatelimitInstance = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, '1 m'),
          analytics: true,
          prefix: 'rivryn-project',
        })
      }
      return projectRatelimitInstance
    case 'file':
      if (!fileRatelimitInstance) {
        fileRatelimitInstance = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(60, '1 m'),
          analytics: true,
          prefix: 'rivryn-file',
        })
      }
      return fileRatelimitInstance
    case 'settings':
      if (!settingsRatelimitInstance) {
        settingsRatelimitInstance = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(30, '1 m'),
          analytics: true,
          prefix: 'rivryn-settings',
        })
      }
      return settingsRatelimitInstance
  }
}

export type RateLimitType = 'agent' | 'project' | 'file' | 'settings'

export interface RateLimitResult {
  success: boolean
  remaining?: number
  reset?: number
  limit: number
  window: string
}

export async function checkRateLimit(
  userId: string,
  type: RateLimitType = 'agent'
): Promise<RateLimitResult> {
  const identifier = `user:${userId}:${type}`

  try {
    const ratelimit = getRatelimit(type)
    const result = await ratelimit.limit(identifier)

    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
      limit: 10,
      window: '1 minute',
    }
  } catch {
    return {
      success: false,
      limit: 10,
      window: '1 minute',
    }
  }
}

export function createRateLimitResponse(result: RateLimitResult) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    retryAfter: result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60,
    limit: result.limit,
    window: result.window,
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60),
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining ?? 0),
      'X-RateLimit-Reset': String(result.reset ?? Date.now() + 60000),
    },
  })
}

export async function rateLimitMiddleware(
  request: Request,
  userId: string,
  type: RateLimitType
): Promise<Response | null> {
  const result = await checkRateLimit(userId, type)
  
  if (!result.success) {
    return createRateLimitResponse(result)
  }
  
  return null
}

export function getIPAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}
