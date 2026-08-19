import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Play, AlertTriangle, Clock, Siren, CheckCircle,
  Route, Bot, Zap, Info, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useJourney } from '../lib/journey'
import { supabase } from '../lib/supabase'
import { analyzeRisk } from '../lib/api'
import { riskColor } from '../lib/utils'
import type { RiskLevel } from '../lib/types'

const demoSteps = [
  { num: 1, label: 'Login', desc: 'Sign in to your account', icon: CheckCircle },
  { num: 2, label: 'Dashboard', desc: 'View SAFE status', icon: CheckCircle },
  { num: 3, label: 'Start Journey', desc: 'Select destination & begin', icon: Route },
  { num: 4, label: 'Route Deviation', desc: 'Simulate off-route movement', icon: AlertTriangle },
  { num: 5, label: 'AI Caution', desc: 'Risk changes to CAUTION', icon: Bot },
  { num: 6, label: 'Smart Check-In', desc: 'Receive safety prompt', icon: Clock },
  { num: 7, label: 'Missed Check-In', desc: 'Risk escalates to HIGH', icon: AlertTriangle },
  { num: 8, label: 'Emergency SOS', desc: 'Activate emergency mode', icon: Siren },
  { num: 9, label: 'AI Assistant', desc: 'Ask "I feel unsafe"', icon: Bot },
  { num: 10, label: 'Complete Journey', desc: 'Finish & view history', icon: CheckCircle },
]

export default function DemoPanelPage() {
  const { user } = useAuth()
  const { activeJourney, startJourney, endJourney, updateJourneyRisk, createCheckin, markCheckinMissed, checkin, logEvent, notify } = useJourney()
  const navigate = useNavigate()
  const [simulating, setSimulating] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('Ready. Start by creating a demo journey.')

  useEffect(() => {
    if (activeJourney) {
      setStatus(`Active journey: ${activeJourney.start_location} → ${activeJourney.destination} (${activeJourney.risk_level.toUpperCase()})`)
    } else {
      setStatus('No active journey. Create one to begin the demo.')
    }
  }, [activeJourney])

  async function simulateNormalJourney() {
    setSimulating('normal')
    setStatus('Creating a normal journey: College → Hostel...')
    const journey = await startJourney({
      start_location: 'College Campus',
      destination: 'Hostel',
      distance_km: 3.5,
      start_lat: 28.6139, start_lng: 77.209,
      dest_lat: 28.6300, dest_lng: 77.2200,
    })
    if (journey) {
      await logEvent({
        journey_id: journey.id,
        event_type: 'route_deviation',
        description: 'DEMO: Normal journey started — no deviations',
        severity: 'info',
        is_simulation: true,
      })
      setStatus('Normal journey started. Go to Active Journey to see monitoring.')
    }
    setSimulating(null)
  }

  async function simulateDeviation() {
    if (!activeJourney) { setStatus('Start a journey first.'); return }
    setSimulating('deviation')
    setStatus('DEMO: Simulating route deviation...')
    await logEvent({
      journey_id: activeJourney.id,
      event_type: 'route_deviation',
      description: 'DEMO: Route deviation detected — student is 0.9 km off planned route',
      severity: 'medium',
      is_simulation: true,
    })
    await notify('Route Deviation', 'DEMO: Your location differs from the planned route. Are you okay?', 'alert')
    // Force risk to medium via AI
    const result = await analyzeRisk({ routeDeviationKm: 0.9, isNightTravel: true })
    await updateJourneyRisk(activeJourney.id, result.risk_level, result.risk_score)
    setStatus(`DEMO: Route deviation simulated. Risk: ${result.risk_level.toUpperCase()} (${result.risk_score}/100)`)
    setSimulating(null)
  }

  async function simulateMissedCheckin() {
    if (!activeJourney) { setStatus('Start a journey first.'); return }
    setSimulating('missed')
    setStatus('DEMO: Requesting check-in then simulating no response...')
    const ci = await createCheckin(activeJourney.id)
    if (ci) {
      // Immediately mark as missed for demo
      await new Promise((r) => setTimeout(r, 500))
      await markCheckinMissed(ci.id)
      const result = await analyzeRisk({ routeDeviationKm: 0.9, missedCheckIn: true, isNightTravel: true })
      await updateJourneyRisk(activeJourney.id, result.risk_level, result.risk_score)
      setStatus(`DEMO: Check-in missed. Risk escalated to ${result.risk_level.toUpperCase()} (${result.risk_score}/100)`)
    }
    setSimulating(null)
  }

  async function simulateHighRisk() {
    if (!activeJourney) { setStatus('Start a journey first.'); return }
    setSimulating('highrisk')
    setStatus('DEMO: Simulating high-risk situation...')
    const result = await analyzeRisk({ routeDeviationKm: 1.2, missedCheckIn: true, unexpectedStop: true, isNightTravel: true, journeyDurationMin: 45, expectedDurationMin: 30 })
    await updateJourneyRisk(activeJourney.id, result.risk_level, result.risk_score)
    await logEvent({
      journey_id: activeJourney.id,
      event_type: 'risk_level_change',
      description: 'DEMO: High risk — multiple signals detected (deviation, missed check-in, unexpected stop, delay)',
      severity: 'high',
      is_simulation: true,
    })
    await notify('High Risk Alert', 'DEMO: Multiple safety signals detected. Please confirm you are safe.', 'alert')
    setStatus(`DEMO: High risk simulated. Risk: HIGH (${result.risk_score}/100)`)
    setSimulating(null)
  }

  async function simulateEmergency() {
    if (!activeJourney) { setStatus('Start a journey first.'); return }
    setSimulating('emergency')
    setStatus('DEMO: Activating Emergency Mode...')
    await supabase.from('journeys').update({ status: 'emergency', risk_level: 'high', risk_score: 100 }).eq('id', activeJourney.id)
    await logEvent({
      journey_id: activeJourney.id,
      event_type: 'sos_activated',
      description: 'DEMO: Emergency Mode activated via Demo Panel',
      severity: 'critical',
      is_simulation: true,
    })
    await notify('Emergency Mode Activated', 'DEMO: Emergency mode is active. Trusted contacts can be reached.', 'emergency')
    setStatus('DEMO: Emergency Mode active. Go to Active Journey to see SOS screen.')
    setSimulating(null)
  }

  async function completeJourney() {
    if (!activeJourney) { setStatus('Start a journey first.'); return }
    setSimulating('complete')
    setStatus('DEMO: Completing journey...')
    await endJourney(activeJourney.id)
    setStatus('DEMO: Journey completed. Check Safety History for the timeline.')
    setSimulating(null)
  }

  const risk = activeJourney ? riskColor(activeJourney.risk_level as RiskLevel) : null

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-accent-500" />
          <h1 className="text-2xl font-bold">Demo Mode</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Simulate safety scenarios for a complete demo experience. All simulated events are labeled as DEMO.
        </p>
      </div>

      {/* Status banner */}
      <div className={`card p-4 ${risk ? `border-2 ${risk.border}` : ''}`}>
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-accent-500" />
          <p className="flex-1 text-sm font-medium">{status}</p>
          {activeJourney && risk && (
            <span className={`badge ${risk.bg} ${risk.text}`}>
              {activeJourney.risk_level === 'low' ? '🟢' : activeJourney.risk_level === 'medium' ? '🟡' : '🔴'} {risk.label}
            </span>
          )}
        </div>
      </div>

      {/* Demo flow guide */}
      <div className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary-500" />
          <h2 className="font-semibold">Hackathon Demo Flow</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {demoSteps.map((s) => (
            <div key={s.num} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2.5 dark:border-neutral-800">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {s.num}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-neutral-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulation controls */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!activeJourney ? (
          <button
            onClick={simulateNormalJourney}
            disabled={!!simulating}
            className="card flex flex-col items-start gap-2 p-5 text-left transition-shadow hover:shadow-md disabled:opacity-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
              <Play className="h-5 w-5" />
            </div>
            <p className="font-semibold">Simulate Normal Journey</p>
            <p className="text-xs text-neutral-500">Start a journey: College → Hostel with low risk.</p>
          </button>
        ) : (
          <>
            <button
              onClick={simulateDeviation}
              disabled={!!simulating}
              className="card flex flex-col items-start gap-2 p-5 text-left transition-shadow hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="font-semibold">Simulate Route Deviation</p>
              <p className="text-xs text-neutral-500">Student goes off-route. Risk → CAUTION.</p>
            </button>

            <button
              onClick={simulateMissedCheckin}
              disabled={!!simulating}
              className="card flex flex-col items-start gap-2 p-5 text-left transition-shadow hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400">
                <Clock className="h-5 w-5" />
              </div>
              <p className="font-semibold">Simulate Missed Check-In</p>
              <p className="text-xs text-neutral-500">Check-in requested, no response. Risk escalates.</p>
            </button>

            <button
              onClick={simulateHighRisk}
              disabled={!!simulating}
              className="card flex flex-col items-start gap-2 p-5 text-left transition-shadow hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <p className="font-semibold">Simulate High Risk</p>
              <p className="text-xs text-neutral-500">Multiple risk signals. Risk → HIGH.</p>
            </button>

            <button
              onClick={simulateEmergency}
              disabled={!!simulating}
              className="card flex flex-col items-start gap-2 p-5 text-left transition-shadow hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400">
                <Siren className="h-5 w-5" />
              </div>
              <p className="font-semibold">Simulate Emergency</p>
              <p className="text-xs text-neutral-500">Activate Emergency Mode. SOS screen appears.</p>
            </button>

            <button
              onClick={completeJourney}
              disabled={!!simulating}
              className="card flex flex-col items-start gap-2 p-5 text-left transition-shadow hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <p className="font-semibold">Complete Journey</p>
              <p className="text-xs text-neutral-500">End the journey. View it in Safety History.</p>
            </button>
          </>
        )}
      </div>

      {/* Quick nav */}
      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Quick Navigation</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/app/dashboard')} className="btn-secondary text-sm">Dashboard <ChevronRight className="h-3.5 w-3.5" /></button>
          <button onClick={() => navigate('/app/journey/active')} className="btn-secondary text-sm">Active Journey <ChevronRight className="h-3.5 w-3.5" /></button>
          <button onClick={() => navigate('/app/assistant')} className="btn-secondary text-sm">AI Assistant <ChevronRight className="h-3.5 w-3.5" /></button>
          <button onClick={() => navigate('/app/history')} className="btn-secondary text-sm">Safety History <ChevronRight className="h-3.5 w-3.5" /></button>
          <button onClick={() => navigate('/app/contacts')} className="btn-secondary text-sm">Trusted Contacts <ChevronRight className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {simulating && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm text-white shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Simulating...
        </div>
      )}
    </div>
  )
}
