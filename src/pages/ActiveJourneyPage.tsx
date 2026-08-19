import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Navigation, MapPin, Clock, Siren, CheckCircle, AlertTriangle,
  TrendingUp, Bot, Share2, Flag, X, Sparkles, Route as RouteIcon,
} from 'lucide-react'
import { useJourney } from '../lib/journey'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { analyzeRisk } from '../lib/api'
import { riskColor, formatTime, mockLocation, haversineKm } from '../lib/utils'
import type { RiskLevel } from '../lib/types'
import SosModal from '../components/SosModal'
import CheckInModal from '../components/CheckInModal'

export default function ActiveJourneyPage() {
  const { activeJourney, loading, endJourney, updateJourneyRisk, createCheckin, checkin, refreshActive } = useJourney()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sosOpen, setSosOpen] = useState(false)
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number; mock: boolean } | null>(null)
  const [deviationKm, setDeviationKm] = useState(0)
  const [assessment, setAssessment] = useState<{ risk_level: RiskLevel; risk_score: number; reasons: string[]; recommendation: string } | null>(null)
  const [assessing, setAssessing] = useState(false)
  const [showRiskPanel, setShowRiskPanel] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<number | null>(null)

  // Progress simulation
  useEffect(() => {
    if (!activeJourney) return
    const startTime = new Date(activeJourney.start_time).getTime()
    const expectedMs = new Date(activeJourney.expected_arrival).getTime() - startTime
    intervalRef.current = window.setInterval(() => {
      const now = Date.now()
      const elapsedMs = now - startTime
      const p = Math.min(1, elapsedMs / expectedMs)
      setProgress(p)
      setElapsed(Math.floor(elapsedMs / 60000))
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [activeJourney])

  // Location tracking
  useEffect(() => {
    if (!activeJourney) return
    function updateLoc() {
      if (!activeJourney) return
      const sLat = activeJourney.start_lat ?? 28.6139
      const sLng = activeJourney.start_lng ?? 77.209
      const dLat = activeJourney.dest_lat ?? sLat + 0.02
      const dLng = activeJourney.dest_lng ?? sLng + 0.02
      // Use mock location based on progress + any deviation
      const loc = mockLocation(sLat, sLng, dLat, dLng, progress, deviationKm)
      setCurrentLoc({ lat: loc.lat, lng: loc.lng, mock: true })
      // Calculate actual deviation from planned route
      const plannedLoc = mockLocation(sLat, sLng, dLat, dLng, progress, 0)
      const dev = haversineKm(loc.lat, loc.lng, plannedLoc.lat, plannedLoc.lng)
      setDeviationKm(dev)
    }
    updateLoc()
    const interval = setInterval(updateLoc, 3000)
    return () => clearInterval(interval)
  }, [activeJourney, progress, deviationKm])

  // Auto risk assessment
  const runAssessment = useCallback(async () => {
    if (!activeJourney) return
    setAssessing(true)
    const expectedDurationMin = Math.round(
      (new Date(activeJourney.expected_arrival).getTime() - new Date(activeJourney.start_time).getTime()) / 60000,
    )
    const isNight = new Date().getHours() >= 20 || new Date().getHours() < 6
    const missed = checkin?.status === 'missed'
    const result = await analyzeRisk({
      routeDeviationKm: deviationKm,
      missedCheckIn: missed,
      journeyDurationMin: elapsed,
      expectedDurationMin,
      isNightTravel: isNight,
    })
    setAssessment(result)
    await updateJourneyRisk(activeJourney.id, result.risk_level, result.risk_score)
    setAssessing(false)
  }, [activeJourney, deviationKm, elapsed, checkin, updateJourneyRisk])

  useEffect(() => {
    if (!activeJourney) return
    runAssessment()
    const interval = setInterval(runAssessment, 10000)
    return () => clearInterval(interval)
  }, [activeJourney, runAssessment])

  // Auto check-in near ETA
  useEffect(() => {
    if (!activeJourney || checkin) return
    const expectedMs = new Date(activeJourney.expected_arrival).getTime()
    const now = Date.now()
    const timeUntilEta = expectedMs - now
    // Trigger check-in when within 1 minute of ETA, or if high risk
    if (timeUntilEta < 60000 && timeUntilEta > -120000) {
      createCheckin(activeJourney.id)
    }
  }, [activeJourney, checkin, createCheckin, progress])

  // Show check-in modal when there's a pending check-in
  useEffect(() => {
    if (checkin && checkin.status === 'pending') {
      setCheckinOpen(true)
    }
  }, [checkin])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (!activeJourney) {
    return (
      <div className="space-y-4">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <Navigation className="h-6 w-6 text-neutral-400" />
          </div>
          <h1 className="text-lg font-bold">No Active Journey</h1>
          <p className="mt-1 text-sm text-neutral-500">Start a journey to begin monitoring.</p>
          <button onClick={() => navigate('/app/journey/new')} className="btn-primary mt-4">
            Start a Journey
          </button>
        </div>
      </div>
    )
  }

  const currentRisk = activeJourney.risk_level as RiskLevel
  const risk = riskColor(currentRisk)
  const expectedDurationMin = Math.round(
    (new Date(activeJourney.expected_arrival).getTime() - new Date(activeJourney.start_time).getTime()) / 60000,
  )
  const remaining = Math.max(0, expectedDurationMin - elapsed)
  const distanceRemaining = activeJourney.distance_km ? (activeJourney.distance_km * (1 - progress)).toFixed(1) : null

  async function handleEnd() {
    if (!activeJourney) return
    await endJourney(activeJourney.id)
    navigate('/app/dashboard')
  }

  async function handleRecalculate() {
    setDeviationKm(0)
    await supabase.from('safety_events').insert({
      user_id: user!.id,
      journey_id: activeJourney!.id,
      event_type: 'risk_level_change',
      description: 'Route recalculated by user',
      severity: 'info',
      is_simulation: false,
    })
  }

  async function handleImSafe() {
    if (activeJourney) {
      await updateJourneyRisk(activeJourney.id, 'low', Math.max(0, activeJourney.risk_score - 30))
    }
  }

  function handleShareLocation() {
    if (currentLoc) {
      const text = `I'm sharing my live location with you via SafeNet AI: https://maps.google.com/?q=${currentLoc.lat},${currentLoc.lng}`
      navigator.clipboard?.writeText(text)
      setSharing(true)
      setTimeout(() => setSharing(false), 3000)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status header */}
      <div className={`card overflow-hidden border-2 ${risk.border}`}>
        <div className={`flex items-center justify-between p-5 ${risk.bg}`}>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${risk.dot} animate-pulse-soft`} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Journey Status</p>
              <p className={`text-lg font-bold ${risk.text}`}>
                {currentRisk === 'low' ? 'Journey Active' : currentRisk === 'medium' ? 'Caution — Check In' : 'High Risk — Confirm Safety'}
              </p>
            </div>
          </div>
          <span className={`badge ${risk.bg} ${risk.text} border ${risk.border}`}>
            {currentRisk === 'low' ? '🟢 LOW RISK' : currentRisk === 'medium' ? '🟡 CAUTION' : '🔴 HIGH RISK'}
          </span>
        </div>
        <div className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-400">
          <CheckCircle className="inline h-4 w-4 text-success-500" /> SafeNet AI is monitoring your journey.
        </div>
      </div>

      {/* Map */}
      <div className="card overflow-hidden">
        <div className="relative h-64 map-bg sm:h-80">
          {/* Route line */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line
              x1={10} y1={80} x2={90} y2={20}
              stroke="currentColor"
              className="text-primary-300 dark:text-primary-700"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            {/* Deviation indicator */}
            {deviationKm > 0.3 && currentLoc && (
              <line
                x1={10 + 80 * progress} y1={80 - 60 * progress}
                x2={10 + 80 * progress + (deviationKm > 0.5 ? 15 : 5)} y2={80 - 60 * progress - (deviationKm > 0.5 ? 10 : 3)}
                stroke="currentColor"
                className="text-warning-400"
                strokeWidth="0.5"
              />
            )}
          </svg>
          {/* Start marker */}
          <div className="absolute" style={{ left: '8%', top: '78%' }}>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg">
              <MapPin className="h-3.5 w-3.5" />
            </div>
          </div>
          {/* Destination marker */}
          <div className="absolute" style={{ left: '88%', top: '18%' }}>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-600 text-white shadow-lg">
              <Navigation className="h-3.5 w-3.5" />
            </div>
          </div>
          {/* Current position */}
          {currentLoc && (
            <div
              className="absolute transition-all duration-1000"
              style={{
                left: `${8 + 80 * progress + (deviationKm > 0.5 ? 8 : 0)}%`,
                top: `${78 - 60 * progress - (deviationKm > 0.5 ? 5 : 0)}%`,
              }}
            >
              <div className={`relative flex h-7 w-7 items-center justify-center rounded-full ${currentRisk === 'high' ? 'bg-danger-500' : currentRisk === 'medium' ? 'bg-warning-500' : 'bg-primary-500'} text-white shadow-lg`}>
                <div className={`absolute inset-0 animate-ping rounded-full ${currentRisk === 'high' ? 'bg-danger-500' : currentRisk === 'medium' ? 'bg-warning-500' : 'bg-primary-500'} opacity-30`} />
                <span className="relative text-xs font-bold">{Math.round(progress * 100)}%</span>
              </div>
            </div>
          )}
          {/* DEMO badge */}
          <div className="absolute right-3 top-3">
            <span className="badge bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300">DEMO MAP</span>
          </div>
        </div>
      </div>

      {/* Journey details */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <MapPin className="mb-1 h-4 w-4 text-primary-500" />
          <p className="text-xs text-neutral-500">From</p>
          <p className="text-sm font-semibold">{activeJourney.start_location}</p>
        </div>
        <div className="card p-4">
          <Navigation className="mb-1 h-4 w-4 text-accent-500" />
          <p className="text-xs text-neutral-500">To</p>
          <p className="text-sm font-semibold">{activeJourney.destination}</p>
        </div>
        <div className="card p-4">
          <Clock className="mb-1 h-4 w-4 text-neutral-400" />
          <p className="text-xs text-neutral-500">ETA</p>
          <p className="text-sm font-semibold">{remaining > 0 ? `${remaining} min` : 'Overdue'}</p>
        </div>
        <div className="card p-4">
          <RouteIcon className="mb-1 h-4 w-4 text-neutral-400" />
          <p className="text-xs text-neutral-500">Distance Left</p>
          <p className="text-sm font-semibold">{distanceRemaining ? `${distanceRemaining} km` : '—'}</p>
        </div>
      </div>

      {/* Current location */}
      {currentLoc && (
        <div className="card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Current Location</p>
              <p className="text-sm font-semibold">{currentLoc.lat.toFixed(4)}, {currentLoc.lng.toFixed(4)}</p>
            </div>
          </div>
          {deviationKm > 0.3 && (
            <span className="badge bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300">
              <AlertTriangle className="h-3 w-3" /> {deviationKm.toFixed(2)} km off route
            </span>
          )}
        </div>
      )}

      {/* Route deviation prompt */}
      {deviationKm > 0.5 && currentRisk !== 'high' && (
        <div className="card border-2 border-warning-300 p-5 dark:border-warning-700">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-400" />
            <h3 className="font-semibold text-warning-700 dark:text-warning-300">Route Deviation Detected</h3>
          </div>
          <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Your current location differs from the planned route. Are you okay?
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleImSafe} className="btn-success text-sm">
              <CheckCircle className="h-4 w-4" /> I'm Safe
            </button>
            <button onClick={handleRecalculate} className="btn-secondary text-sm">
              <RouteIcon className="h-4 w-4" /> Recalculate Route
            </button>
            <button onClick={() => setSosOpen(true)} className="btn-danger text-sm">
              <Siren className="h-4 w-4" /> Need Help
            </button>
          </div>
        </div>
      )}

      {/* High risk prompt */}
      {currentRisk === 'high' && (
        <div className="card border-2 border-danger-300 p-5 dark:border-danger-700">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
            <h3 className="font-semibold text-danger-700 dark:text-danger-300">High Risk — Please Confirm Your Safety</h3>
          </div>
          <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Multiple safety signals have been detected. Please confirm you are safe. If you feel uncomfortable, move toward a populated area and contact a trusted person.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleImSafe} className="btn-success text-sm">
              <CheckCircle className="h-4 w-4" /> I'm Safe
            </button>
            <button onClick={() => setSosOpen(true)} className="btn-danger text-sm">
              <Siren className="h-4 w-4" /> Activate SOS
            </button>
            <button onClick={() => navigate('/app/assistant')} className="btn-primary text-sm">
              <Bot className="h-4 w-4" /> Ask AI
            </button>
          </div>
        </div>
      )}

      {/* AI Risk Assessment Panel */}
      <div className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-500" />
            <h2 className="font-semibold">AI Risk Assessment</h2>
            <span className="badge bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">AI-GENERATED</span>
          </div>
          <button onClick={() => setShowRiskPanel(!showRiskPanel)} className="text-sm text-primary-600">
            {showRiskPanel ? 'Hide' : 'Details'}
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500">Risk Score</span>
              <span className={`font-bold ${risk.text}`}>{activeJourney.risk_score}/100</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentRisk === 'high' ? 'bg-danger-500' : currentRisk === 'medium' ? 'bg-warning-500' : 'bg-success-500'
                }`}
                style={{ width: `${activeJourney.risk_score}%` }}
              />
            </div>
          </div>
          {assessing && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          )}
        </div>
        {showRiskPanel && assessment && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div>
              <p className="mb-1 text-xs font-semibold text-neutral-500">REASONS</p>
              <ul className="space-y-1">
                {assessment.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
              <p className="mb-1 text-xs font-semibold text-neutral-500">RECOMMENDATION</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{assessment.recommendation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button onClick={() => setSosOpen(true)} className="btn-danger">
          <Siren className="h-4 w-4" /> Emergency SOS
        </button>
        <button onClick={handleShareLocation} className="btn-secondary">
          <Share2 className="h-4 w-4" /> {sharing ? 'Copied!' : 'Share Location'}
        </button>
        <button onClick={() => navigate('/app/assistant')} className="btn-secondary">
          <Bot className="h-4 w-4" /> AI Assistant
        </button>
        <button onClick={handleEnd} className="btn-success">
          <Flag className="h-4 w-4" /> End Journey
        </button>
      </div>

      <SosModal open={sosOpen} onClose={() => setSosOpen(false)} />
      <CheckInModal open={checkinOpen} onClose={() => setCheckinOpen(false)} />
    </div>
  )
}
