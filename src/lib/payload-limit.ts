export const MAX_FILE_SIZE = 1024 * 1024
export const MAX_AGENT_PAYLOAD = 5 * 1024 * 1024
export const MAX_REQUEST_SIZE = 10 * 1024 * 1024

export interface PayloadValidationResult {
  valid: boolean
  error?: string
  size?: number
  limit?: number
}

export function validateFileContent(content: string): PayloadValidationResult {
  const size = new Blob([content]).size
  
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File content exceeds maximum size of ${formatBytes(MAX_FILE_SIZE)}`,
      size,
      limit: MAX_FILE_SIZE,
    }
  }
  
  return { valid: true, size }
}

export function validateAgentPayload(payload: Record<string, unknown>): PayloadValidationResult {
  const content = JSON.stringify(payload)
  const size = new Blob([content]).size
  
  if (size > MAX_AGENT_PAYLOAD) {
    return {
      valid: false,
      error: `Payload exceeds maximum size of ${formatBytes(MAX_AGENT_PAYLOAD)}`,
      size,
      limit: MAX_AGENT_PAYLOAD,
    }
  }
  
  return { valid: true, size }
}

export function validateRequestSize(request: Request): PayloadValidationResult {
  const contentLength = request.headers.get('content-length')
  
  if (!contentLength) {
    return { valid: true }
  }
  
  const size = parseInt(contentLength, 10)
  
  if (isNaN(size)) {
    return { valid: false, error: 'Invalid content-length header' }
  }
  
  if (size > MAX_REQUEST_SIZE) {
    return {
      valid: false,
      error: `Request body exceeds maximum size of ${formatBytes(MAX_REQUEST_SIZE)}`,
      size,
      limit: MAX_REQUEST_SIZE,
    }
  }
  
  return { valid: true, size }
}

export function sanitizeFilePath(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  
  if (normalized.includes('..') || normalized.startsWith('/') || normalized.includes('//')) {
    return ''
  }
  
  const sanitized = normalized.replace(/[^a-zA-Z0-9_./-]/g, '_')
  
  return sanitized
}

export function sanitizeProjectName(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100)
}

export function sanitizeGoal(goal: string): string {
  const cleaned = goal.trim()
  
  if (cleaned.length > 10000) {
    return cleaned.slice(0, 10000)
  }
  
  const dangerousPatterns = [
    /\{.*\}\s*\(.*\)/,
    /\$`[^`]*`/,
    /\$\([^)]*\)/,
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleaned)) {
      return cleaned.replace(pattern, '[sanitized]')
    }
  }
  
  return cleaned
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function createPayloadErrorResponse(result: PayloadValidationResult) {
  return new Response(JSON.stringify({
    error: result.error,
    size: result.size,
    limit: result.limit,
  }), {
    status: 413,
    headers: { 'Content-Type': 'application/json' },
  })
}
