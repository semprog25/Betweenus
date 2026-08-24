import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './info'
import { EDGE_FUNCTION_BASE } from '../../config/site'
import { isNativeMobile } from '../platform'

const SESSION_KEY = 'between_us_session'

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (!supabaseClient) {
    const supabaseUrl = `https://${projectId}.supabase.co`
    const native = isNativeMobile()
    supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: !native,
      },
    })
  }
  return supabaseClient
}

function getAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_KEY)
}

function getRequestAuthHeaders(): Record<string, string> {
  const accessToken = getAccessTokenFromStorage()
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` }
  }
  return { Authorization: `Bearer ${publicAnonKey}` }
}

export async function callServer(path: string, options: RequestInit = {}) {
  const url = `${EDGE_FUNCTION_BASE}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getRequestAuthHeaders(),
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const expectedErrorCodes = ['EMAIL_EXISTS', 'INVALID_CREDENTIALS', 'PAYMENT_REQUIRED']
    const isExpectedError = data?.code && expectedErrorCodes.includes(data.code)
    const isProfileGetRequest = path === '/auth/profile' && options.method === 'GET'

    if (!isExpectedError && !isProfileGetRequest) {
      console.error(`Server error on ${path}:`, data)
    }

    return { success: false, ...data }
  }

  return { success: true, ...data }
}
