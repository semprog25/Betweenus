import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, Settings, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { callServer } from '../utils/supabase/client';
import { getSession } from '../utils/auth';
import { useLanguage } from './LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailChange = async () => {
    if (!newEmail || !emailPassword) {
      toast.error(t('settings.fillAll'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error(t('settings.validEmail'));
      return;
    }

    setIsLoading(true);
    try {
      const session = getSession();
      if (!session) {
        toast.error(t('settings.signInEmail'));
        return;
      }

      const response = await callServer('/auth/change-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          newEmail,
          password: emailPassword,
        }),
      });

      if (response.success) {
        toast.success(t('settings.emailSuccess'));
        setNewEmail('');
        setEmailPassword('');
        onClose();
      } else {
        toast.error(response.error || t('settings.emailError'));
      }
    } catch (error: any) {
      console.error('Email change error:', error);
      toast.error(error.message || t('settings.emailError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.fillAll'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('settings.passwordLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordMatch'));
      return;
    }

    setIsLoading(true);
    try {
      const session = getSession();
      if (!session) {
        toast.error(t('settings.signInPassword'));
        return;
      }

      const response = await callServer('/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.success) {
        toast.success(t('settings.passwordSuccess'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        toast.error(response.error || t('settings.passwordError'));
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || t('settings.passwordError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const session = getSession();
    if (!session?.user?.email) {
      toast.error(t('settings.noEmail'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await callServer('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: session.user.email,
        }),
      });

      if (response.success) {
        toast.success(t('settings.resetSuccess'));
      } else {
        toast.error(response.error || t('settings.resetError'));
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || t('settings.resetError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/30 border-2 border-purple-200 dark:border-purple-500/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {t('settings.title')}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {t('settings.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white/50 dark:bg-gray-800/50 rounded-xl">
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'email'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            {t('settings.tab.email')}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'password'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            {t('settings.tab.password')}
          </button>
        </div>

        {/* Email Change Tab */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">{t('settings.email.new')}</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="your.email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-500/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-password">{t('settings.email.currentPassword')}</Label>
              <div className="relative">
                <Input
                  id="email-password"
                  type={showEmailPassword ? 'text' : 'password'}
                  placeholder={t('settings.email.currentPasswordPlaceholder')}
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-500/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailPassword(!showEmailPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleEmailChange}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.updating')}
                </>
              ) : (
                t('settings.email.update')
              )}
            </Button>
          </div>
        )}

        {/* Password Change Tab */}
        {activeTab === 'password' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t('settings.password.current')}</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder={t('settings.email.currentPasswordPlaceholder')}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-500/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">{t('settings.password.new')}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder={t('settings.password.newPlaceholder')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-500/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('settings.password.confirm')}</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={t('settings.password.confirmPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-500/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.updating')}
                </>
              ) : (
                t('settings.password.update')
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/30 text-gray-500 dark:text-gray-400">
                  {t('settings.password.or')}
                </span>
              </div>
            </div>

            <Button
              onClick={handlePasswordReset}
              disabled={isLoading}
              variant="outline"
              className="w-full border-purple-200 dark:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/20"
            >
              {t('settings.password.reset')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
