import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck, Trash2, Route, AlertTriangle, Siren, Shield } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { timeAgo, formatDateTime } from '../lib/utils'
import type { NotificationItem } from '../lib/types'

const typeIcon: Record<string, { icon: typeof Bell; color: string }> = {
  journey: { icon: Route, color: 'text-success-600 dark:text-success-400' },
  alert: { icon: AlertTriangle, color: 'text-warning-600 dark:text-warning-400' },
  checkin: { icon: Bell, color: 'text-warning-600 dark:text-warning-400' },
  emergency: { icon: Siren, color: 'text-danger-600 dark:text-danger-400' },
  test: { icon: Shield, color: 'text-primary-600 dark:text-primary-400' },
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifs((data as NotificationItem[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
    const channel = supabase
      .channel('notifications-page')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifs((n) => n.map((x) => x.id === id ? { ...x, read: true } : x))
  }

  async function markAllRead() {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifs((n) => n.map((x) => ({ ...x, read: true })))
  }

  async function deleteNotif(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifs((n) => n.filter((x) => x.id !== id))
  }

  const unread = notifs.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-neutral-500">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : notifs.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
            <Bell className="h-6 w-6 text-neutral-400" />
          </div>
          <h2 className="font-semibold">No notifications</h2>
          <p className="mt-1 text-sm text-neutral-500">You'll see journey updates, check-ins, and alerts here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const meta = typeIcon[n.type] ?? typeIcon.test
            const Icon = meta.icon
            return (
              <div
                key={n.id}
                className={`card flex items-start gap-3 p-4 transition-colors ${
                  n.read ? 'opacity-70' : ''
                }`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{n.message}</p>
                  <p className="mt-1 text-xs text-neutral-400">{formatDateTime(n.created_at)} • {timeAgo(n.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Mark read">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-900/20" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
