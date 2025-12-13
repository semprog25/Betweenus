import { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun, CheckCircle, MessageSquarePlus, Ear, Globe, User } from 'lucide-react';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/sonner';
import { BottomNavBar } from './components/BottomNavBar';
import { AchievementToast } from './components/AchievementToast';
import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getSession, handleOAuthCallback, getUserProfile } from './utils/auth';
import { useAchievementNotifications } from './hooks/useAchievementNotifications';
import { toast } from 'sonner';
import { initializeRevenueCat, identifyUser as identifyRevenueCatUser, logoutUser as logoutRevenueCatUser } from './utils/revenuecat';
import darkLogoImage from './assets/61e85109150cbed2459a2fcb26ff986c57b9767c.png';
import lightLogoImage from './assets/5a1aa58d0178d59fddfa201fc0db8049ffe9a884.png';

// Lazy load heavy components
const Onboarding = lazy(() => import('./components/Onboarding').then(m => ({ default: m.Onboarding })));
const Tutorial = lazy(() => import('./components/Tutorial').then(m => ({ default: m.Tutorial })));
const ShareTab = lazy(() => import('./components/ShareTab').then(m => ({ default: m.ShareTab })));
const CheckInTab = lazy(() => import('./components/CheckInTab').then(m => ({ default: m.CheckInTab })));
const ListenTab = lazy(() => import('./components/ListenTab').then(m => ({ default: m.ListenTab })));
const ProfileTab = lazy(() => import('./components/ProfileTab').then(m => ({ default: m.ProfileTab })));
const CommunityTab = lazy(() => import('./components/CommunityTab').then(m => ({ default: m.CommunityTab })));

type Tab = 'share' | 'listen' | 'checkin' | 'community' | 'profile';

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

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
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['en']);
  const [activeTab, setActiveTab] = useState<Tab>('checkin');
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
            'between_us_language'
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

  // Initialize RevenueCat when app loads
  useEffect(() => {
    const initRevenueCat = async () => {
      const session = getSession();
      const userId = session?.user?.id;
      
      // Initialize RevenueCat
      const initialized = await initializeRevenueCat(userId);
      if (initialized) {
        console.log('RevenueCat initialized successfully');
        
        // If user is logged in, identify them in RevenueCat
        if (userId) {
          await identifyRevenueCatUser(userId);
        }
      }
    };
    
    initRevenueCat();
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
        
        // Identify user in RevenueCat if they're logged in
        await identifyRevenueCatUser(session.user.id);
      } else {
        console.log('No session found - user is in anonymous mode');
      }
    };
    
    loadUserProfile();
  }, []);

  // Handle OAuth callback (Google/Apple sign-in)
  useEffect(() => {
    handleOAuthCallback().then((session) => {
      if (session) {
        console.log('OAuth sign-in successful!', session);
        toast.success(t('auth.signedInSuccess'));
        setHasCompletedOnboarding(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('hasCompletedOnboarding', 'true');
        }
        // Load user data
        const metadata = session.user?.user_metadata;
        if (metadata?.name) setUserName(metadata.name);
        if (metadata?.avatar_url) setProfilePicture(metadata.avatar_url);
      }
    });
  }, []);

  // Reset button for development - remove this in production
  const resetOnboarding = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hasCompletedOnboarding');
      localStorage.removeItem('hasCompletedTutorial');
      window.location.reload();
    }
  };

  const handleOnboardingComplete = (languages: string[], name?: string) => {
    setSelectedLanguages(languages);
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
    // Update app language when languages change
    if (languages.length > 0) {
      setLanguage(languages[0] as any);
    }
  };

  if (!hasCompletedOnboarding) {
    console.log('Showing onboarding...');
    return (
      <div className="dark">
        <Suspense fallback={<LoadingSpinner />}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </Suspense>
      </div>
    );
  }

  if (!hasCompletedTutorial) {
    console.log('Showing tutorial...');
    return <Suspense fallback={<LoadingSpinner />}>
      <Tutorial onComplete={handleTutorialComplete} />
    </Suspense>;
  }

  console.log('Showing main app...');

  const tabs = [
    { id: 'checkin' as Tab, icon: CheckCircle, label: t('nav.checkin') },
    { id: 'share' as Tab, icon: MessageSquarePlus, label: t('nav.share') },
    { id: 'listen' as Tab, icon: Ear, label: t('nav.listen') },
    { id: 'community' as Tab, icon: Globe, label: t('nav.community') },
    { id: 'profile' as Tab, icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-3 relative flex items-center justify-center">
          {/* Centered Logo */}
          <div className="flex items-center justify-center">
            <img
              src={darkLogoImage} 
              alt="Between Us" 
              className="h-5 w-auto"
            />
          </div>
          
          {/* Left side - Reset button (for development) */}
          <div className="absolute left-4 sm:left-6">
            {showResetButton && (
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
          
          {/* Theme toggle - positioned absolutely on the right */}
          <div className="absolute right-4 sm:right-6 flex items-center gap-2">
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
            {activeTab === 'share' && <Suspense fallback={<LoadingSpinner />}>
              <ShareTab />
            </Suspense>}
            {activeTab === 'listen' && <Suspense fallback={<LoadingSpinner />}>
              <ListenTab />
            </Suspense>}
            {activeTab === 'checkin' && <Suspense fallback={<LoadingSpinner />}>
              <CheckInTab userName={userName} profilePicture={profilePicture} onNavigateToProfile={() => setActiveTab('profile')} />
            </Suspense>}
            {activeTab === 'community' && <Suspense fallback={<LoadingSpinner />}>
              <CommunityTab />
            </Suspense>}
            {activeTab === 'profile' && (
              <Suspense fallback={<LoadingSpinner />}>
                <ProfileTab 
                  selectedLanguages={selectedLanguages} 
                  onLanguagesChange={handleLanguagesChange} 
                  userName={userName}
                  profilePicture={profilePicture}
                  onProfilePictureChange={setProfilePicture}
                />
              </Suspense>
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