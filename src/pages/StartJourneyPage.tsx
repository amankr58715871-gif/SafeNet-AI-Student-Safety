import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Route, MapPin, Clock, Users, FileText, Navigation, AlertCircle } from 'lucide-react'
import { useJourney } from '../lib/journey'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import type { TrustedContact } from '../lib/types'

const commonLocations = [
  'College Campus',
  'Hostel',
  'PG / Hostel',
  'Home',
  'Library',
  'Coaching Centre',
  'Café',
  'Bus Stop',
  'Metro Station',
  'Market',
]

export default function StartJourneyPage() {
  const { startJourney, activeJourney } = useJourney()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [startLocation, setStartLocation] = useState('College Campus')
  const [destination, setDestination] = useState('Hostel')
  const [etaMinutes, setEtaMinutes] = useState(30)
  const [note, setNote] = useState('')
  const [contactId, setContactId] = useState<string>('')
  const [contacts, setContacts] = useState<TrustedContact[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .then(({ data }) => setContacts((data as TrustedContact[]) ?? []))
  }, [user])

  if (activeJourney) {
    return (
      <div className="space-y-4">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 dark:bg-warning-900/30">
            <AlertCircle className="h-6 w-6 text-warning-600 dark:text-warning-400" />
          </div>
          <h1 className="text-lg font-bold">A journey is already active</h1>
          <p className="mt-1 text-sm text-neutral-500">
            You're currently travelling to {activeJourney.destination}. End it before starting a new one.
          </p>
          <button onClick={() => navigate('/app/journey/active')} className="btn-primary mt-4">
            View Active Journey
          </button>
        </div>
      </div>
    )
  }

  async function handleStart() {
    setError(null)
    if (!destination.trim()) {
      setError('Please select or enter a destination.')
      return
    }
    if (etaMinutes < 1 || etaMinutes > 240) {
      setError('Expected arrival time should be between 1 and 240 minutes.')
      return
    }
    setLoading(true)
    // Mock coordinates for demo (Delhi area)
    const startLat = 28.6139 + (Math.random() - 0.5) * 0.05
    const startLng = 77.209 + (Math.random() - 0.5) * 0.05
    const destLat = startLat + (Math.random() - 0.5) * 0.03
    const destLng = startLng + (Math.random() - 0.5) * 0.03
    const distance = Math.abs(Math.random() * 5 + 1)
    const expectedArrival = new Date(Date.now() + etaMinutes * 60 * 1000).toISOString()
    const journey = await startJourney({
      start_location: startLocation,
      destination,
      expected_arrival: expectedArrival,
      note: note || null,
      trusted_contact_id: contactId || null,
      distance_km: distance,
      start_lat: startLat,
      start_lng: startLng,
      dest_lat: destLat,
      dest_lng: destLng,
    })
    setLoading(false)
    if (journey) {
      navigate('/app/journey/active')
    } else {
      setError('Could not start journey. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Start a Safe Journey</h1>
        <p className="text-sm text-neutral-500">SafeNet AI will monitor your trip and check in on you.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card p-5 space-y-5">
            {/* Start location */}
            <div>
              <label className="label">Starting Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  list="locations"
                  className="input pl-10"
                  placeholder="Where are you starting from?"
                />
                <datalist id="locations">
                  {commonLocations.map((l) => <option key={l} value={l} />)}
                </datalist>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="label">Destination</label>
              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  list="locations"
                  className="input pl-10"
                  placeholder="Where are you going?"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {commonLocations.slice(0, 6).map((l) => (
                  <button
                    key={l}
                    onClick={() => setDestination(l)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      destination === l
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* ETA */}
            <div>
              <label className="label">Expected Arrival Time (minutes)</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="number"
                  value={etaMinutes}
                  onChange={(e) => setEtaMinutes(Number(e.target.value))}
                  min={1}
                  max={240}
                  className="input pl-10"
                />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Expected arrival: {new Date(Date.now() + etaMinutes * 60 * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>

            {/* Trusted contact */}
            <div>
              <label className="label">Trusted Contact (optional)</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  className="input pl-10"
                >
                  <option value="">No contact selected</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.relationship}){c.is_primary ? ' — Primary' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {contacts.length === 0 && (
                <p className="mt-1 text-xs text-neutral-400">
                  No trusted contacts yet. You can add some from the Trusted Contacts page.
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="label">Journey Note (optional)</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input pl-10 min-h-[80px] resize-y"
                  placeholder="e.g. Taking the metro via Rajiv Chowk"
                />
              </div>
            </div>

            <button onClick={handleStart} disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Starting journey...
                </span>
              ) : (
                <>
                  <Route className="h-4 w-4" /> Start Journey
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold">Journey Preview</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">From</p>
                  <p className="text-sm font-semibold">{startLocation || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-accent-600 dark:bg-accent-900/30">
                  <Navigation className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">To</p>
                  <p className="text-sm font-semibold">{destination || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                  <Clock className="mb-1 h-4 w-4 text-neutral-400" />
                  <p className="text-xs text-neutral-500">ETA</p>
                  <p className="text-sm font-semibold">{etaMinutes} min</p>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                  <Route className="mb-1 h-4 w-4 text-neutral-400" />
                  <p className="text-xs text-neutral-500">Est. Distance</p>
                  <p className="text-sm font-semibold">~{(etaMinutes * 0.3).toFixed(1)} km</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <AlertCircle className="h-4 w-4 shrink-0 text-primary-500" />
              <p>SafeNet AI will monitor your journey and send a smart check-in near your ETA. Your location is never shared without your permission.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
