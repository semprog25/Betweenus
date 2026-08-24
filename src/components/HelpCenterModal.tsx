import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronRight, Search, HelpCircle, Shield, CreditCard, MessageCircle, Settings, Users, Heart, Award } from 'lucide-react';
import { motion } from 'motion/react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const helpCategories = [
  {
    icon: Heart,
    title: 'Getting Started',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    articles: [
      {
        question: 'How do I create an account?',
        answer: 'You can create an account by clicking "Sign Up" on the welcome screen. You can sign up with email/password, Google, or Apple. All your data will be securely stored and synced across devices.',
      },
      {
        question: 'Can I use Between Us anonymously?',
        answer: 'Yes! You can use Between Us without creating an account. Your posts and check-ins are always anonymous. However, creating an account allows you to sync your data across devices and access premium features.',
      },
      {
        question: 'What are daily check-ins?',
        answer: 'Daily check-ins let you track your mood and mental wellness. Select your main mood, add specific feelings, and write notes. Over time, you\'ll see patterns in your mood calendar and build login streaks for rewards.',
      },
    ],
  },
  {
    icon: Shield,
    title: 'Privacy & Safety',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    articles: [
      {
        question: 'Is my data secure?',
        answer: 'Yes! We use industry-standard encryption and secure Supabase infrastructure. Your data is encrypted in transit and at rest. We never sell your data and only store essential information.',
      },
      {
        question: 'How is my anonymity protected?',
        answer: 'Your posts and check-ins are never linked to your email or identity. We use anonymous user IDs for posts. Your profile information (name, picture) is optional and only visible to you.',
      },
      {
        question: 'How do I report harmful content?',
        answer: 'You can report any post or reply by clicking the three dots menu and selecting "Report". Our moderation team reviews all reports within 24 hours. Serious violations may result in account suspension.',
      },
      {
        question: 'What if I\'m in crisis?',
        answer: 'Between Us is NOT a substitute for professional help. If you\'re in crisis, please contact emergency services (911) or a crisis hotline immediately. National Suicide Prevention Lifeline: 988 (US)',
      },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Using the App',
    color: 'from-fuchsia-500 to-purple-500',
    bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    articles: [
      {
        question: 'How do I post a secret?',
        answer: 'Go to the "Share" tab, write your thought, and tap "Share Anonymously". Your post will be visible to the community, but your identity remains protected. You can edit or delete your posts anytime.',
      },
      {
        question: 'How can I support others?',
        answer: 'Open the Discover tab to browse community posts. Upvote posts you enjoy, downvote when appropriate, and leave comments to join the discussion. Remember to follow community guidelines.',
      },
      {
        question: 'What are language preferences?',
        answer: 'Between Us supports 6 languages. Set your preferences in the Profile tab. You\'ll see posts in your selected languages, making it easier to connect with others who speak your language.',
      },
      {
        question: 'How do I delete my posts?',
        answer: 'Go to your Profile > Secrets Shared > tap the post > Delete button. Deleted posts are permanently removed and cannot be recovered. Replies to your post will also be removed.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: 'Subscriptions & Billing',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    articles: [
      {
        question: 'What are the subscription tiers?',
        answer: 'FREE: 3 posts/month • PREMIUM ($4.99/mo): 10 posts + 10 edit credits • PRO ($9.99/mo): Unlimited posts & edits. All tiers include full check-in features and community access.',
      },
      {
        question: 'How do edit credits work?',
        answer: 'Edit credits let you modify your posts after publishing. Free users get 0 credits, Premium gets 10/month, Pro gets unlimited. You can also purchase credits separately (10 credits for $1.99).',
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'Go to Profile > Settings > Manage Subscription. You can cancel anytime and keep your benefits until the end of the billing period. No refunds for partial months.',
      },
      {
        question: 'What are points and how do I earn them?',
        answer: 'Points are rewards for engagement. Earn points through: Daily check-ins, Login streaks (1 point per 10 days), 5-star reviews on Play Store (50 points). Redeem points for premium features!',
      },
    ],
  },
  {
    icon: Award,
    title: 'Levels & Achievements',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    articles: [
      {
        question: 'What are user levels?',
        answer: 'User levels reflect your engagement in the community. Your level is calculated based on your total activity points (secrets shared + replies given + upvotes received). There are 5 levels: Level 1 "New Friend" (0-9 points), Level 2 "Rising Star" (10-24 points), Level 3 "Engaged Member" (25-49 points), Level 4 "Active Supporter" (50-99 points), and Level 5 "Community Leader" (100+ points). Your profile shows your current level, progress bar, and title!',
      },
      {
        question: 'How do I level up?',
        answer: 'Earn activity points by: Sharing secrets (1 point each), giving supportive replies (1 point each), and receiving upvotes on your posts (1 point each). You need 25 points to advance to the next level. Check your Profile page to see your current progress and how many points you need to level up!',
      },
      {
        question: 'What achievement badges are available?',
        answer: 'Storyteller (share 10+ secrets), Supportive Friend (give 25+ replies), Community Favorite (receive 50+ upvotes), Active Participant (both share and reply), and Veteran (30+ days as a member). Badges appear on your profile automatically when you meet the requirements. Keep engaging to collect them all!',
      },
      {
        question: 'Do levels and badges give me extra features?',
        answer: 'Levels and badges are primarily for recognition and motivation, showing your valuable contributions to the community. They don\'t unlock additional features, but they do showcase your journey and commitment to supporting others. Higher levels and more badges demonstrate you\'re a trusted, active member of our community!',
      },
      {
        question: 'Can I see other users\' levels and badges?',
        answer: 'No, levels and achievement badges are private and only visible on your own profile. This maintains anonymity in the community while still giving you personal goals and recognition for your engagement. Your posts and replies remain completely anonymous to others.',
      },
    ],
  },
  {
    icon: Users,
    title: 'Community Guidelines',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    articles: [
      {
        question: 'What content is not allowed?',
        answer: 'Prohibited: Harassment, hate speech, explicit sexual content, self-harm encouragement, spam, personal information sharing, impersonation, illegal activity. Violations may result in content removal or account suspension.',
      },
      {
        question: 'How should I support others?',
        answer: 'Be empathetic, non-judgmental, and kind. Share your experiences if helpful, but don\'t give medical advice. Validate feelings, offer hope, and remind others they\'re not alone. If someone is in crisis, encourage professional help.',
      },
      {
        question: 'Can I share personal information?',
        answer: 'No! Never share your or others\' personal information (full name, address, phone, email, social media). This protects everyone\'s privacy and safety. Posts with personal info will be removed.',
      },
    ],
  },
  {
    icon: Settings,
    title: 'Account & Settings',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    articles: [
      {
        question: 'How do I change my email or password?',
        answer: 'Go to Profile > Settings > Account Settings. You can update your email (requires password confirmation) or change your password (requires current password). A confirmation email will be sent.',
      },
      {
        question: 'How do I delete my account?',
        answer: 'Open Profile → Account Settings → Account tab → Delete account. Confirm by typing DELETE. Your profile and authentication data are removed; anonymous posts may remain untraceable.',
      },
      {
        question: 'Can I use Between Us on multiple devices?',
        answer: 'Yes! Sign in with your account on any device. Your profile, check-ins, posts, and subscription sync automatically. You can be signed in on multiple devices at once.',
      },
      {
        question: 'How do I enable dark mode?',
        answer: 'Between Us automatically follows your device\'s theme setting. Change your device to dark mode and the app will switch instantly. Both light and dark modes are fully supported.',
      },
    ],
  },
];

export function HelpCenterModal({ isOpen, onClose }: HelpCenterModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);

  const filteredCategories = searchQuery
    ? helpCategories.map(category => ({
        ...category,
        articles: category.articles.filter(article =>
          article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.articles.length > 0)
    : helpCategories;

  const handleBack = () => {
    setSelectedCategory(null);
    setExpandedArticle(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/30 border-2 border-purple-200 dark:border-purple-500/50 overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Help Center
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Find answers to common questions and learn how to use Between Us
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/50 dark:bg-gray-800/50 border-purple-200 dark:border-purple-500/30"
          />
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {selectedCategory === null ? (
            // Category List
            <div className="space-y-3">
              {filteredCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedCategory(index)}
                    className="w-full p-4 rounded-xl border-2 border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400 bg-white dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${category.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{category.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {category.articles.length} article{category.articles.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          ) : (
            // Article List
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="mb-2 border-purple-200 dark:border-purple-500/30"
              >
                ← Back to Categories
              </Button>
              
              {filteredCategories[selectedCategory]?.articles.map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800/50 rounded-xl border-2 border-purple-200 dark:border-purple-500/30 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedArticle(expandedArticle === index ? null : index)}
                    className="w-full p-4 text-left hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
                        {article.question}
                      </h4>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                          expandedArticle === index ? 'rotate-90' : ''
                        }`}
                      />
                    </div>
                  </button>
                  
                  {expandedArticle === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 text-gray-700 dark:text-gray-300 border-t border-purple-100 dark:border-purple-500/20 pt-4"
                    >
                      {article.answer}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchQuery && filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-600 dark:text-gray-400">
                No results found for "{searchQuery}"
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="mt-4 border-purple-200 dark:border-purple-500/30"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-purple-200 dark:border-purple-500/30 pt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Can't find what you're looking for?{' '}
            <button
              onClick={onClose}
              className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              Send us feedback
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}