import React from 'react';
import { LandingPages } from '../landing-pages';

/**
 * Landing Page Preview Component
 * 
 * This component renders the full landing page system.
 * It includes:
 * - Home page with waitlist signup
 * - Privacy Policy
 * - Terms of Service
 * - Support page with contact form
 * 
 * All pages are fully responsive and save data to Supabase.
 * 
 * To use in production:
 * 1. Deploy these pages to your domain: betweenus.semprog.de
 * 2. Configure your router to serve landing pages at the root or /landing path
 * 3. Use these URLs in app store submissions:
 *    - Privacy Policy: https://betweenus.semprog.de/landing/privacy
 *    - Terms of Service: https://betweenus.semprog.de/landing/terms
 *    - Support: https://betweenus.semprog.de/landing/support
 */
export function LandingPagePreview() {
  return <LandingPages />;
}
