import { supabase, FUNCTIONS_URL } from './supabase'
import type { RiskAssessment, RiskLevel } from './types'

export async function analyzeRisk(input: {
  routeDeviationKm?: number
  missedCheckIn?: boolean
  unexpectedStop?: boolean
  journeyDurationMin?: number
  expectedDurationMin?: number
  isNightTravel?: boolean
  userStatus?: string
}): Promise<RiskAssessment> {
  try {
    const { data: session } = await supabase.auth.getSession()
    const res = await fetch(`${FUNCTIONS_URL}/safety-analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.session?.access_token ?? ''}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`Analyze failed (${res.status})`)
    const data = await res.json()
    if (!data.risk_level || typeof data.risk_score !== 'number') {
      throw new Error('Invalid response')
    }
    return data as RiskAssessment
  } catch (err) {
    // Fallback rule-based assessment
    return fallbackAssessment(input)
  }
}

function fallbackAssessment(input: {
  routeDeviationKm?: number
  missedCheckIn?: boolean
  unexpectedStop?: boolean
  journeyDurationMin?: number
  expectedDurationMin?: number
  isNightTravel?: boolean
  userStatus?: string
}): RiskAssessment {
  let score = 0
  const reasons: string[] = []
  if ((input.routeDeviationKm ?? 0) > 0.8) {
    score += 30
    reasons.push('Significant route deviation detected')
  } else if ((input.routeDeviationKm ?? 0) > 0.3) {
    score += 15
    reasons.push('Minor route deviation detected')
  }
  if (input.missedCheckIn) {
    score += 25
    reasons.push('Safety check-in not responded to')
  }
  if (input.unexpectedStop) {
    score += 15
    reasons.push('Unexpected stop detected')
  }
  if (input.expectedDurationMin && input.journeyDurationMin) {
    const overrun = input.journeyDurationMin - input.expectedDurationMin
    if (overrun > 10) {
      score += 20
      reasons.push('Journey taking longer than expected')
    }
  }
  if (input.isNightTravel) {
    score += 10
    reasons.push('Travelling during late-night hours')
  }
  if (input.userStatus === 'unsafe') {
    score += 40
    reasons.push('User reported feeling unsafe')
  }
  score = Math.min(100, Math.max(0, score))
  let level: RiskLevel = 'low'
  if (score >= 60) level = 'high'
  else if (score >= 30) level = 'medium'
  if (reasons.length === 0) reasons.push('No abnormal safety signals detected')
  const recommendation =
    level === 'high'
      ? 'High-risk conditions detected. Please confirm you are safe. Move toward a populated, well-lit area and contact a trusted person. This is an AI-generated assessment.'
      : level === 'medium'
        ? 'Caution advised. Please confirm your safety and stay alert. Move toward a public area if uncomfortable. This is an AI-generated assessment.'
        : 'Your journey appears normal. Stay aware of your surroundings. This is an AI-generated assessment.'
  return { risk_level: level, risk_score: score, reasons, recommendation }
}

export async function chatWithAI(message: string): Promise<string> {
  try {
    const { data: session } = await supabase.auth.getSession()
    const res = await fetch(`${FUNCTIONS_URL}/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.session?.access_token ?? ''}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ message }),
    })
    if (!res.ok) throw new Error(`Chat failed (${res.status})`)
    const data = await res.json()
    if (typeof data.response !== 'string') throw new Error('Invalid response')
    return data.response
  } catch {
    return fallbackChat(message)
  }
}

function fallbackChat(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('unsafe') || lower.includes('scared') || lower.includes('afraid')) {
    return "I understand you're feeling unsafe. Move toward a populated, well-lit area. Share your location with a trusted contact. If the situation escalates, activate Emergency Mode."
  }
  if (lower.includes('alone') || lower.includes('night')) {
    return "Travelling alone at night can be stressful. Share your live location with a trusted contact, choose well-lit routes, keep your phone charged, and start a Safe Journey for monitoring."
  }
  if (lower.includes('lost') || lower.includes('route') || lower.includes('where')) {
    return "Stay calm. Stop in a safe place, check your map, and share your location with a trusted contact so they can guide you."
  }
  if (lower.includes('battery') || lower.includes('charge')) {
    return "Enable low-power mode, share your location with a trusted contact now while you have battery, and stop somewhere to charge if possible."
  }
  if (lower.includes('help') || lower.includes('emergency') || lower.includes('sos')) {
    return "If you need urgent help, activate Emergency Mode to alert your trusted contacts with your location. Call emergency services if you're in danger."
  }
  return "I'm here to help with safety concerns. You can tell me about feeling unsafe, travelling alone, getting lost, low battery, or emergencies. What's your situation?"
}
