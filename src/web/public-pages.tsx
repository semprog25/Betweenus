import type { ReactNode } from 'react'
import {
  CANONICAL_SITE_URL,
  HAS_APP_STORE_LISTING,
  LEGAL_EMAIL,
  PLAY_STORE_URL,
  PRIVACY_EMAIL,
  SUPPORT_EMAIL,
} from '../config/site'

function PublicPageShell({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="bu-public-page" aria-labelledby="public-page-title">
      <h1 id="public-page-title" className="bu-public-page-title">{title}</h1>
      <div className="bu-public-page-body">{children}</div>
    </section>
  )
}

function PublicPageSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bu-public-page-section">
      <h2 className="bu-public-page-heading">{title}</h2>
      {children}
    </div>
  )
}

export function AboutPage() {
  return (
    <PublicPageShell title="About Between Us">
      <p className="bu-public-page-lead">
        Between Us is an anonymous community for sharing stories you cannot say anywhere else —
        relationship secrets, hidden truths, and the things you need to get off your chest without performing for an audience.
      </p>

      <PublicPageSection title="What you can do">
        <ul className="bu-public-page-list">
          <li><strong>Spill</strong> — write anonymous text-and-image stories</li>
          <li><strong>Discover</strong> — browse community stories on the web or in the app</li>
          <li><strong>React</strong> — vote and reply when signed in</li>
          <li><strong>Check in privately</strong> — personal mood check-ins stay separate from public posts</li>
        </ul>
      </PublicPageSection>

      <PublicPageSection title="Why anonymity">
        <p>
          Some truths are easier to share when your name is not attached. Between Us separates your account
          (used to sign in) from what you publish publicly as Anonymous. That lets you be honest without
          building a personal brand around your most vulnerable moments.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Availability">
        <p>
          Between Us is available on Android via Google Play
          {HAS_APP_STORE_LISTING ? ' and on iOS via the App Store.' : '. An iOS release is in progress — the App Store listing is coming soon.'}
          {' '}You can also use the authenticated web experience at{' '}
          <a href={`${CANONICAL_SITE_URL}/app`} className="bu-public-page-link">{CANONICAL_SITE_URL}/app</a>
          {' '}after signing in.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Contact">
        <p>
          Questions? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="bu-public-page-link">{SUPPORT_EMAIL}</a>.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  )
}

export function PrivacyPage() {
  return (
    <PublicPageShell title="Privacy">
      <p className="bu-public-page-lead">
        This summary describes how Between Us handles data on the public website and in the app.
        It is not a substitute for legal counsel.
      </p>

      <PublicPageSection title="Account information">
        <p>
          When you sign up, we collect the information required to authenticate you — typically an email address
          and, if you choose, a display name. OAuth providers (Google, Apple) may share basic profile details
          according to their policies.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Stories, reactions & comments">
        <p>
          Public posts you publish appear as <strong>Anonymous</strong> to other users. Your account email is not
          shown on posts. Community votes, replies, and story metadata are stored so the service can operate.
          Anonymity on a public platform is a design goal — not an absolute guarantee against all forms of identification.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Private check-ins & personal journal">
        <p>
          Personal check-ins and private journal entries in the app are separate from the public community feed.
          They are not displayed on the public marketing website.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Infrastructure">
        <p>
          Between Us uses Supabase for authentication and data storage. Service providers process data as needed
          to host and secure the product. We do not sell personal data.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Your choices">
        <p>
          You can sign out at any time. Account deletion and data requests can be initiated through in-app settings
          where available, or by contacting us. For privacy-specific questions email{' '}
          <a href={`mailto:${PRIVACY_EMAIL}`} className="bu-public-page-link">{PRIVACY_EMAIL}</a>.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  )
}

export function SupportPage() {
  return (
    <PublicPageShell title="Support">
      <p className="bu-public-page-lead">
        Need help with Between Us? We are here for account, app, and community questions.
      </p>

      <PublicPageSection title="Common topics">
        <ul className="bu-public-page-list">
          <li>Account &amp; login (Google, Apple, email)</li>
          <li>Reading and writing stories (Spill)</li>
          <li>Privacy and anonymity</li>
          <li>Reporting content</li>
          <li>App issues on Android or iOS</li>
        </ul>
      </PublicPageSection>

      <PublicPageSection title="Contact support">
        <p>
          Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="bu-public-page-link">{SUPPORT_EMAIL}</a>.
          {' '}If you use the app, you can also send feedback from Settings → Feedback.
        </p>
        <p>
          Privacy-specific requests:{' '}
          <a href={`mailto:${PRIVACY_EMAIL}`} className="bu-public-page-link">{PRIVACY_EMAIL}</a>
        </p>
      </PublicPageSection>

      <PublicPageSection title="Crisis resources">
        <p>
          Between Us is a peer community — not emergency or clinical care. If you are in crisis,
          contact local emergency services or a crisis helpline in your country.
        </p>
      </PublicPageSection>
    </PublicPageShell>
  )
}

export function TermsPage() {
  return (
    <PublicPageShell title="Terms">
      <p className="bu-public-page-lead">
        By using Between Us you agree to participate respectfully and lawfully in our anonymous community.
      </p>

      <PublicPageSection title="Community standards">
        <ul className="bu-public-page-list">
          <li>Do not dox, harass, or threaten others</li>
          <li>Do not post hate speech or content targeting protected groups</li>
          <li>Do not use Between Us as a substitute for professional medical or mental-health care</li>
          <li>Respect intellectual property and applicable laws in your jurisdiction</li>
        </ul>
      </PublicPageSection>

      <PublicPageSection title="Your content">
        <p>
          You retain ownership of content you post. You grant Between Us the rights needed to host, display,
          and moderate it within the service. We may remove content that violates these terms or applicable law.
        </p>
      </PublicPageSection>

      <PublicPageSection title="Contact">
        <p>
          Legal inquiries:{' '}
          <a href={`mailto:${LEGAL_EMAIL}`} className="bu-public-page-link">{LEGAL_EMAIL}</a>
        </p>
      </PublicPageSection>
    </PublicPageShell>
  )
}

function GooglePlayIcon() {
  return (
    <svg className="bu-store-badge-icon bu-store-badge-icon--google" viewBox="0 0 512 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M325.3 234.3L104.6 14l280.8 161.2-60.1 59.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 498l280.8-161.2-60.1-59.1L104.6 498z"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="bu-store-badge-icon bu-store-badge-icon--apple" viewBox="0 0 384 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.1-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72-23.1 1.4-50 15.6-66.2 33.2-18.2 19.7-28.2 43.9-26.2 69.5 26.7 2 52-13.7 68.4-30.5z"
      />
    </svg>
  )
}

export function StoreButtons({ className = '' }: { className?: string }) {
  return (
    <div className={`bu-store-buttons${className ? ` ${className}` : ''}`}>
      {HAS_APP_STORE_LISTING ? (
        <a href="#" className="bu-store-badge bu-store-badge--apple">
          <AppleIcon />
          <span className="bu-store-badge-text">
            <span className="bu-store-badge-label">Download on the</span>
            <span className="bu-store-badge-name">App Store</span>
          </span>
        </a>
      ) : (
        <span className="bu-store-badge bu-store-badge--apple" aria-label="App Store — listing coming soon">
          <AppleIcon />
          <span className="bu-store-badge-text">
            <span className="bu-store-badge-label">Download on the</span>
            <span className="bu-store-badge-name">App Store</span>
          </span>
        </span>
      )}
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="bu-store-badge bu-store-badge--google"
      >
        <GooglePlayIcon />
        <span className="bu-store-badge-text">
          <span className="bu-store-badge-label">Get it on</span>
          <span className="bu-store-badge-name">Google Play</span>
        </span>
      </a>
    </div>
  )
}
