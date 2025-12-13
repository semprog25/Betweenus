import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Shield } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicy({ isOpen, onClose }: PrivacyPolicyProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/30 border-2 border-purple-200 dark:border-purple-500/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Privacy Policy
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            How we protect your privacy and data
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-4 space-y-6 text-sm text-gray-700 dark:text-gray-300 max-h-[60vh]">
          <div>
            <p className="text-gray-600 dark:text-gray-400 italic mb-4">
              Last Updated: November 12, 2025
            </p>
          </div>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">1. Introduction</h3>
            <p className="mb-2">
              Welcome to Between Us. We are committed to protecting your privacy and ensuring your experience is safe and anonymous. This Privacy Policy explains how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">2. Information We Collect</h3>
            <p className="mb-2"><strong>Account Information:</strong></p>
            <ul className="list-disc list-inside ml-4 mb-3 space-y-1">
              <li>Email address (for authentication only)</li>
              <li>Username/display name (optional)</li>
              <li>Profile picture (optional)</li>
              <li>Language preferences</li>
            </ul>
            
            <p className="mb-2"><strong>Content You Share:</strong></p>
            <ul className="list-disc list-inside ml-4 mb-3 space-y-1">
              <li>Mental wellness check-ins and mood entries</li>
              <li>Anonymous posts and thoughts</li>
              <li>Replies to community posts</li>
              <li>Upvotes and interactions</li>
            </ul>
            
            <p className="mb-2"><strong>Usage Information:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Login streaks and activity patterns</li>
              <li>Subscription tier and payment information (processed securely)</li>
              <li>Device information and analytics for app improvement</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">3. How We Use Your Information</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>To provide and improve our mental wellness services</li>
              <li>To enable anonymous community support features</li>
              <li>To track your wellness journey and streaks</li>
              <li>To manage your subscription and billing</li>
              <li>To send important account and service notifications</li>
              <li>To ensure platform safety and prevent abuse</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">4. Anonymity & Privacy</h3>
            <p className="mb-2">
              Between Us is designed with anonymity at its core:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Anonymous Posts:</strong> Your secrets and check-ins are never linked to your email or real identity</li>
              <li><strong>Private Data:</strong> Your mood entries and wellness data are private by default</li>
              <li><strong>Secure Storage:</strong> All data is encrypted and stored securely using Supabase</li>
              <li><strong>No PII Collection:</strong> We do not collect personally identifiable information beyond what's necessary for authentication</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">5. Data Sharing</h3>
            <p className="mb-2">
              We do NOT sell your data. We only share information:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>When required by law or legal process</li>
              <li>With service providers (Supabase) who help us operate the app</li>
              <li>To protect the safety of our users and the public</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">6. Data Security</h3>
            <p className="mb-2">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure authentication via Supabase</li>
              <li>Regular security audits and updates</li>
              <li>Automatic data backups to prevent loss</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">7. Your Rights</h3>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Access your personal data</li>
              <li>Request data correction or deletion</li>
              <li>Export your data</li>
              <li>Opt-out of non-essential communications</li>
              <li>Delete your account at any time</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">8. Data Retention</h3>
            <p className="mb-2">
              We retain your data for as long as your account is active. If you delete your account, we will permanently delete your data within 30 days, except where required by law to retain certain information.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">9. Children's Privacy</h3>
            <p className="mb-2">
              Between Us is not intended for users under 13 years of age. We do not knowingly collect information from children under 13. If you are a parent or guardian and believe your child has provided us with information, please contact us immediately.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">10. International Users</h3>
            <p className="mb-2">
              If you are accessing Between Us from outside the United States, please note that your information may be transferred to and stored in the United States or other countries where our service providers operate.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">11. Updates to This Policy</h3>
            <p className="mb-2">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy and updating the "Last Updated" date. Your continued use of Between Us after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">12. Contact Us</h3>
            <p className="mb-2">
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Email: privacy@betweenus.app</li>
              <li>Through the app's "Send Feedback" feature</li>
            </ul>
          </section>

          <section className="border-t border-purple-200 dark:border-purple-500/30 pt-4">
            <p className="text-center text-gray-500 dark:text-gray-400 italic">
              Your privacy and mental wellness are our top priorities. 💜
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}