import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AppLayout from './components/AppLayout'
import DashboardPage from './pages/DashboardPage'
import StartJourneyPage from './pages/StartJourneyPage'
import ActiveJourneyPage from './pages/ActiveJourneyPage'
import AssistantPage from './pages/AssistantPage'
import TrustedContactsPage from './pages/TrustedContactsPage'
import SafetyHistoryPage from './pages/SafetyHistoryPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import DemoPanelPage from './pages/DemoPanelPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="journey/new" element={<StartJourneyPage />} />
        <Route path="journey/active" element={<ActiveJourneyPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="contacts" element={<TrustedContactsPage />} />
        <Route path="history" element={<SafetyHistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="demo" element={<DemoPanelPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
