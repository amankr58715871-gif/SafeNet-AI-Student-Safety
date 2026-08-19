import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft,
  User, Phone, GraduationCap, IdCard, Contact,
} from 'lucide-react'
import { useAuth } from '../lib/auth'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    college: '',
    studentId: '',
    emergencyName: '',
    emergencyPhone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validate(): string | null {
    if (!form.fullName.trim()) return 'Please enter your full name.'
    if (!form.email.trim()) return 'Please enter your email.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.'
    if (!form.phone.trim()) return 'Please enter your phone number.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (!form.college.trim()) return 'Please enter your college/university.'
    if (!form.studentId.trim()) return 'Please enter your student ID.'
    if (!form.emergencyName.trim()) return 'Please enter an emergency contact name.'
    if (!form.emergencyPhone.trim()) return 'Please enter an emergency contact phone.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setLoading(true)
    const { error } = await signUp(form.email, form.password, {
      full_name: form.fullName,
      phone: form.phone,
      college: form.college,
      student_id: form.studentId,
      emergency_contact_name: form.emergencyName,
      emergency_contact_phone: form.emergencyPhone,
    })
    setLoading(false)
    if (error) {
      setError(error.includes('already') ? 'An account with this email already exists. Try signing in.' : error)
      return
    }
    setSuccess(true)
    setTimeout(() => navigate('/app/dashboard'), 1500)
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
        <div className="card w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
            <Shield className="h-7 w-7 text-success-600 dark:text-success-400" />
          </div>
          <h1 className="text-xl font-bold">Account Created!</h1>
          <p className="mt-2 text-sm text-neutral-500">Welcome to SafeNet AI. Redirecting you to your dashboard...</p>
          <div className="mt-4 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="w-full max-w-lg">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold">SafeNet AI</span>
        </Link>

        <div className="card p-6">
          <h1 className="text-xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-neutral-500">Join SafeNet AI — your personal safety companion.</p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Aman Sharma" className="input pl-10" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@college.edu" className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765 43210" className="input pl-10" />
                </div>
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 6 characters" className="input px-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">College / University</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input value={form.college} onChange={(e) => update('college', e.target.value)} placeholder="Delhi University" className="input pl-10" />
                </div>
              </div>
              <div>
                <label className="label">Student ID</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input value={form.studentId} onChange={(e) => update('studentId', e.target.value)} placeholder="DU2024001" className="input pl-10" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/30">
              <p className="mb-2 text-xs font-semibold text-neutral-500">Emergency Contact</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label text-xs">Contact Name</label>
                  <div className="relative">
                    <Contact className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input value={form.emergencyName} onChange={(e) => update('emergencyName', e.target.value)} placeholder="Mother / Father" className="input pl-10" />
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input value={form.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)} placeholder="+91 98765 43210" className="input pl-10" />
                  </div>
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>

        <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-sm text-neutral-500 hover:text-neutral-700">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    </div>
  )
}
