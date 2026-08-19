import { Link } from 'react-router-dom'
import {
  Shield,
  Route,
  Bot,
  Users,
  Bell,
  MapPin,
  Siren,
  CheckCircle,
  AlertTriangle,
  Moon,
  Sun,
  ArrowRight,
  Sparkles,
  Lock,
  Heart,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'

export default function LandingPage() {
  const { session } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">SafeNet AI</p>
              <p className="text-xs text-neutral-500">Student Safety Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>
            {session ? (
              <Link to="/app/dashboard" className="btn-primary text-sm">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm hidden sm:inline-flex">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 map-bg opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-50 dark:to-neutral-950" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 lg:px-6 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Student Safety Platform
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white lg:text-5xl">
              Your AI-Powered Safety Net for Every Journey.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
              SafeNet AI helps students travel with greater confidence through intelligent journey monitoring, smart check-ins, trusted contacts, and AI-powered safety assistance.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary w-full sm:w-auto">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how-it-works" className="btn-secondary w-full sm:w-auto">
                See How It Works
              </a>
            </div>
          </div>

          {/* Hero card preview */}
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="card overflow-hidden p-0 shadow-lg">
              <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-800/50">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-success-500 animate-pulse-soft" />
                  <span className="text-sm font-semibold">SafeNet AI Dashboard</span>
                </div>
                <span className="badge bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300">
                  <CheckCircle className="h-3 w-3" /> SAFE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                  <Route className="mb-1 h-5 w-5 text-primary-500" />
                  <p className="text-xs text-neutral-500">Active Journey</p>
                  <p className="text-sm font-semibold">College → Hostel</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                  <MapPin className="mb-1 h-5 w-5 text-accent-500" />
                  <p className="text-xs text-neutral-500">ETA</p>
                  <p className="text-sm font-semibold">9:42 PM</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                  <Bot className="mb-1 h-5 w-5 text-primary-500" />
                  <p className="text-xs text-neutral-500">AI Risk</p>
                  <p className="text-sm font-semibold text-success-600">Low</p>
                </div>
                <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/50">
                  <Users className="mb-1 h-5 w-5 text-accent-500" />
                  <p className="text-xs text-neutral-500">Contacts</p>
                  <p className="text-sm font-semibold">3 Trusted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">How It Works</h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">Three simple steps to a safer journey.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Route, title: 'Start a Journey', desc: 'Enter your destination and expected arrival time. SafeNet AI begins monitoring your route.' },
              { icon: Bot, title: 'AI Monitors', desc: 'Our AI assesses risk in real time — detecting route deviations, delays, and missed check-ins.' },
              { icon: Shield, title: 'Stay Protected', desc: 'Smart check-ins, trusted contact alerts, and one-tap SOS keep you covered from start to finish.' },
            ].map((step, i) => (
              <div key={i} className="card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="mb-1 text-xs font-bold text-primary-600">STEP {i + 1}</div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-white py-16 dark:bg-neutral-900 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Key Features</h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">Everything a student needs for safer travel.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Bot, title: 'AI Risk Assessment', desc: 'Explainable AI evaluates time, route, check-ins, and signals to produce a risk score with clear reasons.' },
              { icon: Bell, title: 'Smart Check-Ins', desc: 'Intelligent check-ins at the right moment. Missed responses escalate automatically.' },
              { icon: Route, title: 'Route Deviation Detection', desc: 'Monitors your path and alerts you if you stray significantly from the planned route.' },
              { icon: Users, title: 'Trusted Contacts', desc: 'Add family, friends, or hostel wardens. Share live location when you choose.' },
              { icon: Siren, title: 'Emergency SOS', desc: 'One-tap emergency mode with location sharing and call shortcuts. You stay in control.' },
              { icon: MapPin, title: 'Location Sharing', desc: 'Share your live location with trusted contacts. Mock location fallback for demos.' },
            ].map((f, i) => (
              <div key={i} className="card p-5 transition-shadow hover:shadow-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Safety section */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 lg:px-6">
          <div className="card overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  <Bot className="h-3.5 w-3.5" /> AI Safety Assistant
                </div>
                <h2 className="text-2xl font-bold">AI guidance when it matters most</h2>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Ask the SafeNet AI Assistant about feeling unsafe, travelling alone, getting lost, or low battery. Get calm, practical guidance instantly.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success-500" /> Calm, practical safety advice</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success-500" /> Quick actions for SOS and location sharing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success-500" /> Clearly distinguishes guidance from emergency help</li>
                </ul>
              </div>
              <div className="border-t border-neutral-200 bg-neutral-50 p-8 dark:border-neutral-800 dark:bg-neutral-800/50 md:border-l md:border-t-0">
                <div className="space-y-3">
                  <div className="rounded-xl bg-white p-3 text-sm shadow-sm dark:bg-neutral-900">
                    "I'm travelling alone at night and feel unsafe."
                  </div>
                  <div className="rounded-xl bg-primary-600 p-3 text-sm text-white shadow-sm">
                    Move toward a populated, well-lit area. Share your location with a trusted contact. Start a Safe Journey for monitoring. Would you like to activate Emergency Mode?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-white py-16 dark:bg-neutral-900 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 lg:px-6">
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-bold">Privacy First, Always</h2>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">
              Your location is never shared without your permission. We don't continuously track you. You control who sees what, and Emergency Mode never contacts services without your confirmation.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Lock, title: 'Your Data, Your Control', desc: 'Location sharing is opt-in and stops when you end a journey.' },
              { icon: Shield, title: 'No Auto-Contact', desc: 'SafeNet AI never calls emergency services without your explicit confirmation.' },
              { icon: Heart, title: 'Responsible AI', desc: 'Risk assessments are clearly labeled as AI-generated and explainable.' },
            ].map((p, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600 dark:bg-accent-900/20 dark:text-accent-400">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center lg:px-6">
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Ready to travel safer?</h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Create your free account and start your first Safe Journey today.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="btn-primary w-full sm:w-auto">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="btn-secondary w-full sm:w-auto">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 dark:border-neutral-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">SafeNet AI</span>
          </div>
          <p className="text-xs text-neutral-500">Built for student safety. AI-generated assessments are advisory only.</p>
        </div>
      </footer>
    </div>
  )
}
