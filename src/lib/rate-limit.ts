import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'rivryn-agent',
})

const projectRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'rivryn-project',
})

const fileRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'rivryn-file',
})

const settingsRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: 'rivryn-settings',
})

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
    let result
    switch (type) {
      case 'agent':
        result = await ratelimit.limit(identifier)
        break
      case 'project':
        result = await projectRatelimit.limit(identifier)
        break
      case 'file':
        result = await fileRatelimit.limit(identifier)
        break
      case 'settings':
        result = await settingsRatelimit.limit(identifier)
        break
      default:
        result = await ratelimit.limit(identifier)
    }

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
