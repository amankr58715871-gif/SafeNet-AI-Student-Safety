import { useState, useEffect } from 'react'
import {
  Users, Plus, Star, Phone, Mail, Edit2, Trash2, X, Bell,
  AlertCircle, UserPlus, CheckCircle,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/utils'
import type { TrustedContact } from '../lib/types'

const relationships = [
  'Mother', 'Father', 'Sibling', 'Friend', 'Roommate', 'Hostel Warden', 'Relative', 'Other',
]

export default function TrustedContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TrustedContact | null>(null)
  const [form, setForm] = useState({ name: '', relationship: 'Mother', phone: '', email: '', notification_pref: 'both' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testMsg, setTestMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadContacts()
  }, [user])

  async function loadContacts() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })
    setContacts((data as TrustedContact[]) ?? [])
    setLoading(false)
  }

  function openAdd() {
    setEditing(null)
    setForm({ name: '', relationship: 'Mother', phone: '', email: '', notification_pref: 'both' })
    setError(null)
    setShowForm(true)
  }

  function openEdit(c: TrustedContact) {
    setEditing(c)
    setForm({ name: c.name, relationship: c.relationship, phone: c.phone, email: c.email ?? '', notification_pref: c.notification_pref })
    setError(null)
    setShowForm(true)
  }

  async function handleSave() {
    setError(null)
    if (!form.name.trim()) return setError('Please enter a name.')
    if (!form.phone.trim()) return setError('Please enter a phone number.')
    setSaving(true)
    if (editing) {
      await supabase.from('trusted_contacts').update({
        name: form.name, relationship: form.relationship, phone: form.phone,
        email: form.email || null, notification_pref: form.notification_pref,
      }).eq('id', editing.id)
    } else {
      await supabase.from('trusted_contacts').insert({
        user_id: user!.id, name: form.name, relationship: form.relationship,
        phone: form.phone, email: form.email || null, notification_pref: form.notification_pref,
      })
    }
    setSaving(false)
    setShowForm(false)
    await loadContacts()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this trusted contact?')) return
    await supabase.from('trusted_contacts').delete().eq('id', id)
    await loadContacts()
  }

  async function handleSetPrimary(c: TrustedContact) {
    // Unset all, then set this one
    await supabase.from('trusted_contacts').update({ is_primary: false }).eq('user_id', user!.id)
    await supabase.from('trusted_contacts').update({ is_primary: true }).eq('id', c.id)
    await loadContacts()
  }

  async function handleTest(c: TrustedContact) {
    setTestMsg(null)
    if (!user) return
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Test Notification Sent',
      message: `A test notification was sent to ${c.name} (${c.phone}). In a real deployment, ${c.name} would receive an alert.`,
      type: 'test',
    })
    setTestMsg(`Test notification prepared for ${c.name}. In production, they would receive an alert.`)
    setTimeout(() => setTestMsg(null), 4000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trusted Contacts</h1>
          <p className="text-sm text-neutral-500">People who can be reached during emergencies.</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Contact
        </button>
      </div>

      {testMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-300">
          <CheckCircle className="h-4 w-4" /> {testMsg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <Users className="h-6 w-6 text-neutral-400" />
          </div>
          <h2 className="font-semibold">No trusted contacts yet</h2>
          <p className="mt-1 text-sm text-neutral-500">Add a parent, friend, or roommate so they can be reached during emergencies.</p>
          <button onClick={openAdd} className="btn-primary mt-4">
            <UserPlus className="h-4 w-4" /> Add Your First Contact
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map((c) => (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                    {initials(c.name)}
                  </div>
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-neutral-500">{c.relationship}</p>
                  </div>
                </div>
                {c.is_primary && (
                  <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                    <Star className="h-3 w-3" /> PRIMARY
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {c.phone}</p>
                {c.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {c.email}</p>}
                <p className="flex items-center gap-2"><Bell className="h-3.5 w-3.5" /> Notify via {c.notification_pref}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => openEdit(c)} className="btn-ghost text-xs">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                {!c.is_primary && (
                  <button onClick={() => handleSetPrimary(c)} className="btn-ghost text-xs">
                    <Star className="h-3.5 w-3.5" /> Set Primary
                  </button>
                )}
                <button onClick={() => handleTest(c)} className="btn-ghost text-xs">
                  <Bell className="h-3.5 w-3.5" /> Test
                </button>
                <button onClick={() => handleDelete(c.id)} className="btn-ghost text-xs text-danger-600 hover:bg-danger-50 dark:text-danger-400">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-md animate-scale-in">
            <div className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing ? 'Edit Contact' : 'Add Trusted Contact'}</h2>
                <button onClick={() => setShowForm(false)} className="text-neutral-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {error && (
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-300">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="label">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Mom" />
                </div>
                <div>
                  <label className="label">Relationship</label>
                  <select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} className="input">
                    {relationships.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="label">Email (optional)</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="contact@email.com" />
                </div>
                <div>
                  <label className="label">Notification Preference</label>
                  <select value={form.notification_pref} onChange={(e) => setForm({ ...form, notification_pref: e.target.value })} className="input">
                    <option value="both">SMS + Email</option>
                    <option value="sms">SMS only</option>
                    <option value="email">Email only</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                  {saving ? 'Saving...' : editing ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
