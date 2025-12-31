const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY
const SENTRY_DSN = process.env.SENTRY_DSN

interface TelemetryEvent {
  event: string
  properties?: Record<string, unknown>
  timestamp?: Date
}

interface SentryContext {
  user?: {
    id: string
    email?: string
  }
  extra?: Record<string, unknown>
  tags?: Record<string, string>
}

let posthogQueue: TelemetryEvent[] = []
let flushInterval: ReturnType<typeof setInterval> | null = null

const FLUSH_INTERVAL = 5000
const MAX_QUEUE_SIZE = 100

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!POSTHOG_API_KEY) {
    console.log('[Telemetry]', event, properties)
    return
  }

  const telemetryEvent: TelemetryEvent = {
    event,
    properties: {
      ...properties,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date(),
  }

  posthogQueue.push(telemetryEvent)

  if (posthogQueue.length >= MAX_QUEUE_SIZE) {
    flushPosthog()
  } else if (!flushInterval) {
    flushInterval = setInterval(flushPosthog, FLUSH_INTERVAL)
  }
}

async function flushPosthog(): Promise<void> {
  if (posthogQueue.length === 0 || !POSTHOG_API_KEY) {
    return
  }

  const events = [...posthogQueue]
  posthogQueue = []

  try {
    await fetch('https://app.posthog.com/batch/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        batch: events.map(e => ({
          event: e.event,
          properties: e.properties,
          timestamp: e.timestamp?.toISOString(),
          distinct_id: e.properties?.userId || 'anonymous',
        })),
      }),
    })
  } catch {
    console.error('[Telemetry] Failed to send events')
  }
}

export function captureException(
  error: Error,
  context?: SentryContext
): void {
  if (!SENTRY_DSN) {
    console.error('[Sentry]', error, context)
    return
  }

  const eventId = generateEventId()

  const payload = {
    event_id: eventId,
    timestamp: new Date().toISOString(),
    level: 'error',
    exception: {
      values: [
        {
          type: error.constructor.name,
          value: error.message,
          stacktrace: {
            frames: parseStackTrace(error),
          },
        },
      ],
    },
    context: {
      user: context?.user,
      extra: context?.extra,
      tags: context?.tags,
    },
  }

  sendToSentry(payload)
}

async function sendToSentry(payload: unknown): Promise<void> {
  if (!SENTRY_DSN) return
  
  try {
    const projectId = extractProjectId(SENTRY_DSN)
    
    await fetch(`https://${projectId}.ingest.sentry.io/api/${projectId}/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    console.error('[Sentry] Failed to send error')
  }
}

function generateEventId(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

function extractProjectId(dsn: string): string {
  const match = dsn.match(/@([^.]+)\.sentry\.io/)
  return match ? match[1] : 'unknown'
}

function parseStackTrace(error: Error): Array<{ filename: string; function: string; lineno: number }> {
  if (!error.stack) {
    return []
  }

  return error.stack
    .split('\n')
    .slice(1)
    .map(line => {
      const match = line.match(/at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):\d+\)?/)
      if (match) {
        return {
          function: match[1] || 'anonymous',
          filename: match[2],
          lineno: parseInt(match[3], 10),
        }
      }
      return {
        function: 'unknown',
        filename: 'unknown',
        lineno: 0,
      }
    })
    .slice(0, 10)
}

export function setUserContext(userId: string, email?: string): void {
  trackEvent('$set', {
    $user_id: userId,
    $email: email,
  })
}

export function flushTelemetry(): Promise<void> {
  return flushPosthog()
}

export const events = {
  projectCreated: (props: { template: string; name: string; userId: string }) => {
    trackEvent('project_created', props)
  },
  
  fileCreated: (props: { projectId: string; path: string; userId: string }) => {
    trackEvent('file_created', props)
  },
  
  fileUpdated: (props: { projectId: string; path: string; userId: string }) => {
    trackEvent('file_updated', props)
  },
  
  fileDeleted: (props: { projectId: string; path: string; userId: string }) => {
    trackEvent('file_deleted', props)
  },
  
  agentRequest: (props: {
    projectId: string
    provider: string
    success: boolean
    duration: number
    userId: string
  }) => {
    trackEvent('agent_request', props)
  },
  
  testRun: (props: {
    projectId: string
    command: string
    success: boolean
    duration: number
    userId: string
  }) => {
    trackEvent('test_run', props)
  },
  
  qualityGateResult: (props: {
    projectId: string
    passed: boolean
    metrics: Record<string, number>
    userId: string
  }) => {
    trackEvent('quality_gate_result', props)
  },
  
  userSignedIn: (props: { userId: string; method: string }) => {
    trackEvent('user_signed_in', props)
  },
  
  userSignedOut: (props: { userId: string }) => {
    trackEvent('user_signed_out', props)
  },
  
  settingsUpdated: (props: { userId: string; provider: string }) => {
    trackEvent('settings_updated', props)
  },
}
