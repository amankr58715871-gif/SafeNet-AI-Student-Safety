import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Route,
  Navigation,
  Bot,
  Users,
  History,
  Bell,
  User,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Shield,
  Siren,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { useJourney } from '../lib/journey'
import { supabase } from '../lib/supabase'
import { initials } from '../lib/utils'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/journey/new', label: 'Start Journey', icon: Route },
  { to: '/app/journey/active', label: 'Active Journey', icon: Navigation },
  { to: '/app/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/app/contacts', label: 'Trusted Contacts', icon: Users },
  { to: '/app/history', label: 'Safety History', icon: History },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: User },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

const mobileNav = [
  { to: '/app/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/app/journey/active', label: 'Journey', icon: Navigation },
  { to: '/app/assistant', label: 'AI', icon: Bot },
  { to: '/app/profile', label: 'Profile', icon: User },
]

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { activeJourney } = useJourney()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    async function loadUnread() {
      const { data: session } = await supabase.auth.getSession()
      if (!session?.session?.user) return
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
      setUnreadCount(count ?? 0)
    }
    loadUnread()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, loadUnread)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, loadUnread)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:flex">
        <div className="flex items-center gap-2 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-white">SafeNet AI</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Student Safety</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-danger-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
              {item.label === 'Active Journey' && activeJourney && (
                <span className="ml-auto h-2 w-2 rounded-full bg-success-500 animate-pulse-soft" />
              )}
            </NavLink>
          ))}
          <NavLink
            to="/app/demo"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300'
                  : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`
            }
          >
            <Sparkles className="h-4.5 w-4.5" />
            <span>Demo Mode</span>
            <span className="ml-auto badge bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">JUDGES</span>
          </NavLink>
        </nav>
        <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-neutral-900 animate-slide-in">
            <div className="flex items-center justify-between px-4 py-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold">SafeNet AI</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-neutral-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1 px-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-300'
                    }`
                  }
                >
                  <item.icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-neutral-600 dark:text-neutral-300 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold">SafeNet AI</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                {navItems.find((n) => location.pathname.startsWith(n.to))?.label ?? 'SafeNet AI'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/app/journey/active')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              title="Emergency SOS"
              aria-label="Emergency SOS"
            >
              <Siren className="h-5 w-5" />
            </button>
            <Link
              to="/app/profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
            >
              {profile?.name ? initials(profile.name) : '?'}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-neutral-200 bg-white px-2 py-2 dark:border-neutral-800 dark:bg-neutral-900 lg:hidden">
        {mobileNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => navigate('/app/journey/active')}
          className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-500 text-white shadow-md">
            <Siren className="h-4 w-4" />
          </div>
          <span>SOS</span>
        </button>
      </nav>
    </div>
  )
}
