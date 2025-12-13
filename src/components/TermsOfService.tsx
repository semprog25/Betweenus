import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FileText } from 'lucide-react';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsOfService({ isOpen, onClose }: TermsOfServiceProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950/30 border-2 border-purple-200 dark:border-purple-500/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Terms of Service
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Our terms and conditions for using Between Us
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto pr-4 space-y-6 text-sm text-gray-700 dark:text-gray-300 max-h-[60vh]">
          <div>
            <p className="text-gray-600 dark:text-gray-400 italic mb-4">
              Last Updated: November 12, 2025
            </p>
          </div>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">1. Acceptance of Terms</h3>
            <p className="mb-2">
              By accessing and using Between Us, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this app.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">2. Description of Service</h3>
            <p className="mb-2">
              Between Us is an anonymous mental wellness and support platform that provides:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Daily mental health check-ins and mood tracking</li>
              <li>Anonymous sharing of thoughts and experiences</li>
              <li>Community support and peer interactions</li>
              <li>Wellness tracking and gamification features</li>
              <li>Multi-language support (6 languages)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">3. User Accounts</h3>
            <p className="mb-2"><strong>Account Creation:</strong></p>
            <ul className="list-disc list-inside ml-4 mb-3 space-y-1">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 13 years old to use Between Us</li>
              <li>One person may only maintain one account</li>
            </ul>
            
            <p className="mb-2"><strong>Account Security:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized account access</li>
              <li>You are responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">4. Subscription Plans</h3>
            <p className="mb-2">Between Us offers three subscription tiers:</p>
            <ul className="list-disc list-inside ml-4 mb-3 space-y-1">
              <li><strong>Free:</strong> 3 posts per month</li>
              <li><strong>Premium:</strong> 10 posts per month + 10 edit credits</li>
              <li><strong>Pro:</strong> Unlimited posts and edits</li>
            </ul>
            
            <p className="mb-2"><strong>Billing:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Subscriptions are billed according to the plan you select (daily, weekly, monthly, yearly, or lifetime)</li>
              <li>All payments are processed securely through our payment provider</li>
              <li>Subscriptions automatically renew unless canceled</li>
              <li>Refunds are handled on a case-by-case basis</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">5. User Conduct & Community Guidelines</h3>
            <p className="mb-2">You agree NOT to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Post harmful, abusive, or threatening content</li>
              <li>Share content that violates others' privacy</li>
              <li>Impersonate others or misrepresent your identity</li>
              <li>Spam, advertise, or promote commercial content</li>
              <li>Share explicit sexual content</li>
              <li>Post content encouraging self-harm or suicide</li>
              <li>Harass, bully, or discriminate against others</li>
              <li>Attempt to hack, disrupt, or abuse the service</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">6. Content Ownership & Rights</h3>
            <p className="mb-2"><strong>Your Content:</strong></p>
            <ul className="list-disc list-inside ml-4 mb-3 space-y-1">
              <li>You retain ownership of content you post</li>
              <li>By posting, you grant us a license to display and distribute your content within the app</li>
              <li>You are responsible for the content you share</li>
            </ul>
            
            <p className="mb-2"><strong>Our Content:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>All app features, designs, and branding are owned by Between Us</li>
              <li>You may not copy, modify, or distribute our content without permission</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">7. Content Moderation</h3>
            <p className="mb-2">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Review, remove, or hide content that violates these terms</li>
              <li>Suspend or terminate accounts for violations</li>
              <li>Report illegal content to authorities</li>
              <li>Use automated and manual moderation systems</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">8. Mental Health Disclaimer</h3>
            <p className="mb-2 text-red-600 dark:text-red-400 font-semibold">
              IMPORTANT: Between Us is NOT a substitute for professional mental health care.
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Our app provides peer support, not professional therapy</li>
              <li>If you are in crisis, please contact emergency services or a crisis hotline immediately</li>
              <li>We are not liable for advice or support provided by community members</li>
              <li>Always consult qualified mental health professionals for serious concerns</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">9. Limitation of Liability</h3>
            <p className="mb-2">
              Between Us and its creators are not liable for:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Any damages resulting from use of the app</li>
              <li>Loss of data or service interruptions</li>
              <li>Third-party content or user interactions</li>
              <li>Actions taken based on app content</li>
            </ul>
            <p className="mt-2">
              The service is provided "as is" without warranties of any kind.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">10. Termination</h3>
            <p className="mb-2">
              We may terminate or suspend your account:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>For violations of these Terms of Service</li>
              <li>For illegal activity or abuse</li>
              <li>At our discretion, with or without notice</li>
            </ul>
            <p className="mt-2">
              You may delete your account at any time through the app settings.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">11. Changes to Terms</h3>
            <p className="mb-2">
              We reserve the right to modify these terms at any time. Material changes will be communicated through the app. Continued use after changes constitutes acceptance of updated terms.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">12. Governing Law</h3>
            <p className="mb-2">
              These terms are governed by the laws of the United States. Any disputes will be resolved in accordance with these laws.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">13. Contact Information</h3>
            <p className="mb-2">
              For questions about these Terms of Service:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Email: support@betweenus.app</li>
              <li>Use the "Send Feedback" feature in the app</li>
            </ul>
          </section>

          <section className="border-t border-purple-200 dark:border-purple-500/30 pt-4">
            <p className="text-center text-gray-500 dark:text-gray-400 italic">
              Thank you for being part of the Between Us community. Together, we create a safe space for mental wellness. 💜
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}