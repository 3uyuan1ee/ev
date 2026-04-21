import { ref } from 'vue'

// TODO: Replace with your actual Workers API URL after deployment
const API_BASE = 'https://ev-api.1481059602.workers.dev/api/v1'

const STORAGE_KEY = 'ev-session-id'

function getSessionId() {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function useAnalytics() {
  const sessionId = ref(getSessionId())

  async function registerSession() {
    const sid = sessionId.value
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
    const sid = sessionId.value
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
