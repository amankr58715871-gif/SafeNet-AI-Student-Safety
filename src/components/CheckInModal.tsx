import { useState, useEffect } from 'react'
import { CheckCircle, HelpCircle, Siren, X } from 'lucide-react'
import { useJourney } from '../lib/journey'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CheckInModal({ open, onClose }: Props) {
  const { checkin, respondCheckin, activeJourney, updateJourneyRisk } = useJourney()
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    if (!open) setResponding(false)
  }, [open])

  if (!open || !checkin) return null

  async function respond(response: 'safe' | 'help' | 'emergency') {
    if (!checkin) return
    setResponding(true)
    await respondCheckin(checkin.id, response)
    if (activeJourney) {
      if (response === 'safe') {
        await updateJourneyRisk(activeJourney.id, 'low', Math.max(0, activeJourney.risk_score - 30))
      } else if (response === 'help') {
        await updateJourneyRisk(activeJourney.id, 'medium', Math.min(100, activeJourney.risk_score + 20))
      } else {
        await updateJourneyRisk(activeJourney.id, 'high', 100)
      }
    }
    setResponding(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold">Safety Check-In</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
            SafeNet AI is checking in on you. Please confirm your safety status.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => respond('safe')}
              disabled={responding}
              className="flex w-full items-center gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-left transition-colors hover:bg-success-100 dark:border-success-800 dark:bg-success-900/20 dark:hover:bg-success-900/30"
            >
              <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
              <div>
                <p className="font-semibold text-success-700 dark:text-success-300">Yes, I'm Safe</p>
                <p className="text-xs text-success-600 dark:text-success-400">Confirm your safety</p>
              </div>
            </button>
            <button
              onClick={() => respond('help')}
              disabled={responding}
              className="flex w-full items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-left transition-colors hover:bg-warning-100 dark:border-warning-800 dark:bg-warning-900/20 dark:hover:bg-warning-900/30"
            >
              <HelpCircle className="h-6 w-6 text-warning-600 dark:text-warning-400" />
              <div>
                <p className="font-semibold text-warning-700 dark:text-warning-300">I Need Help</p>
                <p className="text-xs text-warning-600 dark:text-warning-400">Open assistance options</p>
              </div>
            </button>
            <button
              onClick={() => respond('emergency')}
              disabled={responding}
              className="flex w-full items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-left transition-colors hover:bg-danger-100 dark:border-danger-800 dark:bg-danger-900/20 dark:hover:bg-danger-900/30"
            >
              <Siren className="h-6 w-6 text-danger-600 dark:text-danger-400" />
              <div>
                <p className="font-semibold text-danger-700 dark:text-danger-300">Emergency</p>
                <p className="text-xs text-danger-600 dark:text-danger-400">Activate Emergency Mode</p>
              </div>
            </button>
          </div>
          {responding && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              Updating status...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
