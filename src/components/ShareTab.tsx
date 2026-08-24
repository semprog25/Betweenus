import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Crown, Sparkles, Shield, Info, Lightbulb, User, Eye, EyeOff, AlertTriangle, Filter, X, ImagePlus, PenLine } from 'lucide-react';
import { getCategoryIcon } from './CategoryIcons';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { useLanguage } from './LanguageContext';
import { SubscriptionModal } from './SubscriptionModal';
import { createPost, canPost, incrementPostCount, getSubscription, uploadPostImage } from '../utils/api';
import { getSession } from '../utils/auth';

const GUIDELINES_KEY = 'between_us_guidelines_accepted';

export function ShareTab() {
  const { t, language } = useLanguage();
  const [thought, setThought] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [postLimit, setPostLimit] = useState<any>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isLoadingLimits, setIsLoadingLimits] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['General']);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EXAMPLES = [
    t('share.example1'),
    t('share.example2'),
    t('share.example3'),
    t('share.example4'),
  ];

  const categories = [
    { name: 'General', color: 'purple' },
    { name: 'Controversial', color: 'orange', hot: true },
    { name: 'Clickbait', color: 'orange', hot: true },
    { name: 'Exposed', color: 'orange', hot: true },
    { name: 'Heartbreak', color: 'pink' },
    { name: 'Shocking', color: 'orange', hot: true },
    { name: 'Confessions', color: 'orange', hot: true },
    { name: 'Dark Secrets', color: 'orange', hot: true },
    { name: 'Drama', color: 'orange', hot: true },
    { name: 'Tea & Gossip', color: 'orange', hot: true },
    { name: 'Money Problems', color: 'yellow' },
    { name: 'NSFW Stories', color: 'orange', hot: true },
    { name: 'Unpopular Opinions', color: 'orange', hot: true },
    { name: 'Addictions', color: 'red' },
    { name: 'Mental Health', color: 'blue' },
    { name: 'Relationships', color: 'pink' },
    { name: 'Career', color: 'indigo' },
    { name: 'Family', color: 'green' },
    { name: 'Education', color: 'blue' },
    { name: 'Self-Care', color: 'green' },
    { name: 'Personal Growth', color: 'yellow' },
    { name: 'Anxiety', color: 'gray' },
    { name: 'Depression', color: 'gray' },
    { name: 'Friendships', color: 'teal' },
    { name: 'Motivation', color: 'yellow' },
    { name: 'Random', color: 'purple' },
  ];
  
  const getCategoryTranslation = (name: string) => {
    const key = name.replace(/[^a-zA-Z]/g, '');
    return t(`category.${key}`);
  };

  // Load subscription and post limits
  useEffect(() => {
    loadLimits();
  }, []);

  const loadLimits = async () => {
    const session = getSession();
    if (!session?.user?.id) return;

    setIsLoadingLimits(true);
    try {
      const [subResponse, limitResponse] = await Promise.all([
        getSubscription(session.user.id),
        canPost(session.user.id),
      ]);

      setSubscription(subResponse.subscription);
      setPostLimit(limitResponse);
    } catch (error) {
      console.error('Failed to load limits:', error);
    } finally {
      setIsLoadingLimits(false);
    }
  };

  const checkGuidelinesAccepted = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(GUIDELINES_KEY) === 'true';
    }
    return false;
  };

  const getImageAspect = (width: number, height: number): 'square' | 'wide' | 'portrait' => {
    const ratio = width / height;
    if (ratio >= 0.9 && ratio <= 1.1) return 'square';
    return ratio > 1.1 ? 'wide' : 'portrait';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('share.imageInvalidType'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('share.imageTooLarge'));
      return;
    }
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
    e.target.value = '';
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => {
      // Always keep at least one category
      if (prev.includes(categoryName) && prev.length === 1) {
        return prev;
      }
      
      if (prev.includes(categoryName)) {
        return prev.filter(c => c !== categoryName);
      } else {
        // Max 3 categories
        if (prev.length >= 3) {
          toast.error(t('share.maxCategories'));
          return prev;
        }
        return [...prev, categoryName];
      }
    });
  };

  const handleShare = async () => {
    if (!thought.trim()) return;

    // Check if guidelines have been accepted
    if (!checkGuidelinesAccepted()) {
      setShowGuidelines(true);
      return;
    }

    await executeShare();
  };

  const executeShare = async () => {
    const session = getSession();
    
    // Check post limits for signed-in users
    if (session?.user?.id) {
      try {
        const limitResponse = await canPost(session.user.id);
        
        if (!limitResponse.canPost) {
          toast.error(
            t('share.limitReached'),
            {
              duration: 5000,
              action: {
                label: t('share.upgrade'),
                onClick: () => setIsSubscriptionModalOpen(true),
              },
            }
          );
          return;
        }
      } catch (error) {
        console.error('Failed to check post limit:', error);
      }
    }
    
    setIsSharing(true);
    try {
      let imageUrl: string | undefined;
      let imageAspect: 'square' | 'wide' | 'portrait' | undefined;

      if (selectedImage) {
        if (!session?.user?.id) {
          toast.error(t('share.imageRequiresAuth') || 'Sign in to upload images');
          return;
        }
        const { compressImageForUpload } = await import('../utils/image-compress');
        const compressed = await compressImageForUpload(selectedImage);
        const { url } = await uploadPostImage(compressed.dataUrl);
        imageUrl = url;
        imageAspect = getImageAspect(compressed.width, compressed.height);
      }

      await createPost({
        content: thought,
        languages: [language],
        isAnonymous: isAnonymous,
        userId: session?.user?.id,
        categories: selectedCategories,
        imageUrl,
        imageAspect,
      });
      
      if (session?.user?.id) {
        await incrementPostCount(session.user.id);
        await loadLimits();
      }
      
      toast.success(isAnonymous ? t('share.success') : t('share.publicSuccess'));
      setThought('');
      setSelectedCategories(['General']);
      setIsAnonymous(true);
      removeImage();
    } catch (error) {
      console.error('Failed to share secret:', error);
      toast.error(t('share.shareError'));
    } finally {
      setIsSharing(false);
    }
  };

  const handleAcceptGuidelines = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem(GUIDELINES_KEY, 'true');
    }
    setShowGuidelines(false);
    executeShare();
  };

  const session = getSession();
  const tier = subscription?.tier || 'free';

  return (
    <div className="h-full overflow-hidden flex flex-col bg-gradient-to-br from-purple-50/30 via-fuchsia-50/30 to-pink-50/30 dark:from-purple-950/20 dark:via-fuchsia-950/20 dark:to-pink-950/20">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 pb-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center pt-2"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-3xl mb-3 shadow-lg">
              <PenLine className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-foreground mb-1 flex items-center justify-center gap-2">
              {t('share.title')}
              {tier === 'premium' && (
                <Badge className="bg-gradient-to-r from-purple-600 to-fuchsia-600 border-0">
                  <Crown className="w-3 h-3 mr-1" />
                  {t('tier.premium')}
                </Badge>
              )}
              {tier === 'pro' && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {t('tier.pro')}
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('share.subtitle')}
            </p>
          </motion.div>

          {/* Post Limit Counter */}
          {session?.user?.id && !isLoadingLimits && postLimit && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-3 border border-purple-200 dark:border-purple-800 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('share.postsMonth')}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${
                    postLimit.postsRemaining <= 1 ? 'text-red-500' : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {postLimit.postsThisMonth} / {postLimit.monthlyPostLimit}
                  </span>
                  {postLimit.postsRemaining <= 1 && postLimit.tier === 'free' && (
                    <Button
                      size="sm"
                      onClick={() => setIsSubscriptionModalOpen(true)}
                      className="h-7 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-xs"
                    >
                      {t('share.upgrade')}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-purple-100 dark:border-purple-900"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-semibold text-foreground">{t('share.selectCategories')}</h3>
                <span className="text-xs text-muted-foreground">({selectedCategories.length}/3)</span>
              </div>
              <button
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              >
                {showCategoryPicker ? t('share.hide') : t('share.showAll')}
              </button>
            </div>

            {/* Selected Categories */}
            <div className="flex flex-wrap gap-2 mb-2">
              {selectedCategories.map(catName => {
                const cat = categories.find(c => c.name === catName);
                if (!cat) return null;
                return (
                  <button
                    key={catName}
                    onClick={() => toggleCategory(catName)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      cat.hot
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                    }`}
                  >
                    {(() => {
                      const IconComp = getCategoryIcon(cat.name);
                      return <IconComp className="w-3.5 h-3.5" />;
                    })()}
                    {getCategoryTranslation(cat.name)}
                    {selectedCategories.length > 1 && (
                      <X className="w-3 h-3 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category Picker */}
            <AnimatePresence>
              {showCategoryPicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="max-h-40 overflow-y-auto scrollbar-hide border-t border-gray-200 dark:border-gray-700 pt-3"
                >
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => {
                      const isSelected = selectedCategories.includes(cat.name);
                      if (isSelected) return null; // Don't show already selected
                      
                      return (
                        <button
                          key={cat.name}
                          onClick={() => toggleCategory(cat.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            cat.hot
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 border border-orange-300 dark:border-orange-700'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {(() => {
                            const IconComp = getCategoryIcon(cat.name);
                            return <IconComp className="w-3.5 h-3.5" />;
                          })()}
                          {getCategoryTranslation(cat.name)}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Anonymous/Public Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-purple-100 dark:border-purple-900"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-semibold text-foreground">{t('share.privacy')}</h3>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsAnonymous(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  isAnonymous
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                {t('share.anonymous')}
              </button>
              <button
                onClick={() => setIsAnonymous(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                  !isAnonymous
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <User className="w-4 h-4" />
                {t('share.public')}
              </button>
            </div>

            {/* Public Post Warning */}
            <AnimatePresence>
              {!isAnonymous && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200 dark:border-amber-800"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-amber-800 dark:text-amber-200 font-medium mb-1">
                      {t('share.publicWarningTitle')}
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      {t('share.publicWarningDesc')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Main Writing Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative"
          >
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border-2 border-purple-100 dark:border-purple-900">
              <Textarea
                value={thought}
                onChange={(e) => setThought(e.target.value)}
                placeholder={t('share.placeholder')}
                className="min-h-[200px] border-0 focus-visible:ring-0 text-foreground placeholder:text-muted-foreground resize-none text-base"
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {!selectedImage ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                    >
                      <ImagePlus className="w-3 h-3" />
                      {t('share.addPhoto')}
                    </button>
                  ) : (
                    <div className="relative inline-block">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-200 dark:border-purple-700">
                        <img src={imagePreviewUrl!} alt="" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => setShowExamples(!showExamples)}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1"
                  >
                    <Lightbulb className="w-3 h-3" />
                    {showExamples ? t('share.hideExamples') : t('share.showExamples')}
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {thought.length}/1000
                </span>
              </div>

              {/* Examples Dropdown */}
              <AnimatePresence>
                {showExamples && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-900"
                  >
                    <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                      {t('share.needInspiration')}
                    </p>
                    <div className="space-y-1.5">
                      {EXAMPLES.map((example, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => {
                            setThought(example);
                            setShowExamples(false);
                          }}
                          className="w-full text-left text-xs text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 p-2 rounded-lg transition-colors"
                        >
                          • {example}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Guidelines Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <p>
              {t('share.guidelinesNotice')}
            </p>
          </motion.div>

          {/* Share Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              onClick={handleShare}
              disabled={!thought.trim() || isSharing || selectedCategories.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white py-7 rounded-2xl shadow-2xl shadow-purple-500/50 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              {isSharing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t('share.button.sharing')}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {isAnonymous ? t('share.button.anonymous') : t('share.button.public')}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Community Guidelines Dialog */}
      <Dialog open={showGuidelines} onOpenChange={setShowGuidelines}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center">{t('guidelines.title')}</DialogTitle>
            <DialogDescription className="text-center">
              {t('guidelines.subtitle')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <span className="text-purple-600 dark:text-purple-400 mt-0.5">•</span>
              <p className="text-sm text-foreground">{t('guidelines.compact.anonymity')}</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <p className="text-sm text-foreground">{t('guidelines.compact.purpose')}</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
              <p className="text-sm text-foreground">{t('guidelines.compact.profanity')}</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
              <p className="text-sm text-foreground">{t('guidelines.compact.respect')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox 
              id="dontShow" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label
              htmlFor="dontShow"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              {t('share.dialog.dontShow')}
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGuidelines(false)}
              className="flex-1"
            >
              {t('share.dialog.cancel')}
            </Button>
            <Button
              onClick={handleAcceptGuidelines}
              className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600"
            >
              {t('share.dialog.accept')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        userId={session?.user?.id || ''}
        currentTier={tier}
        currentCredits={subscription?.credits || 0}
        onSubscriptionUpdate={loadLimits}
      />
    </div>
  );
}
