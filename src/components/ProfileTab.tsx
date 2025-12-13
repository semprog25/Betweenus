import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AnimatedLogo } from './AnimatedLogo';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Globe, Camera, Edit2, Check, LogOut, User as UserIcon, Loader2, Heart, MessageCircle, ThumbsUp, Calendar, Trash2, Edit, Star, Crown, Settings, Shield, FileText, HelpCircle, Info, Award, TrendingUp, Zap, Target, Medal, Trophy } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { toast } from 'sonner';
import { useTheme } from './ThemeProvider';
import { getSession, signOut, updateProfile } from '../utils/auth';
import { getUserStats, getUserPosts, getUserReplies, deletePost, editPost, getSubscription, getUserLevel, checkUsernameAvailability, getCheckIns } from '../utils/api';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { CommunityGuidelines } from './CommunityGuidelines';
import { SubscriptionModal } from './SubscriptionModal';
import { SettingsModal } from './SettingsModal';
import { PrivacyPolicy } from './PrivacyPolicy';
import { TermsOfService } from './TermsOfService';
import { TutorialModal } from './TutorialModal';
import { HelpCenterModal } from './HelpCenterModal';
import { FeedbackModal } from './FeedbackModal';
import { CrossPromoCarousel } from './CrossPromoCarousel';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import betweenUsLogoLight from '../assets/5a1aa58d0178d59fddfa201fc0db8049ffe9a884.png';
import betweenUsLogoDark from '../assets/9cc03a414696f787a5e30b129621eefb1979762e.png';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'zh', name: 'Mandarin', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
];

interface ProfileTabProps {
  selectedLanguages: string[];
  onLanguagesChange?: (languages: string[]) => void;
  userName?: string;
  profilePicture?: string;
  onProfilePictureChange?: (picture: string) => void;
}

export function ProfileTab({ 
  selectedLanguages, 
  onLanguagesChange, 
  userName = 'Friend',
  profilePicture: propProfilePicture = '',
  onProfilePictureChange
}: ProfileTabProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [userSession, setUserSession] = useState(getSession());
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [localSelectedLanguages, setLocalSelectedLanguages] = useState<string[]>(selectedLanguages);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState(userName);
  const [aboutText, setAboutText] = useState('A thoughtful person seeking connection and support.');
  const [profilePicture, setProfilePicture] = useState(propProfilePicture);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState(profileName);
  const [tempAbout, setTempAbout] = useState(aboutText);
  const [tempProfilePicture, setTempProfilePicture] = useState(propProfilePicture);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [publicUsername, setPublicUsername] = useState('');
  const [tempPublicUsername, setTempPublicUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [stats, setStats] = useState({
    secretsShared: 0,
    repliesGiven: 0,
    upvotesReceived: 0,
    upvotesGiven: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [selectedStatType, setSelectedStatType] = useState<'secrets' | 'replies' | 'upvotes' | 'upvotesGiven' | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isTermsOfServiceOpen, setIsTermsOfServiceOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isHelpCenterModalOpen, setIsHelpCenterModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [levelData, setLevelData] = useState<any>(null);
  const [isLoadingLevel, setIsLoadingLevel] = useState(false);
  const [checkInHistory, setCheckInHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load user data from session
  useEffect(() => {
    const session = getSession();
    setUserSession(session);
    
    if (session?.user) {
      const metadata = session.user.user_metadata;
      if (metadata?.name) setProfileName(metadata.name);
      if (metadata?.avatar_url) {
        setProfilePicture(metadata.avatar_url);
        if (onProfilePictureChange) onProfilePictureChange(metadata.avatar_url);
      }
      if (metadata?.about) setAboutText(metadata.about);
      if (metadata?.public_username) {
        setPublicUsername(metadata.public_username);
        setTempPublicUsername(metadata.public_username);
      }
    }
  }, []);

  // Update local state when prop changes
  useEffect(() => {
    setProfilePicture(propProfilePicture);
    setTempProfilePicture(propProfilePicture);
  }, [propProfilePicture]);
  
  // Check username availability with debouncing
  useEffect(() => {
    const checkUsername = async () => {
      // Reset if empty or same as current
      if (!tempPublicUsername || tempPublicUsername === publicUsername) {
        setUsernameAvailable(null);
        setIsCheckingUsername(false);
        return;
      }

      // Validate format first
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(tempPublicUsername)) {
        setUsernameAvailable(false);
        setIsCheckingUsername(false);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const result = await checkUsernameAvailability(tempPublicUsername);
        setUsernameAvailable(result.available);
      } catch (error) {
        console.error('Failed to check username:', error);
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [tempPublicUsername, publicUsername]);
  
  // Load user stats and subscription
  useEffect(() => {
    const loadStats = async () => {
      const session = getSession();
      if (!session?.user?.id) {
        return;
      }
      
      setIsLoadingStats(true);
      setIsLoadingLevel(true);
      setIsLoadingHistory(true);
      try {
        const [statsResponse, subResponse, levelResponse, checkInsResponse] = await Promise.all([
          getUserStats(session.user.id),
          getSubscription(session.user.id),
          getUserLevel(session.user.id),
          getCheckIns(),
        ]);
        
        if (statsResponse.stats) {
          setStats(statsResponse.stats);
        }
        if (subResponse.subscription) {
          setSubscription(subResponse.subscription);
        }
        if (levelResponse) {
          setLevelData(levelResponse);
        }
        if (checkInsResponse && checkInsResponse.checkIns) {
          // Sort by date desc and take last 7
          const sorted = checkInsResponse.checkIns.sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ).slice(0, 7);
          setCheckInHistory(sorted);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoadingStats(false);
        setIsLoadingLevel(false);
        setIsLoadingHistory(false);
      }
    };
    
    loadStats();
  }, [userSession]);
  
  // Prepare stats display data
  const statsDisplay = [
    { 
      type: 'secrets' as const,
      value: stats.secretsShared, 
      label: t('profile.secretsShared'),
      icon: Heart
    },
    { 
      type: 'replies' as const,
      value: stats.repliesGiven, 
      label: t('profile.repliesGiven'),
      icon: MessageCircle
    },
    { 
      type: 'upvotes' as const,
      value: stats.upvotesReceived, 
      label: t('profile.upvotesReceived'),
      icon: ThumbsUp
    },
    { 
      type: 'upvotesGiven' as const,
      value: stats.upvotesGiven || 0, 
      label: t('profile.upvotesGiven') || "Upvotes Given",
      icon: Heart
    },
  ];
  
    // Handle stat click to show details
    const handleStatClick = async (type: 'secrets' | 'replies' | 'upvotes' | 'upvotesGiven') => {
      const session = getSession();
      if (!session?.user?.id) {
        toast.error(t('subscription.error.signin'));
        return;
      }
      
      setSelectedStatType(type);
      setIsLoadingDetails(true);
      setDetailData([]);
      
      try {
        if (type === 'secrets') {
          const response = await getUserPosts(session.user.id);
          setDetailData(response.posts || []);
        } else if (type === 'replies') {
          const response = await getUserReplies(session.user.id);
          setDetailData(response.replies || []);
        } else if (type === 'upvotes') {
          // Get posts with upvotes
          const response = await getUserPosts(session.user.id);
          const postsWithUpvotes = (response.posts || []).filter((p: any) => p.upvotes > 0);
          setDetailData(postsWithUpvotes);
        } else if (type === 'upvotesGiven') {
          // Not supported yet for details
          setDetailData([]);
          toast.info("Details for upvotes given are coming soon!");
        }
      } catch (error) {
        console.error(`Failed to load ${type}:`, error);
        toast.error(`${t('listen.loadError')}: ${type}`);
      } finally {
        setIsLoadingDetails(false);
      }
    };

  const handleDeletePost = async (postId: string) => {
    const session = getSession();
    if (!session?.user?.id) return;

    try {
      await deletePost(postId, session.user.id);
      toast.success(t('listen.replyDeleted'));
      
      // Remove from detail data
      setDetailData(prev => prev.filter(item => item.id !== postId));
      
      // Refresh stats
      const response = await getUserStats(session.user.id);
      if (response.stats) {
        setStats(response.stats);
      }
      
      setDeletingPostId(null);
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      toast.error(error.message || t('listen.replyDeleteError'));
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) {
      toast.error(t('share.writeThoughts')); // "Write your thoughts..." or generic empty error
      return;
    }

    const session = getSession();
    if (!session?.user?.id) return;

    setIsEditing(true);
    try {
      const response = await editPost(postId, editContent, session.user.id);
      
      if (response.needsCredits) {
        toast.error(response.error, {
          action: {
            label: t('subscription.tab.credits'),
            onClick: () => setIsSubscriptionModalOpen(true),
          },
        });
        return;
      }

      toast.success(`${t('listen.replyUpdated')}! ${response.creditsRemaining !== undefined ? `${response.creditsRemaining} ${t('profile.credits')} remaining` : ''}`);
      
      // Update in detail data
      setDetailData(prev => prev.map(item => 
        item.id === postId ? { ...item, content: editContent, isEdited: true } : item
      ));
      
      // Reload subscription to get updated credits
      const subResponse = await getSubscription(session.user.id);
      if (subResponse.subscription) {
        setSubscription(subResponse.subscription);
      }
      
      setEditingPostId(null);
      setEditContent('');
    } catch (error: any) {
      console.error('Failed to edit post:', error);
      
      if (error.needsCredits) {
        toast.error(error.error || t('share.limitReached'), { // Or new key
          action: {
            label: t('subscription.tab.credits'),
            onClick: () => setIsSubscriptionModalOpen(true),
          },
        });
      } else {
        toast.error(t('listen.replyUpdateError'));
      }
    } finally {
      setIsEditing(false);
    }
  };

  const handleLanguageToggle = (code: string) => {
    setLocalSelectedLanguages(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleSaveLanguages = () => {
    if (localSelectedLanguages.length === 0) {
      toast.error(t('profile.selectOneLang'));
      return;
    }
    if (onLanguagesChange) {
      onLanguagesChange(localSelectedLanguages);
    }
    setIsLanguageDialogOpen(false);
    toast.success(t('profile.languageUpdated'));
  };

  const handleSaveUsername = async () => {
    try {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (tempPublicUsername && !usernameRegex.test(tempPublicUsername)) {
        toast.error(t('profile.usernameRequirements'));
        return;
      }

      // Check if username is available (if not empty and different from current)
      if (tempPublicUsername && tempPublicUsername !== publicUsername && usernameAvailable === false) {
        toast.error(t('profile.publicUsername.taken'));
        return;
      }

      // Update profile in backend if user is signed in
      if (userSession && userSession.accessToken) {
        await updateProfile({
          public_username: tempPublicUsername || undefined,
        });
        
        setPublicUsername(tempPublicUsername);
        setIsEditingUsername(false);
        setUsernameAvailable(null);
        setIsCheckingUsername(false);
        toast.success(tempPublicUsername ? t('profile.usernameSaved') : t('profile.usernameRemoved'));
      } else {
        toast.error(t('subscription.error.signin'));
      }
    } catch (error: any) {
      console.error('Failed to save username:', error);
      toast.error(error.message || t('profile.usernameError'));
    }
  };

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      // Update profile in backend if user is signed in
      if (userSession && userSession.accessToken) {
        try {
          await updateProfile({
            name: tempName,
            avatar_url: tempProfilePicture,
            about: tempAbout,
          });
          
          // Update session
          const updatedSession = getSession();
          setUserSession(updatedSession);
          
          console.log('Profile saved to server successfully');
        } catch (serverError: any) {
          // If server update fails, still update locally
          console.warn('Server profile update failed, saving locally only:', serverError);
          
          // Check if it's a session error
          if (serverError.message?.includes('session') || serverError.message?.includes('authenticated')) {
            toast.info(t('profile.savedLocally'));
          } else {
            // For other errors, show a warning but still save locally
            toast.warning(t('profile.savedLocallyOnly'));
          }
        }
      } else {
        // User is not signed in, just save locally
        console.log('No session found, saving profile locally only');
      }
      
      // Always update local state
      setProfileName(tempName);
      setAboutText(tempAbout);
      setProfilePicture(tempProfilePicture);
      
      // Notify parent component about profile picture change
      if (onProfilePictureChange) {
        onProfilePictureChange(tempProfilePicture);
      }
      
      setIsEditingProfile(false);
      
      // Only show success if we didn't already show a different message
      if (!userSession || !userSession.accessToken) {
        toast.success(t('profile.profileUpdated') + ' 🎉');
      } else {
        toast.success(t('profile.profileUpdated') + ' 🎉');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(t('profile.updateError'));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setTempName(profileName);
    setTempAbout(aboutText);
    setTempProfilePicture(profilePicture);
    setIsEditingProfile(false);
  };

  const handleSignOut = async () => {
    setShowLogoutConfirmation(true);
  };

  const confirmSignOut = async () => {
    setShowLogoutConfirmation(false);
    setIsSigningOut(true);
    try {
      toast.info(t('profile.saving'), { duration: 2000 });
      
      // Sign out (this will save data automatically via the signOut function)
      await signOut();
      
      toast.success(t('profile.signOutSuccess'));
      setUserSession(null);
      
      // Clear onboarding flag and redirect to onboarding
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hasCompletedOnboarding');
        
        // Reload the page to trigger onboarding screen
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(t('profile.signOutError'));
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Calculate user level based on activity (fallback if API data not loaded)
  const calculateUserLevel = () => {
    // Use backend data if available
    if (levelData) {
      const iconMap: any = {
        1: Zap,
        2: Star,
        3: Medal,
        4: Award,
        5: Trophy,
      };
      
      const colorMap: any = {
        1: 'from-green-500 to-emerald-500',
        2: 'from-pink-500 to-rose-500',
        3: 'from-blue-500 to-cyan-500',
        4: 'from-purple-500 to-fuchsia-500',
        5: 'from-yellow-500 to-amber-500',
      };
      
      return {
        level: levelData.level,
        title: levelData.levelTitle,
        icon: iconMap[levelData.level] || Zap,
        color: colorMap[levelData.level] || 'from-green-500 to-emerald-500',
        activityPoints: levelData.activityPoints,
        nextLevelPoints: levelData.nextLevelPoints,
        progressToNext: levelData.progressToNext,
      };
    }
    
    // Fallback calculation
    const totalActivity = stats.secretsShared + stats.repliesGiven + stats.upvotesReceived;
    
    if (totalActivity >= 100) return { level: 5, title: 'Community Leader', icon: Trophy, color: 'from-yellow-500 to-amber-500' };
    if (totalActivity >= 50) return { level: 4, title: 'Active Supporter', icon: Award, color: 'from-purple-500 to-fuchsia-500' };
    if (totalActivity >= 25) return { level: 3, title: 'Engaged Member', icon: Medal, color: 'from-blue-500 to-cyan-500' };
    if (totalActivity >= 10) return { level: 2, title: 'Rising Star', icon: Star, color: 'from-pink-500 to-rose-500' };
    return { level: 1, title: 'New Friend', icon: Zap, color: 'from-green-500 to-emerald-500' };
  };

  const userLevel = calculateUserLevel();
  
  // Get achievements based on stats
  const getAchievements = () => {
    // Use backend data if available
    if (levelData?.badges && levelData.badges.length > 0) {
      return levelData.badges.map((badge: any) => {
        // Map badge IDs to appropriate colors
        const colorMap: any = {
          'getting-started': 'from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-900/10 border-green-200 dark:border-green-700',
          'storyteller': 'from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 border-purple-200 dark:border-purple-700',
          'supportive-friend': 'from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 border-blue-200 dark:border-blue-700',
          'community-favorite': 'from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-700',
          'active-participant': 'from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-900/10 border-pink-200 dark:border-pink-700',
          'veteran': 'from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 border-amber-200 dark:border-amber-700',
        };
        
        // Try to translate badge if we have a key for it
        const titleKey = `badge.${badge.id.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase())}.title`;
        const descKey = `badge.${badge.id.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase())}.desc`;
        
        // Check if translation exists (simple check against English default)
        const title = t(titleKey) !== titleKey ? t(titleKey) : badge.name;
        const desc = t(descKey) !== descKey ? t(descKey) : badge.description;

        return {
          icon: badge.icon,
          title: title,
          description: desc,
          color: colorMap[badge.id] || 'from-gray-100 to-gray-50 dark:from-gray-900/30 dark:to-gray-900/10 border-gray-200 dark:border-gray-700',
        };
      });
    }
    
    // Fallback achievements calculation
    const achievements = [];
    
    if (stats.secretsShared >= 10) {
      achievements.push({ 
        icon: '💬', 
        title: t('badge.storyteller.title'), 
        description: t('badge.storyteller.desc'),
        color: 'from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 border-purple-200 dark:border-purple-700'
      });
    }
    
    if (stats.repliesGiven >= 25) {
      achievements.push({ 
        icon: '🤝', 
        title: t('badge.supportiveFriend.title'), 
        description: t('badge.supportiveFriend.desc'),
        color: 'from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 border-blue-200 dark:border-blue-700'
      });
    }
    
    if (stats.upvotesReceived >= 50) {
      achievements.push({ 
        icon: '⭐', 
        title: t('badge.communityFavorite.title'), 
        description: t('badge.communityFavorite.desc'),
        color: 'from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-700'
      });
    }
    
    if (stats.secretsShared >= 1 && stats.repliesGiven >= 1) {
      achievements.push({ 
        icon: '💜', 
        title: t('badge.activeParticipant.title'), 
        description: t('badge.activeParticipant.desc'),
        color: 'from-fuchsia-100 to-fuchsia-50 dark:from-fuchsia-900/30 dark:to-fuchsia-900/10 border-fuchsia-200 dark:border-fuchsia-700'
      });
    }
    
    if (userSession?.user?.created_at) {
      const daysSinceJoined = Math.floor(
        (Date.now() - new Date(userSession.user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceJoined >= 30) {
        achievements.push({ 
          icon: '🎉', 
          title: t('badge.veteran.title'), 
          description: t('badge.veteran.desc'),
          color: 'from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-900/10 border-indigo-200 dark:border-indigo-700'
        });
      }
    }
    
    // Return placeholder if no achievements
    if (achievements.length === 0) {
      return [{
        icon: '🌱',
        title: t('badge.gettingStarted.title'),
        description: t('badge.gettingStarted.desc'),
        color: 'from-gray-100 to-gray-50 dark:from-gray-800/30 dark:to-gray-900/10 border-gray-200 dark:border-gray-700'
      }];
    }
    
    return achievements;
  };

  const achievements = getAchievements();
  
  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-4xl mx-auto p-6 space-y-6 pb-8">
        {/* Not Signed In Notice */}
        {!userSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-50 dark:bg-purple-950/50 border-2 border-purple-200 dark:border-purple-500/50 rounded-3xl p-4 text-center"
          >
            <p className="text-purple-600 dark:text-purple-300 text-sm">
              ℹ️ {t('profile.anonymous')}
              <br />
              <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload(); }} className="underline font-medium">
                {t('profile.createAccount')}
              </a> {t('profile.sync')}
            </p>
          </motion.div>
        )}

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-0 border-0 shadow-lg overflow-hidden relative"
        >
          {/* Cover Background */}
          <div className="h-32 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 opacity-20 dark:opacity-10"></div>
          
          {/* Settings Button */}
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsModalOpen(true)}
              className="bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 backdrop-blur-sm rounded-full"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </Button>
          </div>

          <div className="flex flex-col items-center space-y-4 p-8 -mt-16 relative">
            {/* Profile Picture */}
            <div className="ring-4 ring-white dark:ring-gray-800 rounded-full shadow-xl">
              <ProfilePictureUpload
                currentImage={isEditingProfile ? tempProfilePicture : profilePicture}
                onImageChange={(url) => {
                  if (isEditingProfile) {
                    setTempProfilePicture(url);
                  }
                }}
                size="xl"
                editable={isEditingProfile}
              />
            </div>

            {/* Name */}
            {isEditingProfile ? (
              <div className="w-full max-w-sm space-y-2">
                <Label htmlFor="name" className="text-foreground">{t('profile.name')}</Label>
                <Input
                  id="name"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="text-center"
                  placeholder="Your name"
                />
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-foreground font-bold text-3xl">{profileName}</h2>
                  {/* Display email below name if user is signed in */}
                  {userSession?.user?.email && (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{userSession.user.email}</p>
                  )}
                  {/* Member Since Badge */}
                  {userSession?.user?.created_at && (
                    <Badge className="bg-gradient-to-r from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700">
                      <Calendar className="w-3 h-3 mr-1.5" />
                      {t('profile.memberSince')} {new Date(userSession.user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Badge>
                  )}
                </div>
              </>
            )}

            {/* About */}
            {isEditingProfile ? (
              <div className="w-full max-w-md space-y-2">
                <Label htmlFor="about" className="text-foreground">{t('profile.about')}</Label>
                <Textarea
                  id="about"
                  value={tempAbout}
                  onChange={(e) => setTempAbout(e.target.value)}
                  className="resize-none"
                  rows={3}
                  placeholder={t('profile.aboutPlaceholder')}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-center max-w-md">{aboutText}</p>
            )}

            {/* Edit/Save Buttons */}
            <div className="flex gap-3">
              {isEditingProfile ? (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isUpdatingProfile}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('profile.saving')}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {t('profile.saveChanges')}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdatingProfile}
                    className="border-purple-200 dark:border-purple-500/50"
                  >
                    {t('profile.cancel')}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(true);
                    setTempName(profileName);
                    setTempAbout(aboutText);
                    setTempProfilePicture(profilePicture);
                  }}
                  className="border-purple-200 dark:border-purple-500/50"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t('profile.editProfile')}
                </Button>
              )}
            </div>

            {/* Language Selector Button */}
            <Dialog open={isLanguageDialogOpen} onOpenChange={setIsLanguageDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full max-w-sm border-purple-200 dark:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  {t('profile.languages')} ({selectedLanguages.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-0">
                <DialogHeader>
                  <DialogTitle className="text-foreground">{t('profile.selectLanguages')}</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    {t('profile.languagesDesc')}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-4">
                  {LANGUAGES.map((lang) => {
                    const isSelected = localSelectedLanguages.includes(lang.code);
                    return (
                      <motion.button
                        key={lang.code}
                        onClick={() => handleLanguageToggle(lang.code)}
                        whileTap={{ scale: 0.95 }}
                        className={`py-3 px-4 rounded-2xl text-center transition-all border-2 ${
                          isSelected
                            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-purple-500'
                            : 'bg-gray-50 dark:bg-gray-700 text-muted-foreground border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveLanguages}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                  >
                    {t('profile.saveLanguages')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLocalSelectedLanguages(selectedLanguages);
                      setIsLanguageDialogOpen(false);
                    }}
                    className="border-purple-200 dark:border-purple-500/50"
                  >
                    {t('profile.cancel')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>


        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          {statsDisplay.map((stat, index) => (
            <Sheet key={index} open={selectedStatType === stat.type} onOpenChange={(open) => !open && setSelectedStatType(null)}>
              <SheetTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  onClick={() => handleStatClick(stat.type)}
                  className={`${
                    index === 0 ? 'bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 border-purple-200 dark:border-purple-800' :
                    index === 1 ? 'bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 dark:from-fuchsia-900/30 dark:to-fuchsia-900/10 border-fuchsia-200 dark:border-fuchsia-800' :
                    index === 2 ? 'bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-900/10 border-pink-200 dark:border-pink-800' :
                    'bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-900/10 border-rose-200 dark:border-rose-800'
                  } rounded-2xl p-4 sm:p-6 border shadow-sm text-center hover:shadow-lg hover:scale-105 transition-all cursor-pointer`}
                >
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 ${
                    index === 0 ? 'text-purple-600 dark:text-purple-400' :
                    index === 1 ? 'text-fuchsia-600 dark:text-fuchsia-400' :
                    index === 2 ? 'text-pink-600 dark:text-pink-400' :
                    'text-rose-600 dark:text-rose-400'
                  }`} />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                    className={`text-2xl sm:text-3xl mb-2 font-bold ${
                      index === 0 ? 'text-purple-700 dark:text-purple-300' :
                      index === 1 ? 'text-fuchsia-700 dark:text-fuchsia-300' :
                      index === 2 ? 'text-pink-700 dark:text-pink-300' :
                      'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {isLoadingStats ? '...' : stat.value}
                  </motion.div>
                  <div className={`text-xs sm:text-sm whitespace-pre-line font-medium ${
                    index === 0 ? 'text-purple-600 dark:text-purple-400' :
                    index === 1 ? 'text-fuchsia-600 dark:text-fuchsia-400' :
                    index === 2 ? 'text-pink-600 dark:text-pink-400' :
                    'text-rose-600 dark:text-rose-400'
                  }`}>{stat.label}</div>
                </motion.button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <stat.icon className="w-5 h-5" />
                    {stat.label.replace('\n', ' ')}
                  </SheetTitle>
                  <SheetDescription>
                    {stat.type === 'secrets' && t('profile.sheet.secrets')}
                    {stat.type === 'replies' && t('profile.sheet.replies')}
                    {stat.type === 'upvotes' && t('profile.sheet.upvotes')}
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  ) : detailData.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <stat.icon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>{t('profile.noStats').replace('{type}', stat.type)}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pr-4">
                      {detailData.map((item: any, idx: number) => (
                        <motion.div
                          key={item.id || idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-2"
                        >
                          {editingPostId === item.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[100px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditPost(item.id)}
                                  disabled={isEditing}
                                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600"
                                >
                                  {isEditing ? t('profile.saving') : t('profile.save')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingPostId(null);
                                    setEditContent('');
                                  }}
                                  disabled={isEditing}
                                >
                                  {t('profile.cancel')}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-foreground flex-1">
                                  {item.content || item.postContent}
                                  {item.isEdited && (
                                    <span className="ml-2 text-xs text-gray-500 italic">{t('profile.edited')}</span>
                                  )}
                                </p>
                                {stat.type === 'secrets' && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setEditingPostId(item.id);
                                        setEditContent(item.content);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeletingPostId(item.id)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {item.createdAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(item.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                                {stat.type === 'secrets' && (
                                  <>
                                    <span className="flex items-center gap-1">
                                      <ThumbsUp className="w-3 h-3" />
                                      {item.upvotes || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageCircle className="w-3 h-3" />
                                      {item.replies?.length || 0}
                                    </span>
                                  </>
                                )}
                                {stat.type === 'upvotes' && (
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    {item.upvotes || 0} upvotes
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </SheetContent>
            </Sheet>
          ))}
        </motion.div>

        {/* Mood History */}
        {userSession && checkInHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border-0 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-foreground font-semibold">{t('profile.moodHistory')}</h3>
              </div>
              <span className="text-xs text-muted-foreground">{t('profile.last7Checkins')}</span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {checkInHistory.map((checkIn, idx) => (
                <motion.div
                  key={checkIn.id || idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex flex-col items-center gap-2 min-w-[60px]"
                >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm border-2 border-white dark:border-gray-700"
                    style={{ backgroundColor: checkIn.color || '#E5E7EB' }}
                  >
                    {checkIn.emoji || '😐'}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {new Date(checkIn.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* User Level & Progress Card */}
        {userSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border-0 shadow-lg relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${userLevel.color} opacity-10`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${userLevel.color} flex items-center justify-center shadow-lg`}>
                    <userLevel.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-bold">{t('profile.level')} {userLevel.level}</h3>
                    <p className="text-sm text-muted-foreground">{userLevel.title}</p>
                  </div>
                </div>
                <Badge className={`bg-gradient-to-r ${userLevel.color} text-white border-0 shadow-sm`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {t('profile.active')}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('profile.progress')}</span>
                  <span>{userLevel.activityPoints || (stats.secretsShared + stats.repliesGiven + stats.upvotesReceived)} {t('profile.points')}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${userLevel.progressToNext !== undefined ? userLevel.progressToNext : Math.min(((stats.secretsShared + stats.repliesGiven + stats.upvotesReceived) % 25) / 25 * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full bg-gradient-to-r ${userLevel.color} rounded-full`}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {userLevel.level < 5 ? (
                    userLevel.nextLevelPoints ? 
                      `${userLevel.nextLevelPoints - (userLevel.activityPoints || 0)} ${t('profile.moreToLevel')} ${userLevel.level + 1}` :
                      `${25 - ((stats.secretsShared + stats.repliesGiven + stats.upvotesReceived) % 25)} ${t('profile.moreToLevel')} ${userLevel.level + 1}`
                  ) : t('profile.maxLevel')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Achievement Badges */}
        {userSession && achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border-0 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-foreground">{t('profile.badges')}</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`bg-gradient-to-br ${achievement.color} rounded-2xl p-4 text-center border hover:scale-105 transition-all`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="font-bold text-foreground text-sm mb-1">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </motion.div>
              ))}
            </div>
            
            {achievements.length === 1 && achievements[0].title === t('badge.gettingStarted.title') && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t('profile.badgesHint')}
              </p>
            )}
          </motion.div>
        )}

        {/* Subscription & Points Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-purple-700 rounded-3xl p-6 border-0 shadow-xl text-white relative overflow-hidden"
        >
          {/* Animated Background Effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-fuchsia-300 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                >
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </motion.div>
                <h3 className="text-xl font-bold">{t('profile.rewards')}</h3>
              </div>
              <Badge className="bg-white/20 border-white/30 text-white backdrop-blur-sm">
                {subscription?.tier || 'Free'} {t('profile.tier')}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                <p className="text-xs text-white/80 mb-1">Points</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  0
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                <p className="text-xs text-white/80 mb-1">{t('profile.credits')}</p>
                <p className="text-2xl font-bold">{subscription?.credits || 0}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                <p className="text-xs text-white/80 mb-1">{t('profile.posts')}</p>
                <p className="text-2xl font-bold">
                  {subscription?.postsThisMonth || 0}/{subscription?.monthlyPostLimit || 3}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg"
            >
              <Crown className="w-4 h-4 mr-2" />
              {t('profile.upgradeEarn')}
            </Button>

            <p className="text-xs text-white/70 text-center mt-3">
              {t('profile.unlockUnlimited')}
            </p>
          </div>
        </motion.div>

        {/* Community Guidelines */}
        <CommunityGuidelines />

        {/* Help & Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 border-0 shadow-lg"
        >
          <h3 className="text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            {t('profile.helpFeedback')}
          </h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={() => setIsTutorialModalOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  📖
                </div>
                <span>{t('profile.tutorial')}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-between border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={() => setIsHelpCenterModalOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  ❓
                </div>
                <span>{t('profile.helpCenter')}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-between border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={() => setIsFeedbackModalOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  💬
                </div>
                <span>{t('profile.sendFeedback')}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-between border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={() => setIsPrivacyPolicyOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>{t('profile.privacyPolicy')}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={() => setIsTermsOfServiceOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  📜
                </div>
                <span>{t('profile.termsOfService')}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
          </div>
        </motion.div>

        {/* Settings Section - Only show for signed in users */}
        {userSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-8 border-0 shadow-lg"
          >
            <h3 className="text-foreground mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('profile.settings')}
            </h3>
            <Button
              variant="outline"
              className="w-full justify-between border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>{t('profile.accountSettings')}</span>
              </div>
              <span className="text-gray-400">→</span>
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Change your email address or password
            </p>
          </motion.div>
        )}

        {/* About the App */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: userSession ? 0.58 : 0.55 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 border-0 shadow-lg text-center"
        >
          <h3 className="text-foreground mb-6">{t('profile.about.title')}</h3>
          
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -10, 0],
              }}
              transition={{
                opacity: { duration: 0.5 },
                scale: { duration: 0.5, type: 'spring' },
                y: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              className="relative"
            >
              <motion.img
                src={betweenUsLogoDark}
                alt="Between Us Logo"
                className="w-32 h-32 object-contain"
                animate={{
                  filter: [
                    'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))',
                    'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))',
                    'drop-shadow(0 0 8px rgba(168, 85, 247, 0.4))',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          </div>
          
          <h4 className="text-foreground mb-4">{t('profile.about.appName')}</h4>
          
          <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
            {t('profile.about.description')}
          </p>
          
          <motion.p
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-purple-600 dark:text-purple-400"
          >
            {t('profile.about.dreamedBy')}
          </motion.p>

          {/* Terms and Privacy Links */}
          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={() => setIsTermsOfServiceOpen(true)}
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
            >
              {t('profile.termsOfService')}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsPrivacyPolicyOpen(true)}
              className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors underline"
            >
              {t('profile.privacyPolicy')}
            </button>
          </div>
        </motion.div>

        {/* Account Information Section - Only show for signed in users */}
        {userSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 border-0 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <UserIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-foreground text-lg font-semibold">{t('profile.accountInfo')}</h3>
            </div>
            
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.email')}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{userSession.user.email}</span>
              </div>
              
              {/* User ID (first 8 characters) */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.userId')}</span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">{userSession.user.id.slice(0, 8)}...</span>
              </div>
              
              {/* Member Since */}
              {userSession.user.created_at && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('profile.memberSince')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(userSession.user.created_at).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              
              {/* Public Username (Optional) */}
              <div className="space-y-2">
                {!isEditingUsername ? (
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">{t('profile.publicUsername')}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{t('profile.publicUsername.optional')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {publicUsername || <span className="text-gray-500 italic">{t('profile.publicUsername.notSet')}</span>}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingUsername(true)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">{t('profile.publicUsername.label')}</Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {t('profile.publicUsername.desc')}
                        </p>
                        <div className="relative">
                          <Input
                            value={tempPublicUsername}
                            onChange={(e) => setTempPublicUsername(e.target.value)}
                            placeholder={t('profile.publicUsername.placeholder')}
                            className="bg-white dark:bg-gray-800 pr-10"
                            maxLength={20}
                          />
                          {tempPublicUsername && tempPublicUsername !== publicUsername && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {isCheckingUsername ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              ) : usernameAvailable === true ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : usernameAvailable === false ? (
                                <span className="text-red-500 text-xs">✕</span>
                              ) : null}
                            </div>
                          )}
                        </div>
                        {tempPublicUsername && tempPublicUsername !== publicUsername && !isCheckingUsername && (
                          <p className={`text-xs mt-1 ${
                            usernameAvailable === true 
                              ? 'text-green-600 dark:text-green-400' 
                              : usernameAvailable === false 
                              ? 'text-red-600 dark:text-red-400' 
                              : ''
                          }`}>
                            {usernameAvailable === true && t('profile.publicUsername.available')}
                            {usernameAvailable === false && t('profile.publicUsername.taken')}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveUsername}
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
                          disabled={
                            isCheckingUsername || 
                            (tempPublicUsername !== '' && tempPublicUsername !== publicUsername && usernameAvailable === false)
                          }
                        >
                          {isCheckingUsername ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4 mr-1" />
                          )}
                          {t('profile.publicUsername.save')}
                        </Button>
                        <Button
                          onClick={() => {
                            setTempPublicUsername(publicUsername);
                            setIsEditingUsername(false);
                            setUsernameAvailable(null);
                            setIsCheckingUsername(false);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          {t('profile.cancel')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Subscription Tier */}
              {subscription && (
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                  <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">{t('profile.subscription')}</span>
                  <Badge className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-0">
                    {subscription.tier === 'free' && `🆓 ${t('tier.free')}`}
                    {subscription.tier === 'explorer' && `🌟 ${t('tier.premium')}`}
                    {subscription.tier === 'supporter' && `💎 ${t('tier.pro')}`}
                  </Badge>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Sign Out Button - Only show for signed in users */}
        {userSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="pb-6"
          >
            <CrossPromoCarousel />
            <Button
              onClick={handleSignOut}
              disabled={isSigningOut}
              variant="outline"
              className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-900/20 py-6 rounded-2xl font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('auth.signingIn')}...
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Settings Modal */}
        {userSession && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        )}

        {/* Privacy Policy Modal */}
        <PrivacyPolicy
          isOpen={isPrivacyPolicyOpen}
          onClose={() => setIsPrivacyPolicyOpen(false)}
        />

        {/* Terms of Service Modal */}
        <TermsOfService
          isOpen={isTermsOfServiceOpen}
          onClose={() => setIsTermsOfServiceOpen(false)}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('profile.deletePost.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('profile.deletePost.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('profile.deletePost.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingPostId && handleDeletePost(deletingPostId)}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('profile.deletePost.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Subscription Modal */}
        {userSession && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            userId={userSession.user.id}
            currentTier={subscription?.tier || 'free'}
            currentCredits={subscription?.credits || 0}
            onSubscriptionUpdate={async () => {
              const session = getSession();
              if (session?.user?.id) {
                const subResponse = await getSubscription(session.user.id);
                if (subResponse.subscription) {
                  setSubscription(subResponse.subscription);
                }
              }
            }}
          />
        )}

        {/* Tutorial Modal */}
        <TutorialModal
          isOpen={isTutorialModalOpen}
          onClose={() => setIsTutorialModalOpen(false)}
        />

        {/* Help Center Modal */}
        <HelpCenterModal
          isOpen={isHelpCenterModalOpen}
          onClose={() => setIsHelpCenterModalOpen(false)}
        />

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutConfirmation} onOpenChange={setShowLogoutConfirmation}>
          <AlertDialogContent className="border-0 bg-white dark:bg-gray-900 max-w-md overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/10 to-purple-500/10 animate-pulse" />
            
            {/* Floating Orbs */}
            <motion.div
              className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute -bottom-10 -left-10 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <div className="relative z-10">
              <AlertDialogHeader className="space-y-4">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg"
                >
                  <LogOut className="w-8 h-8 text-white" />
                </motion.div>

                <AlertDialogTitle className="text-center text-2xl text-foreground">
                  {t('profile.signOut.title')}
                </AlertDialogTitle>
                
                <AlertDialogDescription className="text-center text-muted-foreground px-2 whitespace-pre-line">
                  {t('profile.signOut.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="flex-col sm:flex-col gap-2 mt-6">
                <Button
                  onClick={confirmSignOut}
                  disabled={isSigningOut}
                  className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {isSigningOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('profile.signOut.signingOut')}
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('profile.signOut.confirm')}
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutConfirmation(false)}
                  disabled={isSigningOut}
                  className="w-full border-2 border-purple-200 dark:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  {t('profile.signOut.cancel')}
                </Button>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}