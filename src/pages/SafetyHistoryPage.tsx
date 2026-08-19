import { useState, useEffect, useMemo } from 'react'
import { History, Route, AlertTriangle, CheckCircle, Siren, Bell, MapPin } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { riskColor, formatTime, formatDate, severityBg } from '../lib/utils'
import type { SafetyEvent, Journey } from '../lib/types'

const eventTypeIcons: Record<string, typeof Route> = {
  journey_started: Route,
  journey_completed: CheckCircle,
  route_deviation: AlertTriangle,
  check_in_requested: Bell,
  check_in_responded: CheckCircle,
  check_in_missed: AlertTriangle,
  sos_activated: Siren,
  sos_cancelled: CheckCircle,
  risk_level_change: AlertTriangle,
  location_shared: MapPin,
  contact_notified: Bell,
}

export default function SafetyHistoryPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<SafetyEvent[]>([])
  const [journeys, setJourneys] = useState<Journey[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'journeys' | 'alerts' | 'sos'>('all')

  useEffect(() => {
    if (!user) return
    const uid = user.id
    async function load() {
      const [ev, j] = await Promise.all([
        supabase.from('safety_events').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(100),
        supabase.from('journeys').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
      ])
      setEvents((ev.data as SafetyEvent[]) ?? [])
      setJourneys((j.data as Journey[]) ?? [])
      setLoading(false)
    }
    load()
  }, [user])

  const grouped = useMemo(() => {
    const filtered = events.filter((e) => {
      if (filter === 'all') return true
      if (filter === 'journeys') return e.event_type.startsWith('journey')
      if (filter === 'alerts') return ['route_deviation', 'check_in_missed', 'risk_level_change'].includes(e.event_type)
      if (filter === 'sos') return e.event_type.startsWith('sos')
      return true
    })
    const map = new Map<string, SafetyEvent[]>()
    for (const e of filtered) {
      const day = formatDate(e.created_at)
      if (!map.has(day)) map.set(day, [])
      map.get(day)!.push(e)
    }
    return Array.from(map.entries())
  }, [events, filter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Safety History</h1>
        <p className="text-sm text-neutral-500">A timeline of your journeys, alerts, and safety events.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'all', label: 'All' },
          { key: 'journeys', label: 'Journeys' },
          { key: 'alerts', label: 'Alerts' },
          { key: 'sos', label: 'SOS' },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <History className="h-6 w-6 text-neutral-400" />
          </div>
          <h2 className="font-semibold">No safety history yet</h2>
          <p className="mt-1 text-sm text-neutral-500">Start a journey to begin building your safety timeline.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayEvents]) => (
            <div key={day}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">{day}</h2>
              <div className="card p-4">
                <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-200 dark:before:bg-neutral-700">
                  {dayEvents.map((ev) => {
                    const Icon = eventTypeIcons[ev.event_type] ?? Bell
                    return (
                      <div key={ev.id} className="relative flex gap-4 pl-0">
                        <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${severityBg(ev.severity)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{ev.description}</p>
                            <span className="text-xs text-neutral-400">{formatTime(ev.created_at)}</span>
                          </div>
                          {ev.is_simulation && (
                            <span className="badge mt-1 bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300">SIMULATION</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Journey summary cards */}
      {journeys.length > 0 && filter === 'all' && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Past Journeys</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {journeys.slice(0, 6).map((j) => {
              const risk = riskColor(j.risk_level as 'low' | 'medium' | 'high')
              return (
                <div key={j.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{j.start_location} → {j.destination}</p>
                    <span className={`badge ${risk.bg} ${risk.text}`}>{risk.label}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                    <span>{formatDate(j.start_time)}</span>
                    <span>•</span>
                    <span>{formatTime(j.start_time)}</span>
                    {j.actual_arrival && (
                      <>
                        <span>•</span>
                        <span>Arrived {formatTime(j.actual_arrival)}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className={`badge ${
                      j.status === 'completed' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' :
                      j.status === 'emergency' ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300' :
                      'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    }`}>{j.status.toUpperCase()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
