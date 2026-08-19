import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth'
import type { Journey, SafetyEvent, NotificationItem, SafetyCheckin, RiskLevel } from './types'

interface JourneyCtx {
  activeJourney: Journey | null
  checkin: SafetyCheckin | null
  loading: boolean
  refreshActive: () => Promise<void>
  startJourney: (data: Partial<Journey>) => Promise<Journey | null>
  endJourney: (journeyId: string) => Promise<void>
  updateJourneyRisk: (journeyId: string, level: RiskLevel, score: number) => Promise<void>
  createCheckin: (journeyId: string) => Promise<SafetyCheckin | null>
  respondCheckin: (checkinId: string, response: 'safe' | 'help' | 'emergency') => Promise<void>
  markCheckinMissed: (checkinId: string) => Promise<void>
  logEvent: (event: Omit<SafetyEvent, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  notify: (title: string, message: string, type: string) => Promise<void>
}

const Ctx = createContext<JourneyCtx | undefined>(undefined)

export function JourneyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null)
  const [checkin, setCheckin] = useState<SafetyCheckin | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshActive = useCallback(async () => {
    if (!user) {
      setActiveJourney(null)
      setCheckin(null)
      setLoading(false)
      return
    }
    const { data: journey } = await supabase
      .from('journeys')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'emergency'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setActiveJourney(journey as Journey | null)
    if (journey) {
      const { data: ci } = await supabase
        .from('safety_checkins')
        .select('*')
        .eq('journey_id', (journey as Journey).id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setCheckin(ci as SafetyCheckin | null)
    } else {
      setCheckin(null)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    refreshActive()
  }, [refreshActive])

  const startJourney = useCallback(
    async (data: Partial<Journey>): Promise<Journey | null> => {
      if (!user) return null
      const insert = {
        user_id: user.id,
        start_location: data.start_location ?? 'Current Location',
        destination: data.destination ?? '',
        expected_arrival: data.expected_arrival ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        status: 'active' as const,
        risk_level: 'low' as const,
        risk_score: 0,
        note: data.note ?? null,
        trusted_contact_id: data.trusted_contact_id ?? null,
        distance_km: data.distance_km ?? null,
        start_lat: data.start_lat ?? null,
        start_lng: data.start_lng ?? null,
        dest_lat: data.dest_lat ?? null,
        dest_lng: data.dest_lng ?? null,
      }
      const { data: journey, error } = await supabase
        .from('journeys')
        .insert(insert)
        .select()
        .single()
      if (error) {
        console.error('Start journey error:', error.message)
        return null
      }
      await logEvent({
        journey_id: (journey as Journey).id,
        event_type: 'journey_started',
        description: `Journey started: ${insert.start_location} → ${insert.destination}`,
        severity: 'info',
        is_simulation: false,
      })
      await notify('Journey Started', `SafeNet AI is monitoring your journey to ${insert.destination}.`, 'journey')
      setActiveJourney(journey as Journey)
      return journey as Journey
    },
    [user],
  )

  const endJourney = useCallback(
    async (journeyId: string) => {
      const { error } = await supabase
        .from('journeys')
        .update({ status: 'completed', actual_arrival: new Date().toISOString() })
        .eq('id', journeyId)
      if (error) console.error('End journey error:', error.message)
      await logEvent({
        journey_id: journeyId,
        event_type: 'journey_completed',
        description: 'Journey completed successfully',
        severity: 'low',
        is_simulation: false,
      })
      await notify('Journey Completed', 'You have reached your destination. Stay safe!', 'journey')
      setActiveJourney(null)
      setCheckin(null)
    },
    [],
  )

  const updateJourneyRisk = useCallback(
    async (journeyId: string, level: RiskLevel, score: number) => {
      const { data: journey } = await supabase
        .from('journeys')
        .select('risk_level')
        .eq('id', journeyId)
        .maybeSingle()
      const prev = (journey as Journey | null)?.risk_level
      const { error } = await supabase
        .from('journeys')
        .update({ risk_level: level, risk_score: score })
        .eq('id', journeyId)
      if (error) console.error('Update risk error:', error.message)
      if (prev !== level) {
        await logEvent({
          journey_id: journeyId,
          event_type: 'risk_level_change',
          description: `Risk level changed from ${prev ?? 'unknown'} to ${level} (score: ${score})`,
          severity: level === 'high' ? 'high' : level === 'medium' ? 'medium' : 'low',
          is_simulation: false,
        })
      }
      setActiveJourney((j) => (j && j.id === journeyId ? { ...j, risk_level: level, risk_score: score } : j))
    },
    [],
  )

  const createCheckin = useCallback(
    async (journeyId: string): Promise<SafetyCheckin | null> => {
      if (!user) return null
      const { data, error } = await supabase
        .from('safety_checkins')
        .insert({ journey_id: journeyId, user_id: user.id, status: 'pending' })
        .select()
        .single()
      if (error) {
        console.error('Create checkin error:', error.message)
        return null
      }
      await logEvent({
        journey_id: journeyId,
        event_type: 'check_in_requested',
        description: 'Safety check-in requested',
        severity: 'medium',
        is_simulation: false,
      })
      await notify('Safety Check-In', 'Please confirm you are safe.', 'checkin')
      setCheckin(data as SafetyCheckin)
      return data as SafetyCheckin
    },
    [user],
  )

  const respondCheckin = useCallback(
    async (checkinId: string, response: 'safe' | 'help' | 'emergency') => {
      const { error } = await supabase
        .from('safety_checkins')
        .update({ response, status: 'responded', responded_at: new Date().toISOString() })
        .eq('id', checkinId)
      if (error) console.error('Respond checkin error:', error.message)
      if (checkin) {
        await logEvent({
          journey_id: checkin.journey_id,
          event_type: 'check_in_responded',
          description: `Student responded: ${response.toUpperCase()}`,
          severity: response === 'safe' ? 'low' : 'high',
          is_simulation: false,
        })
      }
      setCheckin(null)
    },
    [checkin],
  )

  const markCheckinMissed = useCallback(
    async (checkinId: string) => {
      const { error } = await supabase
        .from('safety_checkins')
        .update({ status: 'missed' })
        .eq('id', checkinId)
      if (error) console.error('Mark missed error:', error.message)
      if (checkin) {
        await logEvent({
          journey_id: checkin.journey_id,
          event_type: 'check_in_missed',
          description: 'Safety check-in was not responded to',
          severity: 'high',
          is_simulation: false,
        })
        await notify('Check-In Missed', 'You did not respond to the safety check-in. Risk level increased.', 'alert')
      }
      setCheckin(null)
    },
    [checkin],
  )

  const logEvent = useCallback(
    async (event: Omit<SafetyEvent, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) return
      const { error } = await supabase.from('safety_events').insert({
        ...event,
        user_id: user.id,
      })
      if (error) console.error('Log event error:', error.message)
    },
    [user],
  )

  const notify = useCallback(
    async (title: string, message: string, type: string) => {
      if (!user) return
      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        title,
        message,
        type,
      })
      if (error) console.error('Notify error:', error.message)
    },
    [user],
  )

  return (
    <Ctx.Provider
      value={{
        activeJourney,
        checkin,
        loading,
        refreshActive,
        startJourney,
        endJourney,
        updateJourneyRisk,
        createCheckin,
        respondCheckin,
        markCheckinMissed,
        logEvent,
        notify,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useJourney() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider')
  return ctx
}

// Re-export NotificationItem type for convenience
export type { NotificationItem }
