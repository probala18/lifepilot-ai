import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, ShoppingCart, Stethoscope, CalendarCheck, Info, Sparkles,
  ArrowRight, Play, MessageSquare, Zap, Shield, Clock, ChevronDown, ChevronUp,
  CheckCircle, MousePointerClick, Globe, Cpu, LogOut
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useInView } from 'motion/react';

type FeatureType = 'assistant' | 'shopping' | 'health';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: FeatureType;
  data?: any;
}

/* ── Animated counter ── */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Typewriter effect ── */
function Typewriter({ texts, className }: { texts: string[]; className?: string }) {
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const text = texts[textIndex];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setCurrentText(text.slice(0, charIndex + 1));
        if (charIndex + 1 === text.length) {
          setTimeout(() => setDeleting(true), 1800);
        } else {
          setCharIndex(charIndex + 1);
        }
      } else {
        setCurrentText(text.slice(0, charIndex));
        if (charIndex === 0) {
          setDeleting(false);
          setTextIndex((textIndex + 1) % texts.length);
        } else {
          setCharIndex(charIndex - 1);
        }
      }
    }, deleting ? 30 : 60);
    return () => clearTimeout(timeout);
  }, [charIndex, deleting, textIndex, texts]);

  return <span className={className}>{currentText}<span className="animate-pulse">|</span></span>;
}

/* ── Auth types ── */
interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

/* ── Google Sign-In modal ── */
function GoogleAuthModal({ onSuccess, onClose }: { onSuccess: (u: AuthUser) => void; onClose: () => void }) {
  const btnRef = useRef<HTMLDivElement>(null);
  const successRef = useRef(onSuccess);
  successRef.current = onSuccess;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) return;

    const handleCredential = async (response: { credential: string }) => {
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: response.credential }),
        });
        if (!res.ok) return;
        const { user } = await res.json();
        successRef.current(user);
      } catch {
        // user can retry
      }
    };

    const init = () => {
      const g = (window as any).google;
      if (!g?.accounts?.id || !btnRef.current) return;
      g.accounts.id.initialize({ client_id: clientId, callback: handleCredential });
      g.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 280,
      });
    };

    if ((window as any).google?.accounts?.id) {
      init();
    } else {
      let s = document.getElementById('gsi-script') as HTMLScriptElement | null;
      if (!s) {
        s = document.createElement('script');
        s.id = 'gsi-script';
        s.src = 'https://accounts.google.com/gsi/client';
        s.async = true;
        document.head.appendChild(s);
      }
      s.addEventListener('load', init, { once: true });
    }
  }, [clientId]);

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 bg-[#0f0f1f] border border-white/10 rounded-2xl p-8 w-full max-w-sm mx-4 text-center shadow-2xl"
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-5">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to LifePilot</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Sign in with Google to access your Personal Assistant, Shopping Advisor, and Symptom Analyzer.
        </p>
        <div className="flex justify-center min-h-[44px]">
          {clientId ? (
            <div ref={btnRef} />
          ) : (
            <p className="text-red-400 text-xs">
              VITE_GOOGLE_CLIENT_ID is not configured. Add it to .env.local to enable sign-in.
            </p>
          )}
        </div>
        <p className="mt-6 text-gray-600 text-xs">
          Your session is secured with a signed HTTP-only cookie.
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeFeature, setActiveFeature] = useState<FeatureType>('assistant');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const features = [
    { id: 'assistant', label: 'Personal Assistant', icon: CalendarCheck, color: '#60A5FA', gradient: 'from-blue-500 to-blue-600',
      examples: ['Schedule meeting tomorrow at 10 AM', 'Remind me to call Mom at 6 PM', 'Plan my week ahead', 'Set a deadline for Friday'] },
    { id: 'shopping', label: 'Shopping Decision', icon: ShoppingCart, color: '#F59E0B', gradient: 'from-amber-500 to-amber-600',
      examples: ['Should I buy iPhone 15?', 'Is MacBook M2 worth it?', 'Best laptop under $1000', 'Samsung vs Sony TV?'] },
    { id: 'health', label: 'Symptom Analyzer', icon: Stethoscope, color: '#34D399', gradient: 'from-emerald-500 to-emerald-600',
      examples: ['Headache and fever', 'Stomach pain after eating', 'Feeling tired all the time', 'Sore throat for 3 days'] },
  ] as const;

  const currentFeature = features.find(f => f.id === activeFeature)!;

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ user: u }) => { if (u) setUser(u); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { mouseX.set(e.clientX); mouseY.set(e.clientY); };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [mouseX, mouseY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setShowChat(true);

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, type: activeFeature };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: activeFeature, message: userMessage.content }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to fetch response');
      }
      const result = await response.json();
      if (!result?.success) throw new Error(result?.error || 'Invalid response format');
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: result.reasoning || '', type: activeFeature, data: result.response }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: `Error: ${errorMessage}. Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureSwitch = (featureId: FeatureType) => {
    setActiveFeature(featureId);
    setMessages([]);
    setInput('');
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setShowChat(false);
    setMessages([]);
  };

  const openChat = (featureId?: FeatureType) => {
    if (!user) { setShowAuthModal(true); return; }
    if (featureId) handleFeatureSwitch(featureId);
    setShowChat(true);
  };

  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderMessageData = (msg: Message) => {
    if (!msg.data) return <p className="text-gray-200 leading-relaxed">{msg.content}</p>;

    const Field = ({ label, value, color, delay = 0 }: { label: string; value: string; color: string; delay?: number }) => (
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} className="flex items-start gap-3">
        <span className={`font-semibold ${color} min-w-24 text-sm`}>{label}</span>
        <span className="text-gray-100">{value}</span>
      </motion.div>
    );

    switch (msg.type) {
      case 'assistant':
        return (
          <div className="space-y-3">
            <Field label="Task:" value={msg.data.task} color="text-blue-300" />
            <Field label="Time:" value={msg.data.time} color="text-blue-300" delay={0.1} />
            <Field label="Action:" value={msg.data.suggestedAction} color="text-blue-300" delay={0.2} />
          </div>
        );
      case 'shopping':
        return (
          <div className="space-y-3">
            <Field label="Recommendation:" value={msg.data.recommendation} color="text-amber-300" />
            <Field label="Reason:" value={msg.data.reason} color="text-amber-300" delay={0.1} />
            <Field label="Alternative:" value={msg.data.betterAlternative} color="text-amber-300" delay={0.2} />
          </div>
        );
      case 'health':
        return (
          <div className="space-y-3">
            <Field label="Condition:" value={msg.data.possibleCondition} color="text-emerald-300" />
            <Field label="Advice:" value={msg.data.advice} color="text-emerald-300" delay={0.1} />
            <Field label="Consult:" value={msg.data.whenToConsultDoctor} color="text-emerald-300" delay={0.2} />
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-start gap-3 text-amber-200 text-sm">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{msg.data.disclaimer}</p>
            </motion.div>
          </div>
        );
      default:
        return <p className="text-gray-200">{msg.content}</p>;
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a1a] overflow-hidden">

      {/* Cursor glow */}
      <motion.div className="pointer-events-none fixed w-[600px] h-[600px] rounded-full"
        style={{ x: smoothX, y: smoothY, translateX: '-50%', translateY: '-50%',
          background: 'radial-gradient(circle, rgba(148,163,184,0.08) 0%, rgba(148,163,184,0.03) 40%, transparent 70%)' }} />
      <motion.div className="pointer-events-none fixed w-[300px] h-[300px] rounded-full"
        style={{ x: smoothX, y: smoothY, translateX: '-50%', translateY: '-50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 60%)' }} />

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Ambient blobs */}
      <motion.div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-slate-600/[0.07] blur-[120px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-blue-600/[0.05] blur-[120px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />

      {/* Floating dots */}
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 bg-slate-400 rounded-full"
          style={{ left: `${12 + i * 14}%`, top: `${18 + (i * 37) % 60}%` }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 1.2 }} />
      ))}

      {/* Main layout */}
      <div className="relative z-10 flex flex-col h-screen">

        {/* Navbar */}
        <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-[#0a0a1a]/80 border-b border-white/[0.06] px-6 sm:px-8 py-4 shrink-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <motion.div whileHover={{ scale: 1.03 }} className="flex items-center gap-3 cursor-pointer"
              onClick={() => { setShowChat(false); setMessages([]); }}>
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">LifePilot <span className="text-blue-400">AI</span></h1>
            </motion.div>

            {/* Nav links (landing only) */}
            {!showChat && (
              <div className="hidden md:flex items-center gap-8">
                {[
                  { label: 'Features', href: '#features' },
                  { label: 'How it Works', href: '#how-it-works' },
                  { label: 'FAQ', href: '#faq' },
                  { label: 'Tech Stack', href: '#tech-stack' },
                ].map(link => (
                  <a key={link.href} href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-blue-400 group-hover:w-full transition-all duration-300" />
                  </a>
                ))}
              </div>
            )}

            {/* Agent switcher (chat only) */}
            {showChat && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {features.map(f => {
                  const Icon = f.icon;
                  const isActive = activeFeature === f.id;
                  return (
                    <button key={f.id} onClick={() => handleFeatureSwitch(f.id as FeatureType)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                      }`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex items-center gap-2">
                  <img src={user.picture} alt={user.name} referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-white/20 object-cover" />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={handleSignOut}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </motion.button>
                </div>
              )}
              {showChat ? (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => { setShowChat(false); setMessages([]); }}
                  className="text-sm text-gray-400 hover:text-white transition-colors">
                  ← Back to Home
                </motion.button>
              ) : user ? (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => openChat()}
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg transition-all">
                  Open Chat
                </motion.button>
              ) : (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg transition-all">
                  Sign In
                </motion.button>
              )}
            </div>
          </div>
        </motion.nav>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {!showChat ? (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">

                {/* ── Hero ── */}
                <section className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6">
                  <div className="text-center max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.1] text-gray-300 text-sm font-medium mb-8">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Powered by Google Gemini AI
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="text-5xl sm:text-7xl font-bold mb-6 text-white leading-tight">
                      Your Personal{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-slate-300">
                        AI Life Assistant
                      </span>
                    </motion.h1>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="text-lg sm:text-xl text-gray-400 mb-4 leading-relaxed max-w-2xl mx-auto">
                      Try asking:{' '}
                      <Typewriter
                        texts={[
                          '"Schedule my meeting tomorrow at 10 AM"',
                          '"Should I buy the new MacBook Pro?"',
                          '"I have a headache and fever"',
                          '"Plan my workout for this week"',
                          '"Best phone under $500?"',
                        ]}
                        className="text-white font-medium"
                      />
                    </motion.div>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                      className="text-gray-500 mb-10 max-w-xl mx-auto">
                      Three specialized agents for task management, shopping decisions, and health insights — all through natural conversation.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                        onClick={() => openChat()}
                        className="px-8 py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                        <MessageSquare className="w-5 h-5" /> {user ? 'Start Chatting' : 'Sign In to Start'}
                      </motion.button>
                      <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} href="#features"
                        className="px-8 py-4 rounded-xl font-semibold text-gray-300 border border-white/[0.12] hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
                        Explore Features <ArrowRight className="w-4 h-4" />
                      </motion.a>
                    </motion.div>

                    {/* Mini stats under hero */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                      className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                      {[
                        { label: 'AI Agents', value: 3 },
                        
                        { label: 'Features', value: 10, suffix: '+' },
                      ].map((s, i) => (
                        <div key={i} className="text-center">
                          <p className="text-2xl font-bold text-white"><AnimatedNumber target={s.value} suffix={s.suffix} /></p>
                          <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </section>

                {/* ── Interactive Demo Preview ── */}
                <section className="py-20 px-4 sm:px-6">
                  <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                      {/* Mock browser bar */}
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/60" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                          <div className="w-3 h-3 rounded-full bg-green-500/60" />
                        </div>
                        <div className="flex-1 mx-4 h-7 bg-white/[0.04] rounded-md flex items-center px-3">
                          <span className="text-xs text-gray-500">localhost:3000</span>
                        </div>
                      </div>
                      {/* Mock chat conversation */}
                      <div className="p-6 space-y-4">
                        {[
                          { role: 'user', text: 'Schedule a team standup every Monday at 9 AM', delay: 0 },
                          { role: 'ai', text: '', delay: 0.3, data: { label: 'Personal Assistant', fields: [
                            { k: 'Task', v: 'Team standup meeting' },
                            { k: 'Time', v: 'Every Monday at 9:00 AM' },
                            { k: 'Action', v: 'Set recurring calendar event with team invite' },
                          ]}},
                        ].map((m, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: m.delay + 0.3 }}
                            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl p-4 ${
                              m.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-sm text-sm'
                                : 'bg-white/[0.04] border border-white/[0.08] rounded-bl-sm'
                            }`}>
                              {m.text && <p>{m.text}</p>}
                              {m.data && (
                                <div>
                                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                                    <span className="text-xs text-gray-400 uppercase tracking-wider">{m.data.label}</span>
                                  </div>
                                  <div className="space-y-2">
                                    {m.data.fields.map((f: any, j: number) => (
                                      <motion.div key={j} initial={{ opacity: 0, x: -5 }}
                                        whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                        transition={{ delay: m.delay + 0.5 + j * 0.15 }}
                                        className="flex items-start gap-2 text-sm">
                                        <span className="text-blue-300 font-medium min-w-16">{f.k}:</span>
                                        <span className="text-gray-200">{f.v}</span>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                          transition={{ delay: 1.2 }}
                          className="flex justify-center pt-2">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => openChat()}
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/20 hover:bg-blue-500/5 transition-all">
                            <MousePointerClick className="w-4 h-4" /> {user ? 'Try it yourself' : 'Sign in to try'}
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </section>

                {/* ── Features ── */}
                <section id="features" className="py-24 px-4 sm:px-6">
                  <div className="max-w-6xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Three Agents, <span className="text-blue-400">One App</span>
                      </h2>
                      <p className="text-gray-400 text-lg max-w-xl mx-auto">Click any card to start chatting with that agent immediately.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                      {features.map((f, i) => {
                        const Icon = f.icon;
                        const descs: Record<string, string> = {
                          assistant: 'Extract tasks, deadlines, and smart actions from natural language. Get structured plans from casual requests.',
                          shopping: 'Get unbiased product analysis with reasoning and alternatives. Make smarter purchase decisions.',
                          health: 'Describe symptoms to get possible conditions and advice. Always consult a doctor for real concerns.',
                        };
                        return (
                          <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }} whileHover={{ y: -6, scale: 1.02 }}
                            onClick={() => openChat(f.id as FeatureType)}
                            className="group cursor-pointer p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300 relative overflow-hidden">
                            {/* Hover glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative">
                              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                                <Icon className="w-7 h-7 text-white" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-3">{f.label}</h3>
                              <p className="text-gray-400 text-sm leading-relaxed mb-4">{descs[f.id]}</p>
                              {/* Example prompts preview */}
                              <div className="flex flex-wrap gap-1.5 mb-5">
                                {f.examples.slice(0, 2).map((ex, j) => (
                                  <span key={j} className="text-xs bg-white/[0.04] border border-white/[0.06] text-gray-500 px-2.5 py-1 rounded-md">
                                    {ex}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-400 group-hover:text-blue-300 transition-colors">
                                Try it now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* ── Highlights / Why LifePilot ── */}
                <section className="py-24 px-4 sm:px-6">
                  <div className="max-w-5xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                      <h2 className="text-4xl font-bold text-white mb-4">Why LifePilot?</h2>
                      <p className="text-gray-400 text-lg">Built for speed, accuracy, and simplicity.</p>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {[
                        { icon: Zap, title: 'Instant Responses', desc: 'Powered by Gemini for sub-second structured AI responses.' },
                        { icon: Shield, title: 'Private & Secure', desc: 'No data stored. Conversations stay in your browser session.' },
                        { icon: Clock, title: 'Always Available', desc: 'Works 24/7 — sign in once with Google and access your AI agents any time.' },
                        { icon: Globe, title: 'Works Everywhere', desc: 'Responsive design that works on desktop, tablet, and mobile.' },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -4 }}
                            className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all group">
                            <Icon className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors mb-4" />
                            <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* ── How It Works ── */}
                <section id="how-it-works" className="py-24 px-4 sm:px-6">
                  <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                      <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
                      <p className="text-gray-400 text-lg">Three steps. That's it.</p>
                    </motion.div>
                    <div className="space-y-4">
                      {[
                        { n: '01', title: 'Pick an Agent', desc: 'Choose Personal Assistant, Shopping Advisor, or Health Analyzer.', icon: MousePointerClick },
                        { n: '02', title: 'Ask in Plain English', desc: 'No commands needed — just type naturally like you\'re texting a friend.', icon: MessageSquare },
                        { n: '03', title: 'Get Structured Results', desc: 'Receive clear, actionable responses organized by task, time, and recommended action.', icon: CheckCircle },
                      ].map((s, i) => {
                        const StepIcon = s.icon;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }} whileHover={{ x: 4 }}
                            className="flex gap-5 items-center p-5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all cursor-default group">
                            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0 group-hover:bg-white/[0.08] transition-colors">
                              <StepIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-gray-500">{s.n}</span>
                                <h3 className="text-white font-semibold">{s.title}</h3>
                              </div>
                              <p className="text-gray-500 text-sm mt-1">{s.desc}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* ── FAQ ── */}
                <section id="faq" className="py-24 px-4 sm:px-6">
                  <div className="max-w-2xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                      <h2 className="text-4xl font-bold text-white mb-4">FAQ</h2>
                    </motion.div>
                    <div className="space-y-3">
                      {[
                        { q: 'Is this free to use?', a: 'Yes, LifePilot AI is completely free. It uses the Google Gemini API which has a generous free tier.' },
                        { q: 'Is my data stored anywhere?', a: 'No. All conversations happen in your browser session and are never saved to any server or database.' },
                        { q: 'Can I use this for real medical advice?', a: 'No. The Symptom Analyzer provides general information only. Always consult a qualified healthcare professional for medical concerns.' },
                        { q: 'What AI model powers this?', a: 'LifePilot AI uses Google\'s Gemini 3 Flash Preview model with structured JSON output schemas for reliable, consistent responses.' },
                        { q: 'Can I switch between agents mid-conversation?', a: 'Yes! Use the agent icons at the bottom of the chat to switch. Each agent maintains a clean slate when you switch.' },
                      ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                          className="rounded-xl border border-white/[0.06] overflow-hidden">
                          <button
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors">
                            <span className="text-white font-medium text-sm pr-4">{item.q}</span>
                            {openFaq === i ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
                          </button>
                          <AnimatePresence>
                            {openFaq === i && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                <p className="px-5 pb-5 text-gray-400 text-sm leading-relaxed">{item.a}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* ── Tech Stack ── */}
                <section id="tech-stack" className="py-24 px-4 sm:px-6">
                  <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                      <h2 className="text-4xl font-bold text-white mb-4">Built With Modern Tech</h2>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-6">
                      {[
                        { title: 'Frontend', icon: Globe, items: ['React 19', 'TypeScript', 'Tailwind CSS', 'Framer Motion'] },
                        { title: 'Backend', icon: Cpu, items: ['Node.js', 'Express.js', 'TypeScript', 'Better SQLite3'] },
                        { title: 'AI & Cloud', icon: Sparkles, items: ['Google Gemini API', 'AWS Ready', 'Bedrock Compatible', 'RESTful APIs'] },
                      ].map((sec, i) => {
                        const SIcon = sec.icon;
                        return (
                          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all">
                            <div className="flex items-center gap-3 mb-4">
                              <SIcon className="w-5 h-5 text-gray-400" />
                              <h3 className="text-white font-bold">{sec.title}</h3>
                            </div>
                            <ul className="space-y-2">
                              {sec.items.map((item, j) => (
                                <li key={j} className="text-gray-400 text-sm flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" /> {item}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        );
                      })}
                    </div>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      className="mt-8 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                      <p className="text-gray-400 text-sm">
                        <span className="font-semibold text-gray-300">Hackathon ready</span> — swap Google Gemini with Amazon Bedrock Nova for enterprise deployment.
                      </p>
                    </motion.div>
                  </div>
                </section>

                {/* ── CTA ── */}
                <section className="py-24 px-4 sm:px-6">
                  <div className="max-w-2xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      className="text-center p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                      <h2 className="text-3xl font-bold text-white mb-3">Ready to Try?</h2>
                      <p className="text-gray-400 mb-8">Sign in with Google — free to use, no extra setup needed.</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {features.map((f, i) => {
                          const Icon = f.icon;
                          return (
                            <motion.button key={f.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => openChat(f.id as FeatureType)}
                              className={`px-5 py-3 rounded-xl font-medium text-white bg-gradient-to-br ${f.gradient} flex items-center justify-center gap-2 text-sm shadow-lg`}>
                              <Icon className="w-4 h-4" /> {f.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                </section>

                <footer className="py-8 px-4 border-t border-white/[0.04]">
                  <p className="text-center text-gray-500 text-sm">LifePilot AI — Agentic Personal Life Assistant</p>
                </footer>
              </motion.div>

            ) : (
              /* ══════ Chat View ══════ */
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 space-y-6">
                  <AnimatePresence initial={false}>
                    {messages.length === 0 && !isLoading && (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center px-4">

                        {/* Active agent indicator */}
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mb-6">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentFeature.gradient} flex items-center justify-center shadow-lg`}>
                            {React.createElement(currentFeature.icon, { className: 'w-8 h-8 text-white' })}
                          </div>
                        </motion.div>

                        <p className="text-2xl font-semibold text-white mb-2">{currentFeature.label}</p>
                        <p className="text-gray-500 text-sm mb-8 max-w-sm">
                          {activeFeature === 'assistant' && 'I can help manage tasks, set reminders, and plan your schedule.'}
                          {activeFeature === 'shopping' && 'I can analyze products, compare prices, and suggest alternatives.'}
                          {activeFeature === 'health' && 'I can analyze symptoms and suggest when to see a doctor.'}
                        </p>

                        {/* Feature switcher tabs */}
                        <div className="flex gap-2 mb-8 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          {features.map(f => {
                            const Icon = f.icon;
                            const isActive = activeFeature === f.id;
                            return (
                              <button key={f.id} onClick={() => handleFeatureSwitch(f.id as FeatureType)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                  isActive ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                                }`}>
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{f.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Example prompts grid */}
                        <div className="grid grid-cols-2 gap-2.5 max-w-lg w-full">
                          {currentFeature.examples.map((ex, i) => (
                            <motion.button key={ex} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => setInput(ex)}
                              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.06)' }}
                              whileTap={{ scale: 0.98 }}
                              className="text-left text-sm text-gray-400 hover:text-gray-200 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 transition-colors">
                              <span className="text-gray-600 mr-2">→</span>{ex}
                            </motion.button>
                          ))}
                        </div>

                        <p className="text-gray-600 text-xs mt-6">
                          Press Enter to send • Click an example to fill the input
                        </p>
                      </motion.div>
                    )}

                    {messages.map(msg => (
                      <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-5 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white/[0.04] border border-white/[0.08] text-gray-100 rounded-bl-sm'
                        }`}>
                          {msg.role === 'ai' && (
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/[0.06]">
                              <div className="w-2 h-2 rounded-full bg-blue-400" />
                              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                {features.find(f => f.id === msg.type)?.label}
                              </span>
                            </div>
                          )}
                          {renderMessageData(msg)}
                        </div>
                      </motion.div>
                    ))}

                    {isLoading && (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                          {[0, 1, 2].map(i => (
                            <motion.div key={i} className="w-2.5 h-2.5 bg-blue-400 rounded-full"
                              animate={{ y: [0, -8, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input bar */}
                <div className="border-t border-white/[0.06] bg-[#0a0a1a]/80 backdrop-blur-xl px-4 sm:px-6 py-4">
                  <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <div className="hidden sm:flex gap-2">
                      {features.map(f => {
                        const Icon = f.icon;
                        const active = activeFeature === f.id;
                        return (
                          <motion.button key={f.id} onClick={() => handleFeatureSwitch(f.id as FeatureType)}
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            className={`p-2.5 rounded-xl transition-all ${
                              active
                                ? `bg-gradient-to-br ${f.gradient} text-white shadow-lg`
                                : 'bg-white/[0.04] text-gray-500 hover:text-white hover:bg-white/[0.08]'
                            }`}>
                            <Icon className="w-5 h-5" />
                          </motion.button>
                        );
                      })}
                    </div>
                    <form onSubmit={handleSubmit} className="flex-1 relative flex items-center">
                      <input type="text" value={input} onChange={e => setInput(e.target.value)}
                        placeholder={`Ask ${currentFeature.label}...`}
                        className="w-full pl-4 pr-12 py-3 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] focus:border-blue-500/40 text-gray-100 placeholder-gray-500 rounded-xl focus:outline-none transition-all" />
                      <motion.button type="submit" disabled={!input.trim() || isLoading}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg disabled:opacity-40 transition-all">
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Google auth modal */}
      <AnimatePresence>
        {showAuthModal && (
          <GoogleAuthModal
            onSuccess={(u) => { setUser(u); setShowAuthModal(false); }}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
