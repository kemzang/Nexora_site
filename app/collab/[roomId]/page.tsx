'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Send, Users, Wifi, WifiOff, ExternalLink, Copy, Check, LogIn } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface CollabMessage {
  id: string
  sender_id: string
  sender_name: string
  role: 'user' | 'assistant'
  content: string
  model_id: string | null
  created_at: string
}

interface CollabMember {
  user_id: string
  display_name: string
  last_seen_at: string
}

// ── Logo ───────────────────────────────────────────────────────────────────────

function NexoraLogo() {
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
      <span className="text-white font-bold text-sm tracking-tight select-none">N</span>
    </div>
  )
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, myUserId }: { msg: CollabMessage; myUserId: string }) {
  const isMe = msg.sender_id === myUserId
  const isAI = msg.role === 'assistant'
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'} mb-3`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 ${
        isAI ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
        : isMe ? 'bg-indigo-600 text-white'
        : 'bg-slate-200 text-slate-600'
      }`}>
        {isAI ? 'AI' : msg.sender_name[0]?.toUpperCase() ?? '?'}
      </div>
      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
        <span className="text-[11px] text-slate-400 px-1">
          {isMe ? 'Vous' : msg.sender_name} · {time}
        </span>
        <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isAI ? 'bg-violet-50 text-violet-900 border border-violet-100'
          : isMe ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
        }`}>
          {isAI && (
            <span className="block text-[10px] font-semibold text-violet-400 mb-1 uppercase tracking-wider">
              {msg.model_id ?? 'AI'}
            </span>
          )}
          {msg.content}
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CollabRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteToken = searchParams.get('token') ?? ''

  const { user, token: authToken, loading: authLoading } = useAuth()

  const [joined, setJoined] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [joinError, setJoinError] = useState('')
  const [roomName, setRoomName] = useState('Session Nexora')
  const [joining, setJoining] = useState(false)

  const [messages, setMessages] = useState<CollabMessage[]>([])
  const [members, setMembers] = useState<CollabMember[]>([])
  const [connected, setConnected] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)
  const cursorRef = useRef(new Date(Date.now() - 5000).toISOString())

  // Pré-remplir le displayName depuis le profil Supabase
  useEffect(() => {
    if (user?.firstName) setDisplayName(user.firstName)
    else if (user?.email) setDisplayName(user.email.split('@')[0])
  }, [user])

  // ── SSE ──
  const connect = useCallback(() => {
    if (!joined || !roomId || !authToken) return
    esRef.current?.close()

    const url = `/api/collab/rooms/${roomId}/stream?since=${encodeURIComponent(cursorRef.current)}`
    const es = new EventSource(url)
    esRef.current = es

    es.addEventListener('messages', (e) => {
      const newMsgs: CollabMessage[] = JSON.parse(e.data)
      if (newMsgs.length > 0) {
        cursorRef.current = newMsgs[newMsgs.length - 1].created_at
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id))
          return [...prev, ...newMsgs.filter(m => !ids.has(m.id))]
        })
      }
    })

    es.addEventListener('presence', (e) => setMembers(JSON.parse(e.data)))

    es.addEventListener('reconnect', (e) => {
      const data = JSON.parse(e.data)
      if (data.since) cursorRef.current = data.since
      es.close()
      setConnected(false)
      setTimeout(connect, 100)
    })

    es.addEventListener('error', (e) => {
      const data = JSON.parse((e as MessageEvent).data ?? '{}')
      if (data.code === 'room_inactive') {
        setConnected(false)
        es.close()
      }
    })

    es.onopen = () => setConnected(true)
    es.onerror = () => {
      setConnected(false)
      es.close()
      setTimeout(connect, 3000)
    }
  }, [joined, roomId, authToken])

  useEffect(() => {
    if (joined) connect()
    return () => esRef.current?.close()
  }, [joined, connect])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Join ──
  const handleJoin = async () => {
    if (!displayName.trim() || !authToken) return
    setJoining(true)
    setJoinError('')
    try {
      const res = await fetch(`/api/collab/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ inviteToken, displayName: displayName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur de connexion')
      setRoomName(data.room.name)
      setJoined(true)
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setJoining(false)
    }
  }

  // ── Send ──
  const handleSend = async () => {
    if (!input.trim() || sending || !authToken) return
    const content = input.trim()
    setInput('')
    setSending(true)
    try {
      await fetch(`/api/collab/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content, role: 'user', senderName: displayName }),
      })
    } catch {
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ── Loading auth ──
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Not logged in ──
  if (!user) {
    const returnUrl = encodeURIComponent(`/collab/${roomId}?token=${inviteToken}`)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 w-full max-w-md text-center">
          <NexoraLogo />
          <h1 className="font-bold text-slate-900 text-lg mt-4 mb-2">Connexion requise</h1>
          <p className="text-slate-500 text-sm mb-6">
            Tu dois être connecté à Nexora pour rejoindre cette session de collaboration.
          </p>
          <button
            onClick={() => router.push(`/auth/login?return=${returnUrl}`)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Se connecter
          </button>
          <p className="text-xs text-slate-400 mt-4">
            Pas encore de compte ?{' '}
            <a href={`/auth/register?return=${returnUrl}`} className="text-indigo-600 hover:underline">
              Créer un compte
            </a>
          </p>
        </div>
      </div>
    )
  }

  // ── Join screen ──
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <NexoraLogo />
            <div>
              <h1 className="font-bold text-slate-900 text-lg">Nexora Collaboration</h1>
              <p className="text-slate-400 text-sm">Session partagée en temps réel</p>
            </div>
          </div>

          {inviteToken ? (
            <>
              <p className="text-sm text-slate-600 mb-5">
                Tu as été invité à rejoindre une session de collaboration. Confirme ton prénom pour continuer.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Ton prénom ou pseudo"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && void handleJoin()}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                {joinError && <p className="text-red-500 text-sm px-1">{joinError}</p>}
                <button
                  onClick={() => void handleJoin()}
                  disabled={!displayName.trim() || joining}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? 'Connexion…' : 'Rejoindre la session'}
                </button>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400 mb-2">Tu préfères utiliser VS Code ?</p>
                <a
                  href={`vscode://nexora/collab?room=${roomId}&token=${inviteToken}`}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ouvrir dans VS Code + Nexora
                </a>
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-4">Lien d'invitation invalide ou expiré.</p>
          )}
        </div>
      </div>
    )
  }

  // ── Session screen ──
  const vscodeLink = `vscode://nexora/collab?room=${roomId}&token=${inviteToken}`

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <NexoraLogo />
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-slate-900 text-sm truncate">{roomName}</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            {connected
              ? <Wifi className="w-3 h-3 text-emerald-500" />
              : <WifiOff className="w-3 h-3 text-slate-300 animate-pulse" />}
            <span className={`text-xs ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>
              {connected ? 'Connecté' : 'Reconnexion…'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Users className="w-4 h-4" />
          <span className="text-xs font-medium">{members.length}</span>
        </div>
        <button
          onClick={copyLink}
          title="Copier le lien d'invitation"
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden max-h-[calc(100vh-60px)]">
        {/* Members sidebar */}
        <aside className="hidden md:flex flex-col w-44 border-r border-slate-100 bg-white overflow-y-auto">
          <div className="px-3 py-2.5 border-b border-slate-50">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">En ligne</p>
          </div>
          {members.map(m => (
            <div key={m.user_id} className="flex items-center gap-2 px-3 py-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.user_id === user.id ? 'bg-indigo-500' : 'bg-emerald-400'}`} />
              <span className="text-xs text-slate-700 truncate">
                {m.display_name}{m.user_id === user.id ? ' (vous)' : ''}
              </span>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-xs text-slate-400 px-3 py-3">Aucun membre en ligne</p>
          )}
          <div className="mt-auto border-t border-slate-100 p-3">
            <a href={vscodeLink} className="flex items-center gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium">
              <ExternalLink className="w-3 h-3" />
              Ouvrir dans VS Code
            </a>
          </div>
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-3 opacity-30">
                    <span className="text-white font-bold text-lg">N</span>
                  </div>
                  <p className="text-slate-400 text-sm">Aucun message pour l'instant.</p>
                  <p className="text-slate-300 text-xs mt-1">Les messages de la session VS Code apparaîtront ici.</p>
                </div>
              </div>
            )}
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} myUserId={user.id} />
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-3">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend() }
                }}
                placeholder="Message… (Entrée pour envoyer)"
                rows={1}
                className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32 leading-relaxed"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 px-1">
              Les réponses IA s'affichent en temps réel depuis VS Code
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
