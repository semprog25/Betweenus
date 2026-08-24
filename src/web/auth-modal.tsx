import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
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

  useEffect(() => {
    if (!open) return
    setError('')
    setShowEmail(false)
    setPassword('')
  }, [open, mode])

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-fuchsia-500/20 bg-[#0c0a12] p-6 shadow-2xl shadow-fuchsia-950/40">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="auth-modal-title" className="font-[Syne,system-ui,sans-serif] text-2xl font-bold text-white">
          {mode === 'signup' ? 'Sign up' : 'Log in'}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Your real identity doesn&apos;t have to be your public identity.
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="rounded-xl border border-fuchsia-500/25 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-fuchsia-500/10 disabled:opacity-60"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={handleApple}
            disabled={isSubmitting}
            className="rounded-xl border border-fuchsia-500/25 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-fuchsia-500/10 disabled:opacity-60"
          >
            Continue with Apple
          </button>
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="rounded-xl border border-fuchsia-500/25 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-fuchsia-500/10"
          >
            Continue with Email
          </button>
        </div>

        {showEmail && (
          <div className="mt-4 flex flex-col gap-2.5">
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name (optional)"
                aria-label="Name"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-500/50"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              autoComplete="email"
              aria-label="Email"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-500/50"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password (min 6 characters)"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              aria-label="Password"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-fuchsia-500/50"
            />
            <button
              type="button"
              onClick={handleEmailAuth}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>
        )}

        <p className="mt-5 text-center text-sm text-zinc-500">
          {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            className="text-fuchsia-300 underline-offset-2 hover:underline"
            onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')}
          >
            {mode === 'signup' ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}
