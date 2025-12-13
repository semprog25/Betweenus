import { projectId, publicAnonKey } from './supabase/info';

/**
 * Developer tool to remove all public usernames from user profiles
 * This makes all users anonymous by clearing their public_username field
 */
export async function makeUsernamesAnonymous() {
  try {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-6c9b0e48`;
    
    console.log('Calling clear usernames endpoint:', `${baseUrl}/admin/clear-all-usernames`);
    
    // Call backend to clear all usernames
    const response = await fetch(`${baseUrl}/admin/clear-all-usernames`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Success response:', data);
    
    return {
      success: true,
      message: `✅ ${data.count || 0} usernames cleared - All users are now anonymous`,
      count: data.count || 0
    };
  } catch (error) {
    console.error('Error clearing usernames:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to clear usernames',
      error
    };
  }
}