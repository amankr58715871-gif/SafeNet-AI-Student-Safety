import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Send, Siren, Share2, Users, Navigation, Sparkles, User } from 'lucide-react'
import { chatWithAI } from '../lib/api'
import type { ChatMessage } from '../lib/types'

const quickPrompts = [
  'I am travelling alone at night',
  'I missed my route',
  'I feel unsafe',
  'My phone battery is low',
  "I don't know where I am",
  'I think I need help',
]

const quickActions = [
  { label: 'Start SOS', icon: Siren, path: '/app/journey/active', danger: true },
  { label: 'Share Location', icon: Share2, path: '/app/journey/active' },
  { label: 'Contact Trusted Person', icon: Users, path: '/app/contacts' },
  { label: 'Check My Journey', icon: Navigation, path: '/app/journey/active' },
]

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm the SafeNet AI Assistant. I'm here to help you with safety-related situations. You can ask me about travelling alone, feeling unsafe, getting lost, low battery, or emergencies. What's on your mind?",
      created_at: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(message: string) {
    if (!message.trim() || loading) return
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    const response = await chatWithAI(message)
    setMessages((m) => [
      ...m,
      { id: `a-${Date.now()}`, role: 'assistant', content: response, created_at: new Date().toISOString() },
    ])
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">SafeNet AI Assistant</h1>
            <p className="text-xs text-neutral-500">AI-powered safety guidance</p>
          </div>
        </div>
        <span className="badge bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500" /> Online
        </span>
      </div>

      {/* Quick actions */}
      <div className="mb-3 flex flex-wrap gap-2">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              a.danger
                ? 'border-danger-200 bg-danger-50 text-danger-700 hover:bg-danger-100 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-300'
                : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
            }`}
          >
            <a.icon className="h-3.5 w-3.5" />
            {a.label}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="card flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
              m.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
            }`}>
              {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              m.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
            }`}>
              <p className="whitespace-pre-line">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-neutral-100 px-4 py-3 dark:bg-neutral-800">
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="mt-3 flex flex-wrap gap-2">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about safety..."
          className="input flex-1"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary">
          <Send className="h-4 w-4" />
        </button>
      </form>

      <p className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
        <Sparkles className="h-3 w-3" />
        AI guidance is advisory. For emergencies, activate SOS or call emergency services.
      </p>
    </div>
  )
}
