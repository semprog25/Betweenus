/**
 * Authentication Service for Between Us
 * Handles email/password, Google, and Apple sign-in
 */

import { Browser } from '@capacitor/browser';
import { createClient } from './supabase/client';
import { callServer } from './supabase/client';
import { getOAuthRedirectUrl } from '../config/site';
import { isNativeMobile } from './platform';

// Types
export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    languages?: string[];
    avatar_url?: string;
    about?: string;
    public_username?: string;
  };
}

export interface AuthSession {
  access_token: string;
  user: User;
}

export type PendingAuthActionType = 'me_too' | 'reply' | 'save' | 'spill' | 'generic'

export interface PendingAuthAction {
  type: PendingAuthActionType
  postId?: string
  createdAt: number
}

// Storage keys
const SESSION_KEY = 'between_us_session';
const USER_KEY = 'between_us_user';
const PENDING_AUTH_ACTION_KEY = 'between_us_pending_auth_action';

// ==================== EMAIL/PASSWORD AUTH ====================

export async function signUpWithEmail(
  email: string, 
  password: string, 
  name?: string,
  languages?: string[]
) {
  const response = await callServer('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, languages }),
  });

  if (response.access_token && response.user) {
    // Store session
    saveSession(response.access_token, response.user);
  }

  return response;
}

export async function signInWithEmail(email: string, password: string) {
  const response = await callServer('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.access_token && response.user) {
    // Store session
    saveSession(response.access_token, response.user);
  }

  return response;
}

// ==================== PENDING AUTH ACTIONS (return-to-action) ====================

export function setPendingAuthAction(action: Omit<PendingAuthAction, 'createdAt'> & { createdAt?: number }) {
  if (typeof window === 'undefined') return
  try {
    // Never persist client-controlled identity fields — JWT is authoritative after login
    const payload: PendingAuthAction = {
      type: action.type,
      postId: action.postId,
      createdAt: action.createdAt ?? Date.now(),
    }
    localStorage.setItem(PENDING_AUTH_ACTION_KEY, JSON.stringify(payload))
  } catch (error) {
    console.warn('Could not persist pending auth action', error)
  }
}

export function peekPendingAuthAction(): PendingAuthAction | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PENDING_AUTH_ACTION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingAuthAction & Record<string, unknown>
    if (!parsed || typeof parsed.type !== 'string') return null
    return {
      type: parsed.type as PendingAuthAction['type'],
      postId: typeof parsed.postId === 'string' ? parsed.postId : undefined,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
    }
  } catch {
    return null
  }
}

export function consumePendingAuthAction(): PendingAuthAction | null {
  const pending = peekPendingAuthAction()
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PENDING_AUTH_ACTION_KEY)
  }
  return pending
}

// ==================== SOCIAL AUTH (GOOGLE, APPLE) ====================

async function startOAuthProvider(
  provider: 'google' | 'apple',
  queryParams?: Record<string, string>,
) {
  const supabase = createClient()
  const redirectTo = getOAuthRedirectUrl()
  const native = isNativeMobile()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: native,
      ...(queryParams ? { queryParams } : {}),
    },
  })

  if (error) throw error

  if (native) {
    if (!data.url) {
      throw new Error('OAuth URL missing — check Supabase provider configuration')
    }
    await Browser.open({ url: data.url, windowName: '_self' })
  }

  return data
}

export async function signInWithGoogle() {
  try {
    // Note: Configure Google OAuth in Supabase Dashboard + redirect URLs
    return await startOAuthProvider('google', {
      access_type: 'offline',
      prompt: 'consent',
    })
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

export async function signInWithApple() {
  try {
    // Note: Apple Sign In still requires Apple Developer Console + Supabase provider setup
    return await startOAuthProvider('apple')
  } catch (error) {
    console.error('Apple sign-in error:', error)
    throw error
  }
}

// ==================== SESSION MANAGEMENT ====================

// Helper function to clean up localStorage if needed
function cleanupLocalStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    // Remove any non-essential data
    const keysToKeep = [SESSION_KEY, USER_KEY, 'between_us_onboarding_complete', 'between_us_language', 'between_us_selected_languages'];
    const allKeys = Object.keys(localStorage);
    
    for (const key of allKeys) {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error cleaning localStorage:', error);
  }
}

export function saveSession(accessToken: string, user: User) {
  if (typeof window !== 'undefined') {
    try {
      // Only store essential user data to avoid quota issues
      const minimalUser = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      };
      
      localStorage.setItem(SESSION_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(minimalUser));
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
      
      // If quota exceeded, try to clear old data and retry
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.log('Quota exceeded. Cleaning up localStorage and retrying...');
        
        // Clean up non-essential data first
        cleanupLocalStorage();
        
        try {
          // Store only critical user data
          const minimalUser = {
            id: user.id,
            email: user.email,
            user_metadata: {
              name: user.user_metadata?.name,
              avatar_url: user.user_metadata?.avatar_url,
            },
          };
          
          localStorage.setItem(SESSION_KEY, accessToken);
          localStorage.setItem(USER_KEY, JSON.stringify(minimalUser));
          console.log('Session saved successfully after cleanup');
        } catch (retryError) {
          console.error('Failed to save session after cleanup:', retryError);
          // Continue without localStorage - session will be memory-only
          // Store in memory as fallback
          if (typeof window !== 'undefined') {
            (window as any).__betweenUsSession = { accessToken, user };
          }
        }
      }
    }
  }
}

export function getSession(): { accessToken: string; user: User } | null {
  if (typeof window === 'undefined') return null;
  
  // Try localStorage first
  try {
    const accessToken = localStorage.getItem(SESSION_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    
    if (accessToken && userStr) {
      const user = JSON.parse(userStr);
      return { accessToken, user };
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  
  // Fallback to memory storage if localStorage failed
  const memorySession = (window as any).__betweenUsSession;
  if (memorySession) {
    return memorySession;
  }
  
  return null;
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear memory fallback as well
    delete (window as any).__betweenUsSession;
  }
}

export async function signOut() {
  try {
    const session = getSession();
    
    if (session) {
      // Save user data before logging out
      try {
        await saveUserDataBeforeLogout(session.user.id);
      } catch (saveError) {
        console.error('Error saving user data before logout:', saveError);
        // Continue with logout even if save fails
      }

      await callServer('/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
    }

    try {
      await createClient().auth.signOut()
    } catch {
      // ignore supabase signOut failures — custom session still cleared
    }

    clearSession();
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    // Clear session anyway
    clearSession();
    throw error;
  }
}

// ==================== SAVE DATA BEFORE LOGOUT ====================

async function saveUserDataBeforeLogout(userId: string) {
  try {
    // Save logout timestamp and session data
    await callServer('/auth/save-logout-data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getSession()?.accessToken}`,
      },
      body: JSON.stringify({
        userId,
        logoutTimestamp: new Date().toISOString(),
        sessionData: {
          lastActivity: localStorage.getItem('between_us_last_activity'),
          totalSessionTime: localStorage.getItem('between_us_session_time'),
        }
      }),
    });
  } catch (error) {
    console.error('Error saving logout data:', error);
    throw error;
  }
}

// ==================== USER INFO ====================

export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = getSession();
    
    if (!session) return null;

    const response = await callServer('/auth/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    return response.user || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

export async function checkSession(): Promise<boolean> {
  try {
    const session = getSession();
    
    if (!session) return false;

    const response = await callServer('/auth/session', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    return response.valid === true;
  } catch (error) {
    console.error('Session check error:', error);
    return false;
  }
}

// ==================== PROFILE MANAGEMENT ====================

export async function getUserProfile() {
  try {
    const session = getSession();
    
    if (!session || !session.accessToken) {
      // Silent return - no session is expected for anonymous users
      return null;
    }

    console.log('getUserProfile: Fetching profile from server');

    const response = await callServer('/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (response.success && response.user) {
      console.log('getUserProfile: Profile fetched successfully');
      // Update stored user data with fresh data from server
      saveSession(session.accessToken, response.user);
      return response.user;
    }

    // Silent return - server errors are expected when endpoint doesn't exist
    // or user is in anonymous mode
    return null;
  } catch (error: any) {
    // Silent return - errors are expected in anonymous mode or when server is unavailable
    return null;
  }
}

export async function updateProfile(updates: {
  name?: string;
  languages?: string[];
  avatar_url?: string;
  about?: string;
  public_username?: string;
}) {
  try {
    const session = getSession();
    
    if (!session) {
      console.log('updateProfile: No session found');
      throw new Error('Not authenticated');
    }

    if (!session.accessToken) {
      console.log('updateProfile: Session exists but no access token');
      throw new Error('Not authenticated');
    }

    console.log('updateProfile: Calling server with updates:', Object.keys(updates));

    const response = await callServer('/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (response.success && response.user) {
      // Update stored user data
      console.log('updateProfile: Server update successful');
      saveSession(session.accessToken, response.user);
      return response.user;
    }

    const errorMessage = response.error || 'Failed to update profile';
    console.error('updateProfile: Server returned error:', errorMessage, response);
    throw new Error(errorMessage);
  } catch (error: any) {
    console.error('updateProfile error:', error.message || error);
    throw error;
  }
}

export async function deleteAccount() {
  try {
    const session = getSession();

    if (!session?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await callServer('/auth/delete-account', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (response.success) {
      clearSession();
      return { success: true };
    }

    throw new Error(response.error || 'Failed to delete account');
  } catch (error) {
    console.error('Delete account error:', error);
    throw error;
  }
}

// ==================== OAUTH CALLBACK HANDLER ====================

async function persistOAuthSession(session: { access_token: string; user: User }) {
  saveSession(session.access_token, session.user as User)

  try {
    await callServer('/auth/send-welcome-email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }

  return session
}

/**
 * Process an OAuth return URL from Capacitor appUrlOpen (PKCE code or hash tokens).
 */
export async function processAuthCallbackUrl(url: string) {
  try {
    const supabase = createClient()
    const parsed = new URL(url)
    const code = parsed.searchParams.get('code')
    const oauthError = parsed.searchParams.get('error_description') || parsed.searchParams.get('error')

    if (oauthError) {
      console.error('OAuth provider error:', oauthError)
      return null
    }

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('OAuth code exchange failed:', error)
        return null
      }
      if (data.session) {
        return persistOAuthSession(data.session as { access_token: string; user: User })
      }
      return null
    }

    // Hash-token fallback (implicit) if present in deep link
    if (url.includes('access_token=')) {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error('OAuth session parse failed:', error)
        return null
      }
      if (data.session) {
        return persistOAuthSession(data.session as { access_token: string; user: User })
      }
    }

    return null
  } catch (error) {
    console.error('OAuth deep-link callback error:', error)
    return null
  }
}

export async function handleOAuthCallback() {
  try {
    const supabase = createClient()

    // Web: PKCE/code in query, or hash tokens via detectSessionInUrl
    if (typeof window !== 'undefined' && !isNativeMobile()) {
      const params = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const code = params.get('code') || hashParams.get('code')
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session) {
          const session = await persistOAuthSession(data.session as { access_token: string; user: User })
          const cleanUrl = `${window.location.origin}${window.location.pathname}`
          window.history.replaceState({}, '', cleanUrl)
          return session
        }
      }
    }

    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('OAuth callback error:', error)
      return null
    }

    if (session) {
      return persistOAuthSession(session as { access_token: string; user: User })
    }

    return null
  } catch (error) {
    console.error('OAuth callback error:', error)
    return null
  }
}