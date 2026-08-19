import type { RiskLevel } from './types'

export function riskColor(level: RiskLevel): {
  bg: string
  text: string
  border: string
  dot: string
  label: string
} {
  switch (level) {
    case 'low':
      return {
        bg: 'bg-success-50 dark:bg-success-900/30',
        text: 'text-success-700 dark:text-success-300',
        border: 'border-success-200 dark:border-success-800',
        dot: 'bg-success-500',
        label: 'LOW RISK',
      }
    case 'medium':
      return {
        bg: 'bg-warning-50 dark:bg-warning-900/30',
        text: 'text-warning-700 dark:text-warning-300',
        border: 'border-warning-200 dark:border-warning-800',
        dot: 'bg-warning-500',
        label: 'CAUTION',
      }
    case 'high':
      return {
        bg: 'bg-danger-50 dark:bg-danger-900/30',
        text: 'text-danger-700 dark:text-danger-300',
        border: 'border-danger-200 dark:border-danger-800',
        dot: 'bg-danger-500',
        label: 'HIGH RISK',
      }
  }
}

export function severityColor(severity: string): string {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'text-danger-600 dark:text-danger-400'
    case 'medium':
      return 'text-warning-600 dark:text-warning-400'
    case 'low':
      return 'text-success-600 dark:text-success-400'
    default:
      return 'text-primary-600 dark:text-primary-400'
  }
}

export function severityBg(severity: string): string {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'bg-danger-500'
    case 'medium':
      return 'bg-warning-500'
    case 'low':
      return 'bg-success-500'
    default:
      return 'bg-primary-500'
  }
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} • ${formatTime(iso)}`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Estimate distance between two lat/lng points (Haversine, km)
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Mock location generator for demo mode
export function mockLocation(
  startLat: number,
  startLng: number,
  destLat: number,
  destLng: number,
  progress: number,
  deviationKm = 0,
): { lat: number; lng: number } {
  const lat = startLat + (destLat - startLat) * progress
  const lng = startLng + (destLng - startLng) * progress
  // Add deviation perpendicular to the route
  if (deviationKm > 0) {
    const dLat = destLat - startLat
    const dLng = destLng - startLng
    const len = Math.sqrt(dLat * dLat + dLng * dLng) || 1
    const perpLat = (-dLng / len) * (deviationKm / 111)
    const perpLng = (dLat / len) * (deviationKm / (111 * Math.cos((lat * Math.PI) / 180) || 1))
    return { lat: lat + perpLat, lng: lng + perpLng }
  }
  return { lat, lng }
}
