export interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  jitter?: boolean
  retryOn?: (number | string)[]
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryOn: [408, 429, 500, 502, 503, 504],
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      const statusCode = getStatusCode(error as unknown)
      const shouldRetry = 
        statusCode !== 0 && opts.retryOn?.includes(statusCode) ||
        (statusCode === 0 && !isNetworkError(lastError))
      
      if (!shouldRetry || attempt === opts.maxAttempts) {
        throw lastError
      }
      
      const delay = calculateDelay(attempt, opts)
      
      await sleep(delay)
    }
  }
  
  throw lastError
}

export async function retryWithCondition<T>(
  fn: () => Promise<{ value: T; shouldRetry: boolean }>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let attempts = 0
  
  while (attempts < opts.maxAttempts) {
    const result = await fn()
    
    if (!result.shouldRetry) {
      return result.value
    }
    
    attempts++
    
    if (attempts >= opts.maxAttempts) {
      throw new Error('Max retry attempts exceeded')
    }
    
    const delay = calculateDelay(attempts, opts)
    await sleep(delay)
  }
  
  throw new Error('Max retry attempts exceeded')
}

function calculateDelay(attempt: number, opts: Required<RetryOptions>): number {
  let delay = opts.baseDelay * Math.pow(opts.backoffMultiplier, attempt - 1)
  
  delay = Math.min(delay, opts.maxDelay)
  
  if (opts.jitter) {
    const jitterAmount = delay * 0.3
    delay = delay - jitterAmount + Math.random() * jitterAmount * 2
  }
  
  return Math.floor(delay)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getStatusCode(error: unknown): number {
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; statusCode?: number; code?: number | string }
    if (typeof err.status === 'number') return err.status
    if (typeof err.statusCode === 'number') return err.statusCode
    if (err.code === 'ECONNREFUSED') return 0
    if (err.code === 'ETIMEDOUT') return 0
  }
  return 0
}

function isNetworkError(error: Error): boolean {
  const networkErrors = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    'EPIPE',
    'ECONNRESET',
  ]
  
  return networkErrors.some(ne => error.message.includes(ne))
}

export function createRetryableFetch(
  options: RetryOptions = {}
): typeof fetch {
  return async (input, init) => {
    return withRetry(async () => {
      const response = await fetch(input, init)
      
      if (typeof response.status === 'number' && options.retryOn?.includes(response.status)) {
        const error = new Error(`HTTP ${response.status}`)
        ;(error as Error & { status?: number }).status = response.status
        throw error
      }
      
      return response
    }, options)
  }
}

interface SupabaseError {
  message?: string
  code?: string
}

interface SupabaseResult<T> {
  data: T | null
  error: SupabaseError | null
}

export async function retrySupabaseQuery<T>(
  query: () => Promise<SupabaseResult<T>>,
  options: RetryOptions = {}
): Promise<T> {
  return withRetry(async () => {
    const result = await query()
    
    if (result.error) {
      const error = new Error(result.error.message || 'Supabase error')
      throw error
    }
    
    if (!result.data) {
      throw new Error('No data returned')
    }
    
    return result.data
  }, options)
}
