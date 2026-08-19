export type RiskLevel = 'low' | 'medium' | 'high'
export type JourneyStatus = 'planned' | 'active' | 'completed' | 'cancelled' | 'emergency'
export type EventType =
  | 'journey_started'
  | 'journey_completed'
  | 'route_deviation'
  | 'check_in_requested'
  | 'check_in_responded'
  | 'check_in_missed'
  | 'sos_activated'
  | 'sos_cancelled'
  | 'risk_level_change'
  | 'location_shared'
  | 'contact_notified'

export interface Profile {
  id: string
  name: string
  email: string
  phone: string | null
  college: string | null
  student_id: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  avatar_url: string | null
  created_at: string
}

export interface TrustedContact {
  id: string
  user_id: string
  name: string
  relationship: string
  phone: string
  email: string | null
  is_primary: boolean
  notification_pref: 'sms' | 'email' | 'both' | 'none'
  created_at: string
}

export interface Journey {
  id: string
  user_id: string
  start_location: string
  destination: string
  start_time: string
  expected_arrival: string
  actual_arrival: string | null
  status: JourneyStatus
  risk_level: RiskLevel
  risk_score: number
  note: string | null
  trusted_contact_id: string | null
  distance_km: number | null
  start_lat: number | null
  start_lng: number | null
  dest_lat: number | null
  dest_lng: number | null
}

export interface SafetyEvent {
  id: string
  user_id: string
  journey_id: string | null
  event_type: EventType
  description: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  is_simulation: boolean
  created_at: string
}

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export interface SafetyCheckin {
  id: string
  journey_id: string
  user_id: string
  requested_at: string
  responded_at: string | null
  response: 'safe' | 'help' | 'emergency' | null
  status: 'pending' | 'responded' | 'missed'
}

export interface RiskAssessment {
  risk_level: RiskLevel
  risk_score: number
  reasons: string[]
  recommendation: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
