import { motion } from 'motion/react';
import { Shield, UserX, MessageCircle, AlertTriangle } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface CommunityGuidelinesProps {
  compact?: boolean;
}

export function CommunityGuidelines({ compact = false }: CommunityGuidelinesProps) {
  const { t } = useLanguage();

  const guidelines = [
    {
      icon: UserX,
      title: t('guidelines.anonymity.title'),
      description: t('guidelines.anonymity.description'),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      icon: MessageCircle,
      title: t('guidelines.purpose.title'),
      description: t('guidelines.purpose.description'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: AlertTriangle,
      title: t('guidelines.profanity.title'),
      description: t('guidelines.profanity.description'),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
    },
    {
      icon: Shield,
      title: t('guidelines.respect.title'),
      description: t('guidelines.respect.description'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
  ];

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-2xl p-4 border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-purple-900 dark:text-purple-100 mb-2">
              {t('guidelines.title')}
            </h4>
            <ul className="space-y-1.5 text-sm text-purple-800 dark:text-purple-200">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                <span>{t('guidelines.compact.anonymity')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                <span>{t('guidelines.compact.purpose')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                <span>{t('guidelines.compact.profanity')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                <span>{t('guidelines.compact.respect')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-3xl p-8 border-0 shadow-lg"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-foreground mb-2">{t('guidelines.title')}</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('guidelines.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {guidelines.map((guideline, index) => (
          <motion.div
            key={guideline.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex gap-4 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"
          >
            <div className={`flex-shrink-0 w-12 h-12 ${guideline.bgColor} rounded-xl flex items-center justify-center`}>
              <guideline.icon className={`w-6 h-6 ${guideline.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-foreground mb-2">{guideline.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {guideline.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800"
      >
        <p className="text-sm text-amber-900 dark:text-amber-100 text-center">
          <strong>{t('guidelines.reminder.title')}:</strong> {t('guidelines.reminder.description')}
        </p>
      </motion.div>
    </motion.div>
  );
}
