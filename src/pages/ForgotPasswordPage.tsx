import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">SafeNet AI</span>
        </Link>

        <div className="card p-6">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                <CheckCircle className="h-7 w-7 text-success-600 dark:text-success-400" />
              </div>
              <h1 className="text-xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-neutral-500">
                We've sent a password reset link to <span className="font-semibold">{email}</span>.
                Follow the link in the email to reset your password.
              </p>
              <Link to="/login" className="btn-secondary mt-6 w-full">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold">Forgot password?</h1>
              <p className="mt-1 text-sm text-neutral-500">Enter your email and we'll send you a reset link.</p>

              {error && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" className="input pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <Link to="/login" className="mt-4 flex items-center justify-center gap-1 text-sm text-neutral-500 hover:text-neutral-700">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  )
}
