import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Route, Siren, Bot, MapPin, Clock, Users, Bell, TrendingUp,
  AlertTriangle, CheckCircle, Navigation, Sparkles, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useJourney } from '../lib/journey'
import { supabase } from '../lib/supabase'
import { riskColor, formatTime, timeAgo, initials } from '../lib/utils'
import type { SafetyEvent, NotificationItem, TrustedContact, Journey } from '../lib/types'
import SosModal from '../components/SosModal'

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const { activeJourney, loading } = useJourney()
  const navigate = useNavigate()
  const [sosOpen, setSosOpen] = useState(false)
  const [recentEvents, setRecentEvents] = useState<SafetyEvent[]>([])
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([])
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [recentJourneys, setRecentJourneys] = useState<Journey[]>([])
  const [location, setLocation] = useState<string>('Detecting...')
  const [mockLoc, setMockLoc] = useState(false)

  useEffect(() => {
    if (!user) return
    const uid = user.id
    async function load() {
      const [events, notifs, c, journeys] = await Promise.all([
        supabase.from('safety_events').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
        supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(3),
        supabase.from('trusted_contacts').select('*').eq('user_id', uid).order('is_primary', { ascending: false }),
        supabase.from('journeys').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
      ])
      setRecentEvents((events.data as SafetyEvent[]) ?? [])
      setRecentNotifs((notifs.data as NotificationItem[]) ?? [])
      setContacts((c.data as TrustedContact[]) ?? [])
      setRecentJourneys((journeys.data as Journey[]) ?? [])
    }
    load()
  }, [user])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation('Mock: Campus Area')
      setMockLoc(true)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`)
        setMockLoc(false)
      },
      () => {
        setLocation('Mock: Campus Area')
        setMockLoc(true)
      },
      { timeout: 5000 },
    )
  }, [])

  const currentRisk = activeJourney?.risk_level ?? 'low'
  const risk = riskColor(currentRisk)
  const isNight = new Date().getHours() >= 20 || new Date().getHours() < 6

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hello, {profile?.name?.split(' ')[0] ?? 'Student'} 👋
          </h1>
          <p className="text-sm text-neutral-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
          <MapPin className="h-4 w-4 text-primary-500" />
          <div>
            <p className="text-xs text-neutral-500">Current Location</p>
            <p className="text-sm font-medium">{location}</p>
          </div>
          {mockLoc && <span className="badge bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300">DEMO</span>}
        </div>
      </div>

      {/* Safety Status Banner */}
      <div className={`card overflow-hidden border-2 ${risk.border}`}>
        <div className={`flex items-center justify-between p-5 ${risk.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${risk.dot} ${activeJourney ? 'animate-pulse-soft' : ''}`} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Safety Status</p>
              <p className={`text-lg font-bold ${risk.text}`}>
                {currentRisk === 'low' ? "You are currently safe" : currentRisk === 'medium' ? 'Caution advised' : 'High risk — check in now'}
              </p>
            </div>
          </div>
          <span className={`badge ${risk.bg} ${risk.text} border ${risk.border}`}>
            {currentRisk === 'low' ? '🟢 SAFE' : currentRisk === 'medium' ? '🟡 CAUTION' : '🔴 HIGH RISK'}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => navigate('/app/journey/new')}
          className="card flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Route className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Start Safe Journey</p>
            <p className="text-xs text-neutral-500">Begin monitored trip</p>
          </div>
        </button>
        <button
          onClick={() => setSosOpen(true)}
          className="card flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400">
            <Siren className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Emergency SOS</p>
            <p className="text-xs text-neutral-500">Activate emergency mode</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/app/assistant')}
          className="card flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">AI Assistant</p>
            <p className="text-xs text-neutral-500">Get safety guidance</p>
          </div>
        </button>
      </div>

      {/* Active Journey + AI Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Journey */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Active Journey</h2>
              {activeJourney && (
                <button onClick={() => navigate('/app/journey/active')} className="flex items-center gap-1 text-sm font-medium text-primary-600">
                  View <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : activeJourney ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{activeJourney.start_location} → {activeJourney.destination}</p>
                    <p className="text-xs text-neutral-500">Started at {formatTime(activeJourney.start_time)}</p>
                  </div>
                  <span className={`badge ${risk.bg} ${risk.text}`}>
                    {currentRisk === 'low' ? '🟢' : currentRisk === 'medium' ? '🟡' : '🔴'} {risk.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <Clock className="mb-1 h-4 w-4 text-neutral-400" />
                    <p className="text-xs text-neutral-500">ETA</p>
                    <p className="text-sm font-semibold">{formatTime(activeJourney.expected_arrival)}</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <TrendingUp className="mb-1 h-4 w-4 text-neutral-400" />
                    <p className="text-xs text-neutral-500">Risk Score</p>
                    <p className="text-sm font-semibold">{activeJourney.risk_score}/100</p>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <MapPin className="mb-1 h-4 w-4 text-neutral-400" />
                    <p className="text-xs text-neutral-500">Distance</p>
                    <p className="text-sm font-semibold">{activeJourney.distance_km ? `${activeJourney.distance_km} km` : '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-success-50 p-3 text-sm text-success-700 dark:bg-success-900/20 dark:text-success-300">
                  <CheckCircle className="h-4 w-4" />
                  SafeNet AI is monitoring your journey.
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <Route className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-500">No active journey right now.</p>
                <button onClick={() => navigate('/app/journey/new')} className="btn-primary mt-3 text-sm">
                  Start a Journey
                </button>
              </div>
            )}
          </div>

          {/* Recent Safety Events */}
          <div className="card mt-4 p-5">
            <h2 className="mb-4 font-semibold">Recent Safety Activity</h2>
            {recentEvents.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-400">No safety events yet. Start a journey to begin.</p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      ev.severity === 'critical' || ev.severity === 'high' ? 'bg-danger-500' :
                      ev.severity === 'medium' ? 'bg-warning-500' :
                      ev.severity === 'low' ? 'bg-success-500' : 'bg-primary-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ev.description}</p>
                      <p className="text-xs text-neutral-500">{timeAgo(ev.created_at)} {ev.is_simulation && '• DEMO'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Insights + Emergency Contact */}
        <div className="space-y-4">
          {/* AI Insights */}
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary-500" />
              <h2 className="font-semibold">AI Safety Insights</h2>
            </div>
            <div className="space-y-2">
              {activeJourney ? (
                <div className="rounded-xl bg-warning-50 p-3 text-sm text-warning-700 dark:bg-warning-900/20 dark:text-warning-300">
                  <AlertTriangle className="mb-1 h-4 w-4" />
                  Your current journey is being monitored. Check in when prompted.
                </div>
              ) : (
                <div className="rounded-xl bg-success-50 p-3 text-sm text-success-700 dark:bg-success-900/20 dark:text-success-300">
                  <CheckCircle className="mb-1 h-4 w-4" />
                  No active concerns. You're all set.
                </div>
              )}
              {isNight && (
                <div className="rounded-xl bg-primary-50 p-3 text-sm text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                  <Clock className="mb-1 h-4 w-4" />
                  It's late. Consider sharing your location with a trusted contact if heading out.
                </div>
              )}
              {recentJourneys.length > 0 && (
                <div className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400">
                  <TrendingUp className="mb-1 h-4 w-4" />
                  You've logged {recentJourneys.length} {recentJourneys.length === 1 ? 'journey' : 'journeys'} so far.
                </div>
              )}
              <p className="pt-1 text-xs text-neutral-400">AI-generated insights are advisory only.</p>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-accent-500" />
              <h2 className="font-semibold">Emergency Contact</h2>
            </div>
            {contacts.length === 0 ? (
              <div className="text-center">
                <p className="text-sm text-neutral-400">No trusted contacts yet.</p>
                <button onClick={() => navigate('/app/contacts')} className="btn-secondary mt-2 text-sm">
                  Add Contact
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.slice(0, 2).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
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

          {/* Recent Notifications */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary-500" />
                <h2 className="font-semibold">Notifications</h2>
              </div>
              <button onClick={() => navigate('/app/notifications')} className="text-sm text-primary-600">View all</button>
            </div>
            {recentNotifs.length === 0 ? (
              <p className="py-2 text-center text-sm text-neutral-400">No notifications.</p>
            ) : (
              <div className="space-y-2">
                {recentNotifs.map((n) => (
                  <div key={n.id} className={`rounded-xl p-3 ${n.read ? 'bg-neutral-50 dark:bg-neutral-800/50' : 'bg-primary-50 dark:bg-primary-900/20'}`}>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-neutral-500">{n.message}</p>
                    <p className="mt-0.5 text-xs text-neutral-400">{timeAgo(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SosModal open={sosOpen} onClose={() => setSosOpen(false)} />
    </div>
  )
}
