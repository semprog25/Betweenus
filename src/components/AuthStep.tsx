import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../utils/auth';
import { toast } from 'sonner';
import { useLanguage } from './LanguageContext';
import logoImage from '../assets/61e85109150cbed2459a2fcb26ff986c57b9767c.png';

// Apple logo SVG
const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

// Google logo SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

interface AuthStepProps {
  userName?: string;
  selectedLanguages: string[];
  onComplete: (skipAuth?: boolean) => void;
  onBack: () => void;
}

export function AuthStep({ userName, selectedLanguages, onComplete, onBack }: AuthStepProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthSetupWarningShown, setOauthSetupWarningShown] = useState(false);
  const [showAppleComingSoonDialog, setShowAppleComingSoonDialog] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error(t('auth.enterEmailPassword'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'signup') {
        const result = await signUpWithEmail(email, password, userName, selectedLanguages);
        
        if (result.success) {
          toast.success(t('auth.accountCreated'));
          onComplete();
        } else {
          // Check if user already exists
          if (result.code === 'EMAIL_EXISTS') {
            toast.error(t('auth.emailExists'));
            setActiveTab('login');
          } else {
            toast.error(result.error || 'Failed to create account');
          }
        }
      } else {
        const result = await signInWithEmail(email, password);
        
        if (result.success) {
          toast.success(t('auth.welcomeBackMessage'));
          onComplete();
        } else {
          toast.error(result.error || t('auth.invalidCredentials'));
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Handle quota exceeded errors specifically
      if (error?.name === 'QuotaExceededError') {
        toast.error(t('auth.storageQuota'));
      } else {
        toast.error(error.message || t('auth.authFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Show warning about OAuth setup
    if (!oauthSetupWarningShown) {
      toast.info(
        t('auth.googleSetup'),
        { duration: 8000 }
      );
      setOauthSetupWarningShown(true);
    }

    try {
      await signInWithGoogle();
      // OAuth will redirect, so we don't need to call onComplete here
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = t('auth.googleFailed');
      
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        errorMessage = t('auth.google403');
      } else if (error.message?.includes('redirect_uri_mismatch')) {
        errorMessage = 'Redirect URI mismatch. Please check your Google Cloud Console settings.';
      } else if (error.message?.includes('unauthorized_client')) {
        errorMessage = 'Google OAuth not properly configured. Please use Email/Password instead.';
      } else {
        errorMessage = error.message || t('auth.googleFailed');
      }
      
      toast.error(errorMessage, { duration: 6000 });
    }
  };

  const handleAppleSignIn = () => {
    // Show coming soon dialog
    setShowAppleComingSoonDialog(true);
  };

  const handleUseEmailInstead = () => {
    setShowAppleComingSoonDialog(false);
    setActiveTab('signup');
    toast.info(t('auth.emailPrompt'));
  };

  const handleSkip = () => {
    onComplete(true); // Skip auth
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full relative z-10"
    >
      <div className="bg-[#0f0f1e]/90 rounded-3xl p-6 backdrop-blur-sm border border-white/10">
        {/* Header */}
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-3"
          >
            <img 
              src={logoImage} 
              alt="Between Us" 
              className="h-12 w-auto"
            />
          </motion.div>
          
          <h1 className="text-white mb-1">
            {activeTab === 'signup' ? t('auth.createAccount') : t('auth.welcomeBack')}
          </h1>
          
          <p className="text-gray-400 text-sm">
            {activeTab === 'signup' 
              ? t('auth.signUpSubtitle')
              : t('auth.signInSubtitle')
            }
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 p-1 rounded-full">
            <TabsTrigger 
              value="signup" 
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white text-gray-400"
            >
              {t('auth.signUp')}
            </TabsTrigger>
            <TabsTrigger 
              value="login"
              className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white text-gray-400"
            >
              {t('auth.signIn')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Social Sign-In Buttons */}
        <div className="space-y-2 mb-4">
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full bg-white hover:bg-gray-100 text-gray-900 border-gray-300 h-10"
          >
            <GoogleIcon />
            <span className="ml-2">{t('auth.continueWithGoogle')}</span>
          </Button>

          <Button
            onClick={handleAppleSignIn}
            variant="outline"
            className="w-full bg-black hover:bg-gray-900 text-white border-gray-700 h-10"
          >
            <AppleIcon />
            <span className="ml-2">{t('auth.continueWithApple')}</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <Separator className="bg-gray-700" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-[#0f0f1e] px-2 text-gray-400 text-sm">{t('auth.or')}</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="email" className="text-gray-300 text-sm">{t('auth.email')}</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="pl-9 h-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-300 text-sm">{t('auth.password')}</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="pl-9 pr-10 h-10 bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleEmailAuth}
            disabled={isLoading}
            className="w-full h-10 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:opacity-90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {activeTab === 'signup' ? t('auth.creatingAccount') : t('auth.signingIn')}
              </>
            ) : (
              activeTab === 'signup' ? t('auth.createAccountButton') : t('auth.signInButton')
            )}
          </Button>
        </div>

        {/* Skip Button */}
        <div className="text-center mt-3">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {t('auth.skipForNow')}
          </button>
        </div>

        {/* Back Button */}
        <div className="flex justify-center mt-3">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-gray-400 hover:text-white h-8"
          >
            {t('checkin.back')}
          </Button>
        </div>
      </div>

      {/* Apple Sign-In Coming Soon Dialog */}
      <AlertDialog open={showAppleComingSoonDialog} onOpenChange={setShowAppleComingSoonDialog}>
        <AlertDialogContent className="bg-white dark:bg-gray-800 border-0">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2">
              <AppleIcon />
              {t('auth.appleDialog.title')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('auth.appleDialog.desc')}
              <br /><br />
              <strong>{t('auth.appleDialog.whyEmail')}</strong>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>{t('auth.appleDialog.reason1')}</li>
                <li>{t('auth.appleDialog.reason2')}</li>
                <li>{t('auth.appleDialog.reason3')}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 dark:border-gray-600">
              {t('auth.appleDialog.maybeLater')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUseEmailInstead}
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
            >
              {t('auth.useEmailInstead')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}