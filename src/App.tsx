import { useState, useEffect, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun, CheckCircle, MessageSquarePlus, Compass, Globe, User, Loader2 } from 'lucide-react';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { Onboarding } from './components/Onboarding';
import { Tutorial } from './components/Tutorial';
import { CheckInTab } from './components/CheckInTab';
import { ProfileTab } from './components/ProfileTab';
import { CommunityTab } from './components/CommunityTab';
import { BottomNavBar } from './components/BottomNavBar';
import { AchievementToast } from './components/AchievementToast';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getSession, getUserProfile, type PendingAuthAction } from './utils/auth';
import { registerDeepLinkHandlers, consumeOpenStoryId } from './utils/deep-links';
import { useAchievementNotifications } from './hooks/useAchievementNotifications';
import { toast } from 'sonner@2.0.3';
import logoImage from './assets/betweenus-logo.png';

const ShareTab = lazy(() => import('./components/ShareTab').then((m) => ({ default: m.ShareTab })));
const DiscoverTab = lazy(() => import('./components/DiscoverTab').then((m) => ({ default: m.DiscoverTab })));

type Tab = 'discover' | 'share' | 'checkin' | 'community' | 'profile';

function AppContent() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    // TEMPORARY: Force onboarding to show for testing - remove this later
    // return false;
    
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('hasCompletedOnboarding') === 'true';
      console.log('Onboarding completed:', completed);
      return completed;
    }
    return false;
  });
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('hasCompletedTutorial') === 'true';
      console.log('Tutorial completed:', completed);
      return completed;
    }
    return false;
  });
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('between_us_selected_languages');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((l: string) => ['en', 'es', 'zh', 'hi', 'de', 'fr'].includes(l))) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Could not load selected languages from storage', e);
      }
    }
    return ['en'];
  });
  const [activeTab, setActiveTab] = useState<Tab>('discover');
  const [userName, setUserName] = useState<string>('Friend');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [showResetButton, setShowResetButton] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const session = getSession();
  const { notifications, dismissNotification } = useAchievementNotifications(session?.user?.id);

  // Check localStorage usage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Estimate localStorage usage
        let totalSize = 0;
        for (const key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
          }
        }
        
        const sizeInMB = totalSize / (1024 * 1024);
        console.log(`localStorage usage: ${sizeInMB.toFixed(2)} MB`);
        
        // If usage is high (> 4MB), clean up non-essential data
        if (sizeInMB > 4) {
          console.log('localStorage usage high, cleaning up...');
          const keysToKeep = [
            'between_us_session',
            'between_us_user',
            'hasCompletedOnboarding',
            'hasCompletedTutorial',
            'between_us_language',
            'between_us_selected_languages'
          ];
          
          const allKeys = Object.keys(localStorage);
          for (const key of allKeys) {
            if (!keysToKeep.includes(key)) {
              localStorage.removeItem(key);
            }
          }
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    import('./ads/admob').then(({ initializeAdMob }) => {
      initializeAdMob().catch(() => {})
    })
  }, [])

  // Check if user is test/skip account to show Reset button
  useEffect(() => {
    const session = getSession();
    if (!session || !session.user) {
      // No session = user skipped authentication
      setShowResetButton(true);
    } else {
      const userEmail = session.user.email || '';
      // Show reset for test accounts (emails containing 'test' or ending with specific test domains)
      const isTestAccount = 
        userEmail.includes('test') || 
        userEmail.includes('demo') ||
        userEmail.endsWith('@test.com') ||
        userEmail.endsWith('@example.com');
      setShowResetButton(isTestAccount);
    }
  }, []);

  // Load user profile data from session
  useEffect(() => {
    const loadUserProfile = async () => {
      const session = getSession();
      if (session?.user) {
        // First, load from session immediately (fast)
        const metadata = session.user.user_metadata;
        if (metadata?.name) setUserName(metadata.name);
        if (metadata?.avatar_url) setProfilePicture(metadata.avatar_url);
        
        // Then fetch fresh data from server (ensures latest data)
        // Only fetch if we have a valid access token
        if (session.accessToken) {
          try {
            console.log('Fetching fresh user profile from server...');
            const freshProfile = await getUserProfile();
            if (freshProfile) {
              console.log('Fresh profile loaded:', freshProfile);
              if (freshProfile.user_metadata?.name) setUserName(freshProfile.user_metadata.name);
              if (freshProfile.user_metadata?.avatar_url) {
                console.log('Setting profile picture:', freshProfile.user_metadata.avatar_url);
                setProfilePicture(freshProfile.user_metadata.avatar_url);
              } else {
                console.log('No avatar_url found in fresh profile');
              }
            }
          } catch (error) {
            console.log('Could not fetch fresh profile, using session data');
            // This is fine - we already have data from session
          }
        }
      } else {
        console.log('No session found - user is in anonymous mode');
      }
    };
    
    loadUserProfile();
  }, []);

  // Handle OAuth callback + native deep links (appUrlOpen)
  useEffect(() => {
    let removeListener: (() => void) | undefined

    const applyAuthenticatedState = (pending: PendingAuthAction | null) => {
      toast.success(t('auth.signedInSuccess'))
      setHasCompletedOnboarding(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasCompletedOnboarding', 'true')
      }
      const session = getSession()
      const metadata = session?.user?.user_metadata
      if (metadata?.name) setUserName(metadata.name)
      if (metadata?.avatar_url) setProfilePicture(metadata.avatar_url)

      // Prepare return-to-action without inventing Phase 3 social features
      if (pending?.type === 'spill') {
        setActiveTab('share')
      } else if (pending?.type === 'me_too' || pending?.type === 'reply' || pending?.type === 'save') {
        setActiveTab('community')
        if (pending.postId) {
          try {
            localStorage.setItem('between_us_open_story_id', pending.postId)
          } catch {
            // ignore
          }
        }
      }
    }

    registerDeepLinkHandlers({
      onAuthenticated: applyAuthenticatedState,
      onStoryOpen: (storyId) => {
        setActiveTab('community')
        toast.message('Opening story…', { description: storyId })
      },
    }).then((cleanup) => {
      removeListener = cleanup
      const storyId = consumeOpenStoryId()
      if (storyId) {
        setActiveTab('community')
      }
    })

    return () => {
      removeListener?.()
    }
  }, [])

  const isDevEnvironment = import.meta.env.DEV

  // Reset button for development only
  const resetOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hasCompletedOnboarding');
      localStorage.removeItem('hasCompletedTutorial');
      localStorage.removeItem('between_us_selected_languages');
      window.location.reload();
    }
  };

  const handleOnboardingComplete = (languages: string[], name?: string) => {
    setSelectedLanguages(languages);
    if (typeof window !== 'undefined') {
      localStorage.setItem('between_us_selected_languages', JSON.stringify(languages));
    }
    if (name) setUserName(name);
    // Set the first selected language as the app language
    if (languages.length > 0) {
      setLanguage(languages[0] as any);
    }
    setHasCompletedOnboarding(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasCompletedOnboarding', 'true');
    }
  };

  const handleTutorialComplete = () => {
    setHasCompletedTutorial(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasCompletedTutorial', 'true');
    }
  };

  const handleLanguagesChange = (languages: string[]) => {
    setSelectedLanguages(languages);
    if (typeof window !== 'undefined') {
      localStorage.setItem('between_us_selected_languages', JSON.stringify(languages));
    }
    // Update app language when languages change
    if (languages.length > 0) {
      setLanguage(languages[0] as any);
    }
  };

  if (!hasCompletedOnboarding) {
    console.log('Showing onboarding...');
    return (
      <div className="dark">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  if (!hasCompletedTutorial) {
    console.log('Showing tutorial...');
    return <Tutorial onComplete={handleTutorialComplete} />;
  }

  console.log('Showing main app...');

  const tabs = [
    { id: 'discover' as Tab, icon: Compass, label: t('nav.discover') },
    { id: 'share' as Tab, icon: MessageSquarePlus, label: t('nav.share') },
    { id: 'community' as Tab, icon: Globe, label: t('nav.community') },
    { id: 'checkin' as Tab, icon: CheckCircle, label: t('nav.checkin') },
    { id: 'profile' as Tab, icon: User, label: t('nav.profile') },
  ];

  const tabFallback = (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" aria-hidden="true" />
    </div>
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col transition-colors duration-300">
      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm"
        style={{ paddingTop: 'max(var(--safe-area-inset-top), 24px)' }}
      >
        <div className="max-w-md mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Left side - Logo and Reset button (for development) */}
          <div className="flex items-center gap-3">
            <img
              src={logoImage} 
              alt="Between Us" 
              className="h-5 w-auto"
            />
            {isDevEnvironment && showResetButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetOnboarding}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            )}
          </div>
          
          {/* Right side - Theme toggle */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs hidden sm:inline">
              {selectedLanguages.length} lang{selectedLanguages.length !== 1 ? 's' : ''}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-accent rounded-full h-9 w-9"
            >
              <AnimatePresence mode="wait">
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeTab === 'discover' && (
              <Suspense fallback={tabFallback}>
                <DiscoverTab selectedLanguages={selectedLanguages} />
              </Suspense>
            )}
            {activeTab === 'share' && (
              <Suspense fallback={tabFallback}>
                <ShareTab />
              </Suspense>
            )}
            {activeTab === 'checkin' && <CheckInTab userName={userName} profilePicture={profilePicture} onNavigateToProfile={() => setActiveTab('profile')} />}
            {activeTab === 'community' && <CommunityTab selectedLanguages={selectedLanguages} />}
            {activeTab === 'profile' && (
              <ProfileTab 
                selectedLanguages={selectedLanguages} 
                onLanguagesChange={handleLanguagesChange} 
                userName={userName}
                profilePicture={profilePicture}
                onProfilePictureChange={setProfilePicture}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>



      {/* Bottom Navigation - Redesigned */}
      <BottomNavBar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <Toaster theme={theme} />
      
      {/* Achievement Notifications */}
      {notifications.map((notification) => (
        <AchievementToast
          key={notification.id}
          achievement={notification.type === 'achievement' ? notification.data : undefined}
          level={notification.type === 'level' ? notification.data : undefined}
          show={true}
          onClose={() => dismissNotification(notification.id)}
        />
      ))}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}