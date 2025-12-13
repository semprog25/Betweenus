import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client for frontend
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseClient) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey);
  }
  return supabaseClient;
}

// Helper function to call the backend server
export async function callServer(path: string, options: RequestInit = {}) {
  const url = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48${path}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      ...options.headers,
    },
  });

  // Try to parse JSON response (works for both success and error responses)
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Only log unexpected errors (not expected error codes like EMAIL_EXISTS)
    const expectedErrorCodes = ['EMAIL_EXISTS', 'INVALID_CREDENTIALS'];
    const isExpectedError = data?.code && expectedErrorCodes.includes(data.code);
    
    // Also don't log errors for /auth/profile GET requests (expected to fail in anonymous mode)
    const isProfileGetRequest = path === '/auth/profile' && options.method === 'GET';
    
    if (!isExpectedError && !isProfileGetRequest) {
      console.error(`Server error on ${path}:`, data);
    }
    
    // Return the error data so the caller can handle it
    return { success: false, ...data };
  }

  return { success: true, ...data };
}