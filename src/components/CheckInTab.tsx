import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { CalendarIcon, BookOpen, TrendingUp, Sparkles, ChevronLeft, ChevronRight, User, Flame, Trophy, Quote } from 'lucide-react';
import { getSession } from '../utils/auth';
import { saveCheckIn, getCheckIns } from '../utils/api';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import { useLanguage } from './LanguageContext';
import { toast } from 'sonner';

type MoodEntry = {
  id: string;
  date: Date;
  mainMood: string;
  subMood: string;
  emoji: string;
  color: string;
  time: string;
  note?: string;
  activities?: string[];
};

interface CheckInTabProps {
  userName?: string;
  profilePicture?: string;
  onNavigateToProfile?: () => void;
}

// 8 Main Moods
const MAIN_MOODS = [
  {
    name: 'Happy',
    emoji: '😊',
    color: 'from-green-500 to-green-500',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-300 dark:border-yellow-700',
    subMoods: ['Joyful', 'Excited', 'Content', 'Playful', 'Proud', 'Grateful', 'Hopeful', 'Peaceful']
  },
  {
    name: 'Sad',
    emoji: '😢',
    color: 'from-yellow-500 to-yellow-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    subMoods: ['Lonely', 'Disappointed', 'Heartbroken', 'Grieving', 'Regretful', 'Melancholic', 'Homesick', 'Lost']
  },
  {
    name: 'Angry',
    emoji: '😠',
    color: 'from-red-500 to-red-500',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    subMoods: ['Frustrated', 'Annoyed', 'Resentful', 'Bitter', 'Furious', 'Irritated', 'Jealous', 'Vengeful']
  },
  {
    name: 'Anxious',
    emoji: '😰',
    color: 'from-orange-500 to-orange-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-300 dark:border-purple-700',
    subMoods: ['Worried', 'Nervous', 'Insecure', 'Overwhelmed', 'Stressed', 'Panicked', 'Fearful', 'Tense']
  },
  {
    name: 'Peaceful',
    emoji: '😌',
    color: 'from-green-500 to-green-500',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-300 dark:border-emerald-700',
    subMoods: ['Calm', 'Relaxed', 'Satisfied', 'Serene', 'Grounded', 'Accepting', 'Relieved', 'Secure']
  },
  {
    name: 'Excited',
    emoji: '🤩',
    color: 'from-green-500 to-green-500',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-300 dark:border-pink-700',
    subMoods: ['Enthusiastic', 'Energetic', 'Motivated', 'Inspired', 'Passionate', 'Eager', 'Thrilled', 'Amazed']
  },
  {
    name: 'Tired',
    emoji: '😴',
    color: 'from-yellow-500 to-yellow-500',
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-300 dark:border-slate-700',
    subMoods: ['Exhausted', 'Drained', 'Sleepy', 'Weary', 'Fatigued', 'Sluggish', 'Burnout', 'Depleted']
  },
  {
    name: 'Confused',
    emoji: '😕',
    color: 'from-yellow-500 to-yellow-500',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-300 dark:border-amber-700',
    subMoods: ['Uncertain', 'Puzzled', 'Doubtful', 'Indecisive', 'Bewildered', 'Conflicted', 'Questioning', 'Mixed']
  },
];

// Activity Tags
const ACTIVITIES = [
  { name: 'Exercise', emoji: '🏃', icon: '💪' },
  { name: 'Family', emoji: '👨‍👩‍👧‍👦', icon: '👨‍👩‍👧‍👦' },
  { name: 'Friends', emoji: '👥', icon: '👥' },
  { name: 'Date', emoji: '💕', icon: '💕' },
  { name: 'Relax', emoji: '🧘', icon: '☂️' },
  { name: 'Movies', emoji: '📺', icon: '📺' },
  { name: 'Gaming', emoji: '🎮', icon: '🎮' },
  { name: 'Reading', emoji: '📚', icon: '📚' },
  { name: 'Sleep Early', emoji: '🛌', icon: '🛏️' },
  { name: 'Eat Healthy', emoji: '🥗', icon: '🌱' },
  { name: 'Cleaning', emoji: '🧹', icon: '🧹' },
  { name: 'Shopping', emoji: '🛍️', icon: '🛒' },
  { name: 'Work', emoji: '💼', icon: '💼' },
  { name: 'Study', emoji: '📖', icon: '📖' },
  { name: 'Cook', emoji: '👨‍🍳', icon: '🍳' },
  { name: 'Music', emoji: '🎵', icon: '🎵' },
];

export function CheckInTab({ userName = 'Friend', profilePicture: propProfilePicture = '', onNavigateToProfile }: CheckInTabProps) {
  const { t, language } = useLanguage();
  
  const getMoodTranslation = (moodName: string) => {
    return t(`mood.${moodName.toLowerCase()}`);
  };

  const getSubMoodTranslation = (subMoodName: string) => {
    return t(`submood.${subMoodName.toLowerCase()}`);
  };

  const getActivityTranslation = (activityName: string) => {
    const key = activityName.replace(/\s+/g, '').replace(/^(.)/, (c) => c.toLowerCase());
    return t(`activity.${key}`);
  };

  const [view, setView] = useState<'home' | 'mood-select' | 'submood-select' | 'journal' | 'calendar' | 'journal-list'>('home');
  const [selectedMainMood, setSelectedMainMood] = useState<typeof MAIN_MOODS[0] | null>(null);
  const [selectedSubMood, setSelectedSubMood] = useState<string>('');
  const [journalNote, setJournalNote] = useState<string>('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('week');
  const [profileName, setProfileName] = useState(userName);

  // Update profile name when prop changes
  useEffect(() => {
    setProfileName(userName);
  }, [userName]);
  
  // Daily Login Streak Tracking
  const [loginStreak, setLoginStreak] = useState(0);
  const [streakPoints, setStreakPoints] = useState(0);
  
  // Generate sample mood entries for the year
  // Start with empty mood entries - users start fresh
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date());
  const [showDateEntries, setShowDateEntries] = useState(false);
  const [calendarView, setCalendarView] = useState<'monthly' | 'yearly'>('monthly');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [showCheckInInfo, setShowCheckInInfo] = useState(false);

  // Load check-ins from backend
  useEffect(() => {
    const loadData = async () => {
      const session = getSession();
      if (session?.accessToken) {
        try {
          const response = await getCheckIns();
          // Handle response format { checkIns: [...] } or { data: [...] } or just [...]
          const entries = response.checkIns || response.data || (Array.isArray(response) ? response : []);
          
          if (entries && Array.isArray(entries)) {
            if (entries.length > 0) {
              const mappedEntries = entries.map((entry: any) => ({
                ...entry,
                date: new Date(entry.date), // Ensure date string is converted to Date object
              }));
              setMoodEntries(mappedEntries);
            }
          }
        } catch (error) {
          console.error('Failed to load check-ins:', error);
        }
      }
    };
    loadData();
  }, []);

  // Calculate streak from actual entries whenever they change
  useEffect(() => {
    if (moodEntries.length === 0) {
      setLoginStreak(0);
      setStreakPoints(0);
      return;
    }

    // Sort entries by date descending
    const sortedEntries = [...moodEntries].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Get unique dates strings
    const uniqueDates = Array.from(new Set(sortedEntries.map(e => e.date.toDateString())));
    
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    // Check if the most recent entry is today or yesterday to keep streak alive
    if (uniqueDates.length > 0) {
      const lastEntryDate = uniqueDates[0];
      
      // Streak is active if we checked in today OR yesterday
      if (lastEntryDate === today || lastEntryDate === yesterday) {
        streak = 1;
        
        // Iterate backwards to find consecutive days
        // Start date for comparison is the date of the last entry found
        let comparisonDate = new Date(lastEntryDate);
        
        for (let i = 1; i < uniqueDates.length; i++) {
          // Expected previous day
          comparisonDate.setDate(comparisonDate.getDate() - 1);
          const expectedDateStr = comparisonDate.toDateString();
          
          if (uniqueDates[i] === expectedDateStr) {
            streak++;
          } else {
            // Gap found, streak ends
            break; 
          }
        }
      }
    }

    setLoginStreak(streak);
    setStreakPoints(Math.floor(streak / 10)); // Simple point calculation
  }, [moodEntries]);

  const handleMainMoodSelect = (mood: typeof MAIN_MOODS[0]) => {
    setSelectedMainMood(mood);
    setView('submood-select');
  };

  const handleSubMoodSelect = (subMood: string) => {
    setSelectedSubMood(subMood);
    setView('journal');
  };

  const handleSaveEntry = async () => {
    if (!selectedMainMood || !selectedSubMood) return;

    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      date: new Date(),
      mainMood: selectedMainMood.name,
      subMood: selectedSubMood,
      emoji: selectedMainMood.emoji,
      color: selectedMainMood.color,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      note: journalNote.trim() || undefined,
      activities: selectedActivities.length > 0 ? selectedActivities : undefined,
    };

    // Optimistic update
    setMoodEntries(prev => [...prev, newEntry]);
    
    // Save to backend
    const session = getSession();
    if (session?.accessToken) {
      try {
        await saveCheckIn({
          mainMood: selectedMainMood.name,
          subMood: selectedSubMood,
          emoji: selectedMainMood.emoji,
          color: selectedMainMood.color,
          note: journalNote.trim() || undefined,
          activities: selectedActivities.length > 0 ? selectedActivities : undefined,
        });
      } catch (error) {
        console.error('Failed to save check-in:', error);
        toast.error('Failed to save to server');
      }
    }
    
    // Reset and show success
    setTimeout(() => {
      setSelectedMainMood(null);
      setSelectedSubMood('');
      setJournalNote('');
      setSelectedActivities([]);
      setView('home');
    }, 1500);
  };

  const getTodayEntries = () => {
    const today = new Date().toDateString();
    return moodEntries.filter(entry => entry.date.toDateString() === today);
  };

  const getEntriesForDate = (date: Date) => {
    return moodEntries.filter(entry => entry.date.toDateString() === date.toDateString());
  };

  const getDatesWithEntries = () => {
    return moodEntries.map(entry => entry.date.toDateString());
  };

  const getMoodEmojiForDate = (date: Date) => {
    const entries = getEntriesForDate(date);
    if (entries.length === 0) return null;
    // Return the most recent entry's emoji for that day
    return entries[entries.length - 1].emoji;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getMoodColorForDate = (date: Date) => {
    const entries = getEntriesForDate(date);
    if (entries.length === 0) return null;
    const mood = MAIN_MOODS.find(m => m.name === entries[entries.length - 1].mainMood);
    return mood;
  };

  const getMoodColorClass = (moodName: string) => {
    // Color coding: Happy/Peaceful = Green, Sad = Yellow, Anxious = Orange, Angry = Red
    switch (moodName) {
      case 'Happy':
      case 'Peaceful':
      case 'Excited':
        return 'bg-green-500'; // Green for good/positive moods
      case 'Sad':
      case 'Tired':
      case 'Confused':
        return 'bg-yellow-500'; // Yellow for sad
      case 'Anxious':
        return 'bg-orange-500'; // Orange for anxious
      case 'Angry':
        return 'bg-red-500'; // Red for angry
      default:
        return 'bg-gray-500';
    }
  };

  // Home View
  if (view === 'home') {
    const todayEntries = getTodayEntries();
    const weekEntries = moodEntries.filter(entry => {
      const diff = Date.now() - entry.date.getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    });

    return (
      <div className="h-full overflow-hidden bg-gradient-to-br from-purple-50/50 via-fuchsia-50/30 to-pink-50/50 dark:from-purple-950/30 dark:via-fuchsia-950/20 dark:to-pink-950/30">
        <div className="h-full max-w-md mx-auto px-4 sm:px-6 flex flex-col">
          {/* Header with animated name */}
          <div className="flex-shrink-0 pt-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-muted-foreground mb-1"
                >
                  {t('checkin.welcome')}
                </motion.p>
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 100,
                    damping: 10
                  }}
                  className="text-3xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent animate-gradient"
                  style={{
                    backgroundSize: '200% auto',
                  }}
                >
                  {profileName}
                </motion.h2>
              </div>
              <motion.div 
                className="flex-shrink-0 cursor-pointer"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigateToProfile?.()}
              >
                <ProfilePictureUpload
                  currentImage={propProfilePicture}
                  onImageChange={() => {}}
                  size="sm"
                  editable={false}
                />
              </motion.div>
            </div>

            {/* Explanation Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setShowCheckInInfo(true)}
              className="bg-gradient-to-r from-purple-100 to-fuchsia-100 dark:from-purple-900/40 dark:to-fuchsia-900/40 rounded-2xl p-3 mb-4 border border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-2">
                <motion.span 
                  animate={{ 
                    rotate: [0, 10, -10, 10, 0],
                    scale: [1, 1.1, 1.1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="text-2xl"
                >
                  💭
                </motion.span>
                <div className="flex-1">
                  <p className="text-xs text-purple-900 dark:text-purple-100">
                    <strong>{t('checkin.trackJourney')}</strong> {t('checkin.checkinDesc')}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pb-4 space-y-4 scrollbar-hide">
            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-3xl shadow-xl border-2 border-purple-100 dark:border-purple-900">
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg text-foreground mb-4 text-center flex items-center justify-center gap-2"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    🎭
                  </motion.span>
                  {t('checkin.greeting')}
                </motion.h3>

                {/* Check-in Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => setView('mood-select')}
                    className="w-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600 text-white py-6 rounded-2xl shadow-2xl shadow-purple-500/50 relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                    />
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-5 h-5 mr-2 inline" />
                    </motion.span>
                    {todayEntries.length > 0 ? t('checkin.checkInAgain') : t('checkin.checkInNow')}
                  </Button>
                </motion.div>
              </Card>
            </motion.div>

            {/* Quick Actions with glow effects */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => setView('calendar')}
                  variant="outline"
                  className="h-20 w-full rounded-2xl border-2 border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center gap-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-400 dark:hover:border-purple-600 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] dark:hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                  <CalendarIcon className="w-6 h-6 text-purple-500 group-hover:text-purple-600 transition-colors relative z-10" />
                  <span className="text-sm text-foreground font-medium relative z-10">{t('checkin.calendar')}</span>
                  <span className="text-xs text-muted-foreground relative z-10">{t('checkin.viewHistory')}</span>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => setView('journal-list')}
                  variant="outline"
                  className="h-20 w-full rounded-2xl border-2 border-fuchsia-200 dark:border-fuchsia-800 flex flex-col items-center justify-center gap-1.5 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30 hover:border-fuchsia-400 dark:hover:border-fuchsia-600 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] dark:hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-fuchsia-400/0 via-fuchsia-400/20 to-fuchsia-400/0"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                  <BookOpen className="w-6 h-6 text-fuchsia-500 group-hover:text-fuchsia-600 transition-colors relative z-10" />
                  <span className="text-sm text-foreground font-medium relative z-10">{t('checkin.journal')}</span>
                  <span className="text-xs text-muted-foreground relative z-10">{t('checkin.readEntries')}</span>
                </Button>
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/50 dark:to-fuchsia-900/50 p-4 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-lg text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-purple-700 dark:text-purple-300">{t('checkin.thisWeek')}</span>
                </div>
                <p className="text-5xl bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-0.5">
                  {weekEntries.length}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">{t('nav.checkin')}</p>
              </Card>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  onClick={() => setShowStreakInfo(true)}
                  className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 p-4 rounded-2xl border-2 border-orange-200 dark:border-orange-800 shadow-lg text-center cursor-pointer hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs text-orange-700 dark:text-orange-300">{t('checkin.dailyStreak')}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-5xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-0.5">
                      {loginStreak}
                    </p>
                    {streakPoints > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs"
                      >
                        <Trophy className="w-3 h-3" />
                        {streakPoints}
                      </motion.div>
                    )}
                  </div>
                  <p className="text-xs text-orange-600 dark:text-orange-400">{loginStreak === 1 ? t('checkin.day') : t('checkin.days')}</p>
                </Card>
              </motion.div>
            </div>

            {/* Daily Motivational Quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 shadow-sm text-center relative overflow-hidden group mx-1"
            >
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 opacity-50" />
               
               <Quote className="w-8 h-8 text-blue-400/20 absolute top-2 left-2" />
               <Quote className="w-8 h-8 text-blue-400/20 absolute bottom-2 right-2 rotate-180" />
               
               <p className="text-lg font-medium text-blue-900 dark:text-blue-100 relative z-10 italic px-4">
                 "{t(`quote.${(Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) % 5) + 1}`)}"
               </p>
               <div className="mt-3 flex items-center justify-center gap-2">
                 <div className="h-px w-8 bg-blue-200 dark:bg-blue-800"></div>
                 <p className="text-xs text-blue-500 dark:text-blue-400 uppercase tracking-wider font-semibold">
                   Daily Inspiration
                 </p>
                 <div className="h-px w-8 bg-blue-200 dark:bg-blue-800"></div>
               </div>
            </motion.div>
          </div>
        </div>

        {/* Streak Info Dialog */}
        <Dialog open={showStreakInfo} onOpenChange={setShowStreakInfo}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Flame className="w-6 h-6 text-orange-500" />
                {t('checkin.streakChallenge')}
              </DialogTitle>
              <DialogDescription>
                {t('checkin.streakDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="text-base pt-4 space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{t('checkin.currentStreak')}</p>
                      <p className="text-4xl bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        {loginStreak}
                      </p>
                      <p className="text-xs text-muted-foreground">{loginStreak === 1 ? t('checkin.day') : t('checkin.days')}</p>
                    </div>
                    <div className="h-12 w-px bg-orange-300 dark:bg-orange-700"></div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-muted-foreground mb-1">{t('checkin.pointsEarned')}</p>
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <p className="text-4xl bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                          {streakPoints}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('checkin.points')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    {t('checkin.howItWorks')}
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span><strong>{t('checkin.rule1').split(': ')[0]}:</strong> {t('checkin.rule1').split(': ')[1]}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">🏆</span>
                      <span><strong>{t('checkin.rule2').split(': ')[0]}:</strong> {t('checkin.rule2').split(': ')[1]}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500 mt-0.5">🔥</span>
                      <span><strong>{t('checkin.rule3').split(': ')[0]}:</strong> {t('checkin.rule3').split(': ')[1]}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">💜</span>
                      <span><strong>{t('checkin.rule4').split(': ')[0]}:</strong> {t('checkin.rule4').split(': ')[1]}</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-center text-purple-900 dark:text-purple-100">
                    {t('checkin.proTip')}
                  </p>
                </div>

                {loginStreak >= 10 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-xl p-3 border border-yellow-300 dark:border-yellow-700"
                  >
                    <p className="text-sm text-center text-yellow-900 dark:text-yellow-100">
                      {t('checkin.amazingStreak').replace('{days}', loginStreak.toString())}
                    </p>
                  </motion.div>
                )}
              </div>
          </DialogContent>
        </Dialog>

        {/* Check-In Info Dialog */}
        <Dialog open={showCheckInInfo} onOpenChange={setShowCheckInInfo}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <span>💭</span>
                {t('checkin.whyMatter')}
              </DialogTitle>
              <DialogDescription>
                {t('checkin.benefitsDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="text-base pt-4 space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    {t('checkin.benefitsTitle')}
                  </h4>
                  <ul className="space-y-2.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-2xl">��</span>
                      <div>
                        <strong className="text-foreground">{t('checkin.benefit1Title')}</strong>
                        <p className="mt-0.5">{t('checkin.benefit1Desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-2xl">📊</span>
                      <div>
                        <strong className="text-foreground">{t('checkin.benefit2Title')}</strong>
                        <p className="mt-0.5">{t('checkin.benefit2Desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-2xl">💡</span>
                      <div>
                        <strong className="text-foreground">{t('checkin.benefit3Title')}</strong>
                        <p className="mt-0.5">{t('checkin.benefit3Desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-2xl">🌱</span>
                      <div>
                        <strong className="text-foreground">{t('checkin.benefit4Title')}</strong>
                        <p className="mt-0.5">{t('checkin.benefit4Desc')}</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-2xl">🤝</span>
                      <div>
                        <strong className="text-foreground">{t('checkin.benefit5Title')}</strong>
                        <p className="mt-0.5">{t('checkin.benefit5Desc')}</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {t('checkin.whatTrack')}
                  </h5>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>{t('checkin.track1')}</p>
                    <p>{t('checkin.track2')}</p>
                    <p>{t('checkin.track3')}</p>
                    <p>{t('checkin.track4')}</p>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-center text-green-900 dark:text-green-100">
                    {t('checkin.remember')}
                  </p>
                </div>
              </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Mood Selection View
  if (view === 'mood-select') {
    return (
      <div className="h-full overflow-hidden">
        <div className="h-full max-w-md mx-auto px-4 sm:px-6 flex flex-col">
          <div className="flex-shrink-0 pt-4 pb-8">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{t('checkin.back')}</span>
            </button>
            <h2 className="text-2xl text-foreground text-center mb-2">{t('checkin.selectMood')}</h2>
            <p className="text-sm text-muted-foreground text-center">{t('checkin.selectMoodSubtitle')}</p>
          </div>

          <div className="flex-1 flex items-center overflow-hidden pb-6">
            <div className="w-full grid grid-cols-2 gap-2.5 auto-rows-fr">
              {MAIN_MOODS.map((mood, index) => (
                <motion.button
                  key={mood.name}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleMainMoodSelect(mood)}
                  className={`${mood.bg} ${mood.border} border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:shadow-lg transition-all min-h-[100px]`}
                >
                  <span className="text-5xl leading-none">{mood.emoji}</span>
                  <span className={`text-sm font-medium bg-gradient-to-r ${mood.color} bg-clip-text text-transparent leading-none`}>
                    {t(`mood.${mood.name.toLowerCase()}`)}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Sub-Mood Selection View
  if (view === 'submood-select' && selectedMainMood) {
    return (
      <div className="h-full overflow-hidden">
        <div className="h-full max-w-md mx-auto px-4 sm:px-6 flex flex-col">
          <div className="flex-shrink-0 pt-4 pb-8">
            <button
              onClick={() => setView('mood-select')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{t('checkin.back')}</span>
            </button>

            <div className="flex flex-col items-center gap-3">
              <span className="text-6xl">{selectedMainMood.emoji}</span>
              <div className="text-center">
                <h2 className={`text-2xl bg-gradient-to-r ${selectedMainMood.color} bg-clip-text text-transparent mb-2`}>
                  {t(`mood.${selectedMainMood.name.toLowerCase()}`)}
                </h2>
                <p className="text-sm text-muted-foreground">{t('checkin.describeMood')}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center overflow-hidden pb-6">
            <div className="w-full overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-2 gap-3">
                {selectedMainMood.subMoods.map((subMood, index) => (
                  <motion.button
                    key={subMood}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubMoodSelect(subMood)}
                    className={`${selectedMainMood.bg} ${selectedMainMood.border} border rounded-2xl p-4 text-center hover:shadow-md transition-all`}
                  >
                    <span className="text-sm font-medium text-foreground">{t(`submood.${subMood.toLowerCase()}`)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Journal View
  if (view === 'journal' && selectedMainMood && selectedSubMood) {
    return (
      <div className="h-full overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="h-full max-w-md mx-auto px-4 sm:px-6 flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 pt-6 pb-2">
            <button
              onClick={() => setView('submood-select')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">{t('checkin.back')}</span>
            </button>

            {/* Selected Mood Card */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-gradient-to-br ${selectedMainMood.bg} border border-transparent dark:border-white/10 rounded-3xl p-4 flex items-center gap-4 shadow-sm mb-2`}
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-5xl filter drop-shadow-lg"
              >
                {selectedMainMood.emoji}
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">
                  {t(`submood.${selectedSubMood.toLowerCase()}`)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('checkin.addNote')}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto pb-24 space-y-6 scrollbar-hide pt-2">
            
            {/* Activity Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-sm font-semibold text-foreground/80 mb-3 px-1 flex items-center gap-2">
                <span className="text-lg">👟</span> {t('checkin.activities')}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {ACTIVITIES.map((activity, idx) => {
                  const isSelected = selectedActivities.includes(activity.name);
                  const activityKey = activity.name.replace(/\s+/g, '').replace(/^(.)/, c => c.toLowerCase());
                  return (
                    <motion.button
                      key={activity.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + idx * 0.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedActivities(prev =>
                          prev.includes(activity.name)
                            ? prev.filter(a => a !== activity.name)
                            : [...prev, activity.name]
                        );
                      }}
                      className={`
                        relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl text-xs font-medium transition-all duration-200 border
                        ${isSelected 
                          ? 'bg-white dark:bg-gray-800 border-purple-500 dark:border-purple-400 shadow-md ring-1 ring-purple-500 dark:ring-purple-400' 
                          : 'bg-white/50 dark:bg-gray-800/50 border-transparent hover:bg-white hover:border-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-700'
                        }
                      `}
                    >
                      <span className="text-xl mb-0.5">{activity.icon}</span>
                      <span className={`truncate w-full text-center ${isSelected ? 'text-purple-600 dark:text-purple-300' : 'text-muted-foreground'}`}>
                        {t(`activity.${activityKey}`)}
                      </span>
                      {isSelected && (
                        <motion.div
                          layoutId="active-ring"
                          className="absolute inset-0 rounded-xl bg-purple-500/5 dark:bg-purple-400/10 pointer-events-none"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Journal Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-1 shadow-sm border border-gray-100 dark:border-gray-800"
            >
              <div className="p-4">
                <Textarea
                  placeholder={t('checkin.notePlaceholder')}
                  value={journalNote}
                  onChange={(e) => setJournalNote(e.target.value)}
                  className="min-h-[180px] border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground/50 resize-none bg-transparent text-base leading-relaxed p-0"
                  maxLength={500}
                />
              </div>
              <div className="px-4 pb-3 flex justify-end border-t border-gray-50 dark:border-gray-700/50 pt-3">
                 <span className="text-xs font-medium text-muted-foreground bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md">
                  {journalNote.length}/500
                </span>
              </div>
            </motion.div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-950 dark:via-gray-950 pt-8 pb-6 z-10 max-w-md mx-auto">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setJournalNote('');
                  setSelectedActivities([]);
                  handleSaveEntry();
                }}
                variant="outline"
                className="flex-1 h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-800 text-muted-foreground font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-foreground transition-colors"
              >
                {t('checkin.skipNote')}
              </Button>
              <Button
                onClick={handleSaveEntry}
                className="flex-[2] h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all transform active:scale-95"
              >
                {t('checkin.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calendar View
  if (view === 'calendar') {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Adjust starting day (0 = Sunday, we want Monday = 0)
    const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    return (
      <div className="h-full overflow-hidden bg-white dark:bg-gray-900">
        <div className="h-full max-w-md mx-auto flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{t('checkin.back')}</span>
            </button>
            <h2 className="text-2xl text-foreground text-center mb-4">{t('checkin.calendar')}</h2>
            
            {/* View Toggle */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => setCalendarView('monthly')}
                className={`flex-1 rounded-xl ${
                  calendarView === 'monthly'
                    ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('checkin.monthly')}
              </Button>
              <Button
                onClick={() => setCalendarView('yearly')}
                className={`flex-1 rounded-xl ${
                  calendarView === 'yearly'
                    ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t('checkin.yearInPixels')}
              </Button>
            </div>

            {/* Month Navigation */}
            {calendarView === 'monthly' && (
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <h3 className="text-lg text-foreground">{monthName}</h3>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Calendar Grid */}
          {calendarView === 'monthly' ? (
            <div className="flex-1 overflow-y-auto pb-6 px-4 sm:px-6 scrollbar-hide">
              {/* Day Names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: adjustedStartDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const date = new Date(year, month, day);
                  const entries = getEntriesForDate(date);
                  const hasEntries = entries.length > 0;
                  const emoji = hasEntries ? getMoodEmojiForDate(date) : '😊';
                  const moodColor = hasEntries ? getMoodColorClass(entries[entries.length - 1].mainMood) : '';
                  
                  return (
                    <motion.button
                      key={day}
                      onClick={() => {
                        setSelectedDate(date);
                        if (hasEntries) {
                          setShowDateEntries(true);
                        }
                      }}
                      whileTap={{ scale: 0.95 }}
                      className="aspect-square flex flex-col items-center justify-center relative"
                    >
                      {/* Emoji */}
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-2xl sm:text-3xl ${
                        hasEntries 
                          ? moodColor
                          : 'bg-gray-100 dark:bg-gray-800 opacity-30'
                      }`}>
                        {emoji}
                      </div>
                      {/* Date number */}
                      <span className={`text-xs mt-1 ${
                        hasEntries 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground'
                      }`}>
                        {day}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Color Legend */}
              <div className="mt-8 bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide text-center">{t('checkin.colorGuide')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-500" />
                    <span className="text-xs text-foreground">{t('checkin.happyPeaceful')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-500" />
                    <span className="text-xs text-foreground">{t('checkin.sadTired')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500" />
                    <span className="text-xs text-foreground">{t('mood.anxious')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-500" />
                    <span className="text-xs text-foreground">{t('mood.angry')}</span>
                  </div>
                </div>
              </div>
              
              {/* Footer text */}
              <p className="text-center text-sm text-muted-foreground mt-4">
                {t('checkin.tapToSee')}
              </p>
            </div>
          ) : (
            // Year in Pixels View
            <div className="flex-1 overflow-y-auto pb-6 px-2 sm:px-4 scrollbar-hide">
              <div className="space-y-4">
                {Array.from({ length: 12 }).map((_, monthIndex) => {
                  const monthDate = new Date(new Date().getFullYear(), monthIndex, 1);
                  const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
                  const daysInThisMonth = new Date(new Date().getFullYear(), monthIndex + 1, 0).getDate();
                  
                  return (
                    <div key={monthIndex} className="space-y-2">
                      <h4 className="text-xs text-muted-foreground uppercase tracking-wide px-2">{monthName}</h4>
                      <div className="grid grid-cols-31 gap-0.5 sm:gap-1">
                        {Array.from({ length: 31 }).map((_, dayIndex) => {
                          const day = dayIndex + 1;
                          
                          // If day doesn't exist in this month, show empty
                          if (day > daysInThisMonth) {
                            return <div key={dayIndex} className="aspect-square" />;
                          }
                          
                          const date = new Date(new Date().getFullYear(), monthIndex, day);
                          const moodData = getMoodColorForDate(date);
                          const hasEntry = moodData !== null;
                          const isFuture = date > new Date();
                          
                          return (
                            <motion.button
                              key={dayIndex}
                              onClick={() => {
                                setSelectedDate(date);
                                if (hasEntry) {
                                  setShowDateEntries(true);
                                }
                              }}
                              whileTap={{ scale: 0.9 }}
                              className={`aspect-square rounded-sm ${
                                isFuture
                                  ? 'bg-gray-100 dark:bg-gray-800 opacity-30'
                                  : hasEntry && moodData
                                  ? `bg-gradient-to-br ${moodData.color}`
                                  : 'bg-gray-200 dark:bg-gray-700'
                              }`}
                              title={hasEntry ? `${date.toLocaleDateString()}` : ''}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Color Legend for Year in Pixels */}
              <div className="mt-6 bg-white dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide text-center">{t('checkin.colorGuide')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-500" />
                    <span className="text-xs text-foreground">{t('checkin.happyPeaceful')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-500" />
                    <span className="text-xs text-foreground">{t('checkin.sadTired')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500" />
                    <span className="text-xs text-foreground">{t('mood.anxious')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-500" />
                    <span className="text-xs text-foreground">{t('mood.angry')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Date Entries Dialog */}
        <Dialog open={showDateEntries} onOpenChange={setShowDateEntries}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                {selectedDate?.toLocaleDateString(language === 'en' ? 'en-US' : language, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </DialogTitle>
              <DialogDescription>
                {t('checkin.todayCheckins').replace(':', '')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDate && getEntriesForDate(selectedDate).map((entry) => (
                <Card key={entry.id} className={`${entry.bg} ${entry.border} border p-4`}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{entry.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground">{t(`submood.${entry.subMood.toLowerCase()}`)}</p>
                        <span className="text-xs text-muted-foreground">{entry.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t(`mood.${entry.mainMood.toLowerCase()}`)}</p>
                      {entry.note && (
                        <p className="text-sm text-foreground mt-2 italic">&quot;{entry.note}&quot;</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Journal List View
  if (view === 'journal-list') {
    // Filter entries based on selected time period
    const getFilteredEntries = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      return moodEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        const diffTime = today.getTime() - entryDay.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (timeFilter === 'day') {
          return diffDays === 0;
        } else if (timeFilter === 'week') {
          return diffDays < 7 && diffDays >= 0;
        } else {
          return diffDays < 30 && diffDays >= 0;
        }
      }).sort((a, b) => b.date.getTime() - a.date.getTime());
    };
    
    const filteredEntries = getFilteredEntries();
    
    // Group entries by date
    const groupedEntries = filteredEntries.reduce((groups, entry) => {
      const dateKey = entry.date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
      return groups;
    }, {} as Record<string, MoodEntry[]>);
    
    const getDateLabel = (dateString: string) => {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return t('checkin.today') + ', ' + date.toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'short', day: 'numeric' }).toUpperCase();
      } else if (date.toDateString() === yesterday.toDateString()) {
        return t('checkin.yesterday') + ', ' + date.toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'short', day: 'numeric' }).toUpperCase();
      } else {
        return date.toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
      }
    };

    return (
      <div className="h-full overflow-hidden bg-white dark:bg-gray-900">
        <div className="h-full max-w-md mx-auto flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{t('checkin.back')}</span>
            </button>
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl text-foreground">{t('checkin.myJournal')}</h2>
            </div>
            
            {/* Time Filter Tabs */}
            <div className="flex gap-2">
              {(['day', 'week', 'month'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTimeFilter(filter)}
                  className={`px-4 py-2 rounded-lg capitalize transition-all ${
                    timeFilter === filter
                      ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`journal.filter.${filter}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Entries List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-6 scrollbar-hide">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t('checkin.noEntriesPeriod')}</p>
                <Button
                  onClick={() => setView('mood-select')}
                  className="mt-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white"
                >
                  {t('checkin.addFirstEntry')}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(groupedEntries).map((dateKey) => {
                  const entries = groupedEntries[dateKey];
                  const firstEntry = entries[0];
                  const dotColor = getMoodColorClass(firstEntry.mainMood);
                  
                  return (
                    <div key={dateKey} className="space-y-3">
                      {/* Date Header */}
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${dotColor}`} />
                        <h3 className="text-sm text-muted-foreground tracking-wide">
                          {getDateLabel(dateKey)}
                        </h3>
                      </div>
                      
                      {/* Entries for this date */}
                      <div className="space-y-3">
                        {entries.map((entry) => {
                          const moodBgColor = getMoodColorClass(entry.mainMood);
                          const moodTextColor = 
                            entry.mainMood === 'Happy' || entry.mainMood === 'Peaceful' || entry.mainMood === 'Excited' 
                              ? 'text-green-600 dark:text-green-400'
                              : entry.mainMood === 'Sad' || entry.mainMood === 'Tired' || entry.mainMood === 'Confused'
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : entry.mainMood === 'Anxious'
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-red-600 dark:text-red-400';
                          
                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
                            >
                              <div className="flex items-start gap-3">
                                {/* Mood Emoji */}
                                <div className={`w-12 h-12 rounded-full ${moodBgColor} flex items-center justify-center text-2xl flex-shrink-0`}>
                                  {entry.emoji}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  {/* Mood and Time */}
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <h4 className={`${moodTextColor} uppercase tracking-wide`}>
                                      {t(`mood.${entry.mainMood.toLowerCase()}`)}
                                    </h4>
                                    <span className="text-xs text-muted-foreground">
                                      {entry.time}
                                    </span>
                                  </div>
                                  
                                  {/* Activities */}
                                  {entry.activities && entry.activities.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                      {entry.activities.map((activityName) => {
                                        const activity = ACTIVITIES.find(a => a.name === activityName);
                                        return (
                                          <div
                                            key={activityName}
                                            className="flex items-center gap-1 text-xs text-muted-foreground"
                                          >
                                            <span>{activity?.icon || '•'}</span>
                                            <span>{t(`activity.${activityName.replace(/\s+/g, '').replace(/^(.)/, c => c.toLowerCase())}`)}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {/* Note */}
                                  {entry.note && (
                                    <p className="text-sm text-foreground mt-2">
                                      {entry.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
