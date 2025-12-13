/**
 * Authentication Service for Between Us
 * Handles email/password, Google, and Apple sign-in
 */

import { createClient } from './supabase/client';
import { callServer } from './supabase/client';
import { agentLog } from './agentLog';

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

// Storage keys
const SESSION_KEY = 'between_us_session';
const USER_KEY = 'between_us_user';

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

// ==================== SOCIAL AUTH (GOOGLE, APPLE) ====================

export async function signInWithGoogle() {
  try {
    const supabase = createClient();
    
    // Note: You MUST configure Google OAuth in Supabase Dashboard first!
    // Follow: https://supabase.com/docs/guides/auth/social-login/auth-google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function signInWithApple() {
  try {
    const supabase = createClient();
    
    // Note: You MUST configure Apple OAuth in Supabase Dashboard first!
    // Follow: https://supabase.com/docs/guides/auth/social-login/auth-apple
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Apple sign-in error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Apple sign-in error:', error);
    throw error;
  }
}

// ==================== SESSION MANAGEMENT ====================

// Helper function to clean up localStorage if needed
function cleanupLocalStorage() {
  if (typeof window === 'undefined') return;
  
  try {
    // Remove any non-essential data
    const keysToKeep = [SESSION_KEY, USER_KEY, 'between_us_onboarding_complete', 'between_us_language'];
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
    // #region agent log
    agentLog({
      hypothesisId:'H1',
      location:'src/utils/auth.tsx:getSession',
      message:'getSession failed to read from localStorage',
      data:{errorMessage: (error as any)?.message ?? 'unknown'},
    });
    // #endregion
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
    // #region agent log
    agentLog({
      hypothesisId:'H3',
      location:'src/utils/auth.tsx:getUserProfile:before',
      message:'Attempting to fetch profile',
      data:{hasSession:true, userId:session.user.id},
    });
    // #endregion

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
      // #region agent log
      agentLog({
        hypothesisId:'H3',
        location:'src/utils/auth.tsx:getUserProfile:after',
        message:'Profile fetch succeeded',
        data:{userId:response.user.id},
      });
      // #endregion
      return response.user;
    }

    // Silent return - server errors are expected when endpoint doesn't exist
    // or user is in anonymous mode
    return null;
  } catch (error: any) {
    // Silent return - errors are expected in anonymous mode or when server is unavailable
    // #region agent log
    agentLog({
      hypothesisId:'H3',
      location:'src/utils/auth.tsx:getUserProfile:error',
      message:'Profile fetch failed',
      data:{errorMessage:error?.message ?? 'unknown'},
    });
    // #endregion
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
    // #region agent log
    agentLog({
      hypothesisId:'H4',
      location:'src/utils/auth.tsx:updateProfile:before',
      message:'Updating profile',
      data:{userId:session.user.id, updateKeys:Object.keys(updates)},
    });
    // #endregion

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
      // #region agent log
      agentLog({
        hypothesisId:'H4',
        location:'src/utils/auth.tsx:updateProfile:after',
        message:'Profile update succeeded',
        data:{userId:response.user.id},
      });
      // #endregion
      return response.user;
    }

    const errorMessage = response.error || 'Failed to update profile';
    console.error('updateProfile: Server returned error:', errorMessage, response);
    throw new Error(errorMessage);
  } catch (error: any) {
    console.error('updateProfile error:', error.message || error);
    // #region agent log
    agentLog({
      hypothesisId:'H4',
      location:'src/utils/auth.tsx:updateProfile:error',
      message:'Profile update failed',
      data:{errorMessage:error?.message ?? 'unknown'},
    });
    // #endregion
    throw error;
  }
}

// ==================== OAUTH CALLBACK HANDLER ====================

export async function handleOAuthCallback() {
  try {
    const supabase = createClient();
    
    // Check if we have a session from OAuth redirect
    const { data: { session }, error } = await supabase.auth.getSession();
    // #region agent log
    agentLog({
      hypothesisId:'H2',
      location:'src/utils/auth.tsx:handleOAuthCallback:sessionCheck',
      message:'OAuth callback session check',
      data:{hasSession:!!session, hasError:!!error, userId:session?.user?.id ?? null},
    });
    // #endregion
    
    if (error) {
      console.error('OAuth callback error:', error);
      return null;
    }

    if (session) {
      // Save session
      saveSession(session.access_token, session.user as User);
      
      // Send welcome email for OAuth users
      try {
        await callServer('/auth/send-welcome-email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
      } catch (error) {
        console.error('Failed to send welcome email:', error);
        // Don't fail the OAuth flow if email fails
      }
      
      return session;
    }

    return null;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return null;
  }
}