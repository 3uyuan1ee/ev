import { useStorage } from '@vueuse/core'

// TODO: Replace with your actual Workers API URL after deployment
const API_BASE = 'https://ev-api.1481059602.workers.dev/api/v1'

const sessionId = useStorage('ev-session-id', '')

function ensureSessionId() {
  if (!sessionId.value) {
    sessionId.value = crypto.randomUUID()
  }
  return sessionId.value
}

export function useAnalytics() {
  async function registerSession() {
    const sid = ensureSessionId()
    try {
      await fetch(`${API_BASE}/analytics/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          screenResolution: `${screen.width}x${screen.height}`,
          language: navigator.language,
          theme: document.documentElement.getAttribute('data-theme') || 'light',
        }),
      })
    } catch {
      // Silent fail — analytics should never break the site
    }
  }

  async function trackPageview(page) {
    const sid = ensureSessionId()
    try {
      await fetch(`${API_BASE}/analytics/pageview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, page }),
      })
    } catch {
      // Silent fail
    }
  }

  return { registerSession, trackPageview, sessionId }
}
