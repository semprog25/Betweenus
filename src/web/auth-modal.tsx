import { useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import logoImage from '../assets/betweenus-logo.png'
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } from '../utils/auth'
import { notifyAuthChanged } from './use-auth-state'
import { isNativeMobile } from '../utils/platform'

interface AuthModalProps {
  open: boolean
  mode: 'login' | 'signup'
  onClose: () => void
  onModeChange: (mode: 'login' | 'signup') => void
}

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    setError('')
    setShowEmail(false)
    setPassword('')
    const timer = window.setTimeout(() => closeButtonRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [open, mode])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('bu-auth-open')

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.documentElement.classList.remove('bu-auth-open')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const handleEmailAuth = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and a password with at least 6 characters.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const result = mode === 'signup'
        ? await signUpWithEmail(email.trim(), password, name.trim() || undefined)
        : await signInWithEmail(email.trim(), password)
      if (!result?.access_token || !result?.user) {
        setError(result?.error || 'Authentication failed.')
        return
      }
      notifyAuthChanged()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await signInWithGoogle()
      if (!isNativeMobile()) notifyAuthChanged()
    } catch {
      setError('Google sign-in failed.')
      setIsSubmitting(false)
    }
  }

  const handleApple = async () => {
    setError('')
    setIsSubmitting(true)
    try {
      await signInWithApple()
      if (!isNativeMobile()) notifyAuthChanged()
    } catch {
      setError('Apple sign-in is not available yet on this device.')
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div
      className="bu-auth-overlay"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        className="bu-auth-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="bu-auth-close"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="bu-auth-brand">
          <img src={logoImage} alt="Between Us" className="bu-auth-logo" />
        </div>

        <h2 id="auth-modal-title" className="bu-auth-title">
          {mode === 'signup' ? 'Sign up' : 'Log in'}
        </h2>
        <p className="bu-auth-subtitle">
          Your real identity doesn&apos;t have to be your public identity.
        </p>

        <div className="bu-auth-actions">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="bu-auth-provider-btn"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleApple}
            disabled={isSubmitting}
            className="bu-auth-provider-btn"
          >
            Continue with Apple
          </button>
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="bu-auth-provider-btn"
          >
            Continue with Email
          </button>
        </div>

        {showEmail && (
          <div className="bu-auth-email-fields">
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name (optional)"
                aria-label="Name"
                className="bu-auth-input"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              aria-label="Email"
              className="bu-auth-input"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password (min 6 characters)"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              aria-label="Password"
              className="bu-auth-input"
            />
            <button
              type="button"
              onClick={handleEmailAuth}
              disabled={isSubmitting}
              className="bu-auth-submit"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </div>
        )}

        {error && (
          <p className="bu-auth-error" role="alert">{error}</p>
        )}

        <p className="bu-auth-switch">
          {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            className="bu-auth-switch-btn"
            onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')}
          >
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
