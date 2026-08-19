import { useState, useEffect } from 'react'
import {
  Settings, Clock, MapPin, Bell, Shield, Siren, Lock, Save,
  CheckCircle, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const [prefs, setPrefs] = useState({
    checkin_enabled: true,
    checkin_timeout: 30,
    default_journey_duration: 30,
    location_sharing: false,
    notif_journey: true,
    notif_alerts: true,
    notif_checkins: true,
    notif_emergency: true,
    auto_share_sos: true,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Load from localStorage (demo settings persistence)
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`safenet-prefs-${user.id}`)
      if (saved) setPrefs(JSON.parse(saved))
    }
  }, [user])

  async function handleSave() {
    setSaving(true)
    if (user) {
      localStorage.setItem(`safenet-prefs-${user.id}`, JSON.stringify(prefs))
    }
    setSaving(false)
    setMsg('Settings saved.')
    setTimeout(() => setMsg(null), 3000)
  }

  function toggle(key: keyof typeof prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-neutral-500">Customize your safety preferences.</p>
      </div>

      {msg && (
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-300">
          <CheckCircle className="h-4 w-4" /> {msg}
        </div>
      )}

      {/* Check-in preferences */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-500" />
          <h2 className="font-semibold">Check-In Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Smart Check-Ins</p>
              <p className="text-xs text-neutral-500">Enable automatic safety check-ins during journeys.</p>
            </div>
            <button onClick={() => toggle('checkin_enabled')} className="text-primary-600">
              {prefs.checkin_enabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-neutral-400" />}
            </button>
          </div>
          <div>
            <label className="label">Check-In Timeout (seconds for demo)</label>
            <input
              type="number"
              value={prefs.checkin_timeout}
              onChange={(e) => setPrefs({ ...prefs, checkin_timeout: Number(e.target.value) })}
              min={10}
              max={120}
              className="input"
            />
            <p className="mt-1 text-xs text-neutral-500">If you don't respond within this time, risk level increases. Set low for demo.</p>
          </div>
          <div>
            <label className="label">Default Journey Duration (minutes)</label>
            <input
              type="number"
              value={prefs.default_journey_duration}
              onChange={(e) => setPrefs({ ...prefs, default_journey_duration: Number(e.target.value) })}
              min={5}
              max={120}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Location sharing */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent-500" />
          <h2 className="font-semibold">Location Sharing</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Default Location Sharing</p>
              <p className="text-xs text-neutral-500">Share location with trusted contacts by default on new journeys.</p>
            </div>
            <button onClick={() => toggle('location_sharing')} className="text-primary-600">
              {prefs.location_sharing ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-neutral-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary-500" />
          <h2 className="font-semibold">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {([
            { key: 'notif_journey', label: 'Journey Updates', desc: 'Started, completed, route changes' },
            { key: 'notif_alerts', label: 'Safety Alerts', desc: 'Route deviations, missed check-ins' },
            { key: 'notif_checkins', label: 'Check-In Reminders', desc: 'When a check-in is requested' },
            { key: 'notif_emergency', label: 'Emergency Alerts', desc: 'SOS and emergency mode events' },
          ] as const).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-neutral-500">{item.desc}</p>
              </div>
              <button onClick={() => toggle(item.key)} className="text-primary-600">
                {prefs[item.key] ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-neutral-400" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency preferences */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Siren className="h-5 w-5 text-danger-500" />
          <h2 className="font-semibold">Emergency Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-share location on SOS</p>
              <p className="text-xs text-neutral-500">Automatically prepare location for sharing when SOS is activated.</p>
            </div>
            <button onClick={() => toggle('auto_share_sos')} className="text-primary-600">
              {prefs.auto_share_sos ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-neutral-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="card border-2 border-accent-200 p-6 dark:border-accent-800">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-5 w-5 text-accent-500" />
          <h2 className="font-semibold">Privacy</h2>
        </div>
        <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
            <p>Your location is only collected during an active journey and is never stored on our servers.</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
            <p>Location sharing with trusted contacts requires your explicit permission each time.</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
            <p>SafeNet AI never contacts emergency services without your confirmation.</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
            <p>AI risk assessments are advisory only and clearly labeled as AI-generated.</p>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
            <p>You can end any journey and stop sharing at any time.</p>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
        <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  )
}
