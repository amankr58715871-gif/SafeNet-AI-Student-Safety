import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Siren, X, MapPin, Phone, Share2, AlertTriangle, Shield } from 'lucide-react'
import { useJourney } from '../lib/journey'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SosModal({ open, onClose }: Props) {
  const [stage, setStage] = useState<'confirm' | 'active'>('confirm')
  const [location, setLocation] = useState<{ lat: number; lng: number; mock: boolean } | null>(null)
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([])
  const { activeJourney, logEvent, notify } = useJourney()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setStage('confirm')
      getLocation()
      loadContacts()
    }
  }, [open])

  async function getLocation() {
    if (!navigator.geolocation) {
      setLocation({ lat: 28.6139, lng: 77.209, mock: true })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, mock: false }),
      () => setLocation({ lat: 28.6139, lng: 77.209, mock: true }),
      { timeout: 5000 },
    )
  }

  async function loadContacts() {
    if (!user) return
    const { data } = await supabase
      .from('trusted_contacts')
      .select('name, phone')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
    setContacts((data as { name: string; phone: string }[]) ?? [])
  }

  async function activate() {
    setStage('active')
    if (activeJourney) {
      await supabase
        .from('journeys')
        .update({ status: 'emergency', risk_level: 'high', risk_score: 100 })
        .eq('id', activeJourney.id)
      await logEvent({
        journey_id: activeJourney.id,
        event_type: 'sos_activated',
        description: 'Emergency Mode activated by user',
        severity: 'critical',
        is_simulation: false,
      })
    } else {
      await logEvent({
        journey_id: null,
        event_type: 'sos_activated',
        description: 'Emergency Mode activated (no active journey)',
        severity: 'critical',
        is_simulation: false,
      })
    }
    await notify('Emergency Mode Activated', 'Your trusted contacts can now be reached. Stay calm and move to a safe location.', 'emergency')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={stage === 'confirm' ? onClose : undefined} />
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {stage === 'confirm' ? (
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/30">
                  <AlertTriangle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
                </div>
                <h2 className="text-lg font-bold">Emergency SOS</h2>
              </div>
              <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
              Are you sure you want to activate Emergency Mode? This will record an emergency event and prepare your trusted contacts and location for sharing.
            </p>
            <p className="mb-6 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
              SafeNet AI will NOT automatically contact emergency services. You remain in control of who to call and when.
            </p>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={activate} className="btn-danger flex-1">
                <Siren className="h-4 w-4" />
                Activate Emergency
              </button>
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="bg-danger-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Siren className="h-6 w-6 animate-pulse" />
                  <h2 className="text-lg font-bold">Emergency Mode Active</h2>
                </div>
                <button onClick={onClose} className="text-white/80 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1 text-sm text-white/90">Stay calm. Move to a safe, public location.</p>
            </div>
            <div className="space-y-4 p-5">
              {/* Location */}
              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-primary-500" />
                  Your Location
                </div>
                {location ? (
                  <div className="mt-2">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                    {location.mock && (
                      <span className="badge mt-1 bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300">DEMO LOCATION</span>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-neutral-400">Locating...</p>
                )}
              </div>

              {/* Trusted contacts */}
              <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Phone className="h-4 w-4 text-primary-500" />
                  Trusted Contacts
                </div>
                {contacts.length === 0 ? (
                  <p className="text-sm text-neutral-400">No trusted contacts added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((c, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-800">
                        <div>
                          <p className="text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-neutral-500">{c.phone}</p>
                        </div>
                        <a href={`tel:${c.phone}`} className="btn-primary px-3 py-1.5 text-xs">
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Emergency services */}
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 dark:border-danger-800 dark:bg-danger-900/20">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-danger-700 dark:text-danger-300">
                  <Shield className="h-4 w-4" />
                  Emergency Services
                </div>
                <div className="flex gap-2">
                  <a href="tel:112" className="btn-danger flex-1 text-xs">
                    Call 112
                  </a>
                  <a href="tel:100" className="btn-danger flex-1 bg-danger-700 text-xs">
                    Police 100
                  </a>
                  <a href="tel:1091" className="btn-danger flex-1 bg-danger-800 text-xs">
                    Women 1091
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (location) {
                      const text = `Emergency! I need help. My location: https://maps.google.com/?q=${location.lat},${location.lng}`
                      navigator.clipboard?.writeText(text)
                      alert('Location message copied to clipboard. Share it with your trusted contact.')
                    }
                  }}
                  className="btn-secondary flex-1 text-sm"
                >
                  <Share2 className="h-4 w-4" /> Share Location
                </button>
                <button
                  onClick={() => {
                    onClose()
                    navigate('/app/assistant')
                  }}
                  className="btn-primary flex-1 text-sm"
                >
                  AI Assistant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
