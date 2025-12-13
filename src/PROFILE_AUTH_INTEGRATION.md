# Adding Auth to Profile Tab

Quick guide to show user info and sign-out button in ProfileTab.

## Update ProfileTab.tsx

Add this code to your ProfileTab component:

### 1. Add imports at the top:

```tsx
import { getSession, signOut, getCurrentUser } from '../utils/auth';
import { useState, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
```

### 2. Add state for user:

```tsx
const [userSession, setUserSession] = useState(getSession());
const [isSigningOut, setIsSigningOut] = useState(false);

// Refresh session on mount
useEffect(() => {
  setUserSession(getSession());
}, []);
```

### 3. Add sign-out handler:

```tsx
const handleSignOut = async () => {
  if (!confirm('Are you sure you want to sign out?')) {
    return;
  }

  setIsSigningOut(true);
  try {
    await signOut();
    toast.success('Signed out successfully');
    setUserSession(null);
    
    // Optionally: Reset onboarding to show sign-in again
    // localStorage.removeItem('hasCompletedOnboarding');
    // window.location.reload();
  } catch (error) {
    console.error('Sign out error:', error);
    toast.error('Failed to sign out');
  } finally {
    setIsSigningOut(false);
  }
};
```

### 4. Add UI in your profile section:

```tsx
{/* User Account Section - Add this near the top of ProfileTab */}
{userSession ? (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {userSession.user.user_metadata?.name || 'Friend'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {userSession.user.email}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {userSession.user.user_metadata?.languages?.map((lang: string) => (
            <span
              key={lang}
              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md text-xs"
            >
              {lang.toUpperCase()}
            </span>
          ))}
        </div>
      </div>
      
      <Button
        onClick={handleSignOut}
        disabled={isSigningOut}
        variant="outline"
        size="sm"
        className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        {isSigningOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </>
        )}
      </Button>
    </div>
  </div>
) : (
  <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-2xl p-6 mb-6 border border-purple-200 dark:border-purple-700">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
        <UserIcon className="w-8 h-8 text-white" />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
        Using Anonymously
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Create an account to save your progress and access from any device
      </p>
      <Button
        onClick={() => {
          localStorage.removeItem('hasCompletedOnboarding');
          window.location.reload();
        }}
        className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90 text-white"
      >
        Create Account
      </Button>
    </div>
  </div>
)}
```

---

## Complete Example

Here's a complete example of how your ProfileTab might look:

```tsx
import { useState, useEffect } from 'react';
import { getSession, signOut } from '../utils/auth';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { LogOut, User as UserIcon, Loader2, Settings, HelpCircle, Shield, FileText } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export function ProfileTab() {
  const { t } = useLanguage();
  const [userSession, setUserSession] = useState(getSession());
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setUserSession(getSession());
  }, []);

  const handleSignOut = async () => {
    if (!confirm(t('profile.confirmSignOut') || 'Are you sure you want to sign out?')) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOut();
      toast.success(t('profile.signedOut') || 'Signed out successfully');
      setUserSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t('profile.signOutError') || 'Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Account Status */}
      {userSession ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {userSession.user.user_metadata?.name || 'Friend'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {userSession.user.email}
                  </p>
                </div>
              </div>
              
              {userSession.user.user_metadata?.languages && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {userSession.user.user_metadata.languages.map((lang: string) => (
                    <span
                      key={lang}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md text-xs"
                    >
                      {lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {isSigningOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-700">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Using Anonymously
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create an account to save your progress and access from any device
            </p>
            <Button
              onClick={() => {
                localStorage.removeItem('hasCompletedOnboarding');
                window.location.reload();
              }}
              className="bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:opacity-90 text-white"
            >
              Create Account
            </Button>
          </div>
        </div>
      )}

      {/* Rest of your profile content... */}
      {/* Stats, settings, etc. */}
    </div>
  );
}
```

---

## Translation Keys to Add

Add these to your `LanguageContext.tsx`:

```tsx
'profile.confirmSignOut': 'Are you sure you want to sign out?',
'profile.signedOut': 'Signed out successfully',
'profile.signOutError': 'Failed to sign out',
'profile.usingAnonymously': 'Using Anonymously',
'profile.createAccountPrompt': 'Create an account to save your progress and access from any device',
'profile.createAccount': 'Create Account',
'profile.signedInAs': 'Signed in as',
```

---

## Result

Your profile tab will now show:

**If Signed In:**
- User avatar (gradient circle)
- User name
- User email
- Language badges
- Sign Out button

**If Anonymous:**
- Prompt to create account
- "Create Account" button
- Explains benefits of creating account

Clean, simple, and functional! 🎉
