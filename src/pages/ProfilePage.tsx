import { useState, useEffect } from 'react'
import {
  User, Mail, Phone, GraduationCap, IdCard, Contact, Edit2,
  X, Save, CheckCircle, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/utils'
import type { TrustedContact } from '../lib/types'

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', college: '', student_id: '',
    emergency_contact_name: '', emergency_contact_phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<TrustedContact[]>([])

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        college: profile.college ?? '',
        student_id: profile.student_id ?? '',
        emergency_contact_name: profile.emergency_contact_name ?? '',
        emergency_contact_phone: profile.emergency_contact_phone ?? '',
      })
    }
  }, [profile])

  useEffect(() => {
    if (!user) return
    supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .then(({ data }) => setContacts((data as TrustedContact[]) ?? []))
  }, [user])

  async function handleSave() {
    setError(null)
    setMsg(null)
    if (!form.name.trim()) { setError('Name cannot be empty.'); return }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        name: form.name,
        phone: form.phone || null,
        college: form.college || null,
        student_id: form.student_id || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
      })
      .eq('id', user!.id)
    setSaving(false)
    if (error) { setError('Could not save. Please try again.'); return }
    await refreshProfile()
    setEditing(false)
    setMsg('Profile updated successfully.')
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-neutral-500">Your account and safety information.</p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-300">
          <CheckCircle className="h-4 w-4" /> {msg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-300">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Avatar + name */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {profile?.name ? initials(profile.name) : '?'}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{profile?.name ?? 'Student'}</h2>
            <p className="text-sm text-neutral-500">{profile?.email}</p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm">
              <Edit2 className="h-4 w-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold">Personal Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!editing} className="input pl-10 disabled:opacity-60" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={profile?.email ?? ''} disabled className="input pl-10 opacity-60" />
            </div>
          </div>
          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={!editing} className="input pl-10 disabled:opacity-60" placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <label className="label">College / University</label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} disabled={!editing} className="input pl-10 disabled:opacity-60" />
            </div>
          </div>
          <div>
            <label className="label">Student ID</label>
            <div className="relative">
              <IdCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} disabled={!editing} className="input pl-10 disabled:opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Emergency contact */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold">Emergency Contact (from registration)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Contact Name</label>
            <div className="relative">
              <Contact className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} disabled={!editing} className="input pl-10 disabled:opacity-60" />
            </div>
          </div>
          <div>
            <label className="label">Contact Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} disabled={!editing} className="input pl-10 disabled:opacity-60" />
            </div>
          </div>
        </div>
      </div>

      {/* Trusted contacts summary */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold">Trusted Contacts</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-neutral-400">No trusted contacts added yet.</p>
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                  {initials(c.name)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name} {c.is_primary && <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">PRIMARY</span>}</p>
                  <p className="text-xs text-neutral-500">{c.relationship} • {c.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit actions */}
      {editing && (
        <div className="flex gap-3">
          <button onClick={() => setEditing(false)} className="btn-secondary flex-1">
            <X className="h-4 w-4" /> Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  )
}
