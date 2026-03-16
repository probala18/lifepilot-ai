import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  X,
  LayoutDashboard,
  Bot,
  Workflow,
  History,
  Settings,
  LogOut,
  MessageSquare,
  Send,
  Shield,
  Cpu,
  Zap,
  CalendarCheck,
  ShoppingCart,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './Hero';
import NeuraFlow from './NeuraFlow';
import AgentCard from './AgentCard';
import ChatMessage from './ChatMessage';
import ParticleBackground from './ParticleBackground';
import novaFlowLogo from '../assets/novaflow-logo.svg';

type FeatureType = 'assistant' | 'shopping' | 'health';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: FeatureType;
  data?: any;
}

interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

interface Feature {
  id: FeatureType;
  label: string;
  icon: LucideIcon;
  description: string;
  gradient: string;
  examples: string[];
  color: string;
}

type NavLabel = 'Dashboard' | 'Agents' | 'Automations' | 'History' | 'Settings';

function GoogleAuthModal({ onSuccess, onClose }: { onSuccess: (u: AuthUser) => void; onClose: () => void }) {
  const btnRef = useRef<HTMLDivElement>(null);
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
        onSuccess(user);
      } catch {
        // Retry from UI
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
        shape: 'pill',
        width: 280,
      });
    };

    if ((window as any).google?.accounts?.id) {
      init();
    } else {
      let script = document.getElementById('gsi-script') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', init, { once: true });
    }
  }, [clientId, onSuccess]);

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-cyan-500/25 bg-slate-950/90 p-8 text-center shadow-[0_30px_100px_rgba(6,182,212,0.18)]"
      >
        <img src={novaFlowLogo} alt="NovaFlow" className="mx-auto mb-5 h-16 w-auto" />
        <h2 className="mb-1 text-2xl font-bold text-white">Welcome to NovaFlow</h2>
        <p className="mb-5 text-xs text-slate-400">Your Autonomous AI Operating System</p>

        <div className="mb-6 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-300">Authorized Login</p>
          <p className="text-sm font-semibold text-cyan-300">shawni@devpost.com</p>
        </div>

        <p className="mb-6 text-sm text-slate-300">Sign in with Google to unlock agents and automation workflows.</p>

        <div className="flex min-h-[44px] justify-center">
          {clientId ? (
            <div ref={btnRef} />
          ) : (
            <p className="text-xs text-red-400">VITE_GOOGLE_CLIENT_ID is missing in env.</p>
          )}
        </div>
        <p className="mt-5 text-xs text-slate-500">Secured with HTTP-only session cookies.</p>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<NavLabel>('Dashboard');
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const features: Feature[] = useMemo(
    () => [
      {
        id: 'assistant',
        label: 'Personal Assistant',
        icon: CalendarCheck,
        description: 'Manages tasks, deadlines, and scheduling intelligence.',
        gradient: 'from-sky-600 via-cyan-600 to-emerald-500',
        examples: ['Schedule a meeting tomorrow at 10 AM', 'Remind me to call Mom at 6 PM', 'Plan my week ahead'],
        color: '#06B6D4',
      },
      {
        id: 'shopping',
        label: 'Shopping Decision',
        icon: ShoppingCart,
        description: 'Compares products and recommends smarter purchases.',
        gradient: 'from-cyan-600 via-sky-600 to-blue-600',
        examples: ['Should I buy iPhone 15?', 'Best laptop under $1000', 'Samsung vs Sony TV?'],
        color: '#0EA5E9',
      },
      {
        id: 'health',
        label: 'Symptom Analyzer',
        icon: Stethoscope,
        description: 'Interprets symptoms with guided health suggestions.',
        gradient: 'from-emerald-600 via-cyan-600 to-sky-600',
        examples: ['Headache and fever', 'Stomach pain after eating', 'Sore throat for 3 days'],
        color: '#10B981',
      },
    ],
    [],
  );

  const currentFeature = features.find((f) => f.id === activeFeature)!;

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(({ user: u }) => {
        if (u) setUser(u);
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (showChat || !pendingSectionId) return;

    // Wait one paint so landing sections exist after the chat->landing transition.
    const frame = window.requestAnimationFrame(() => {
      scrollToSection(pendingSectionId);
      setPendingSectionId(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [showChat, pendingSectionId]);

  const handleSidebarNavigation = (label: NavLabel) => {
    setActiveNav(label);
    setSidebarOpen(false);
    setShowChat(false);

    const sectionMap: Record<NavLabel, string> = {
      Dashboard: 'dashboard',
      Agents: 'agents',
      Automations: 'automations',
      History: 'history',
      Settings: 'settings',
    };

    setPendingSectionId(sectionMap[label]);
  };

  const streamText = async (id: string, full: string) => {
    for (let i = 1; i <= full.length; i += 2) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: full.slice(0, i) } : m)));
    }
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: full } : m)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: activeFeature,
    };

    setMessages((prev) => [...prev, userMessage]);
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
        throw new Error(errorData.error || 'Request failed');
      }

      const result = await response.json();
      if (!result?.success) throw new Error(result?.error || 'Invalid response');

      const aiId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: aiId,
          role: 'ai',
          content: '',
          type: activeFeature,
          data: result.response,
        },
      ]);

      const fullText = (result.reasoning || 'Done.').trim();
      await streamText(aiId, fullText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'ai',
          content: `Error: ${message}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setShowChat(true);
      setActiveNav('Agents');
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setShowChat(false);
    setMessages([]);
    setActiveNav('Dashboard');
  };

  const openChat = (featureId?: FeatureType) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (featureId) setActiveFeature(featureId);
    setShowChat(true);
    setSidebarOpen(false);
    setActiveNav('Agents');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400"
        />
      </div>
    );
  }

  const sidebarItems: { label: NavLabel; icon: LucideIcon }[] = [
    { label: 'Dashboard', icon: LayoutDashboard },
    { label: 'Agents', icon: Bot },
    { label: 'Automations', icon: Workflow },
    { label: 'History', icon: History },
    { label: 'Settings', icon: Settings },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <ParticleBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.14),transparent_35%)]" />

      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-white/10 bg-slate-900/80 p-2 md:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-white/10 bg-slate-950/85 p-4 backdrop-blur-xl md:hidden"
          >
            <div className="mb-6 mt-12 flex items-center gap-3 md:mt-2">
              <img src={novaFlowLogo} alt="NovaFlow" className="h-10 w-auto" />
              <div>
                <p className="text-sm text-slate-400">NovaFlow</p>
                <p className="text-base font-semibold gradient-text">AI Console</p>
              </div>
            </div>

            <div className="space-y-1">
              {sidebarItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.label}
                    whileHover={{ x: 4 }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      activeNav === item.label ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'
                    }`}
                    onClick={() => handleSidebarNavigation(item.label)}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-auto rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs text-cyan-300">
              <p className="font-semibold">Authorized Login</p>
              <p className="text-cyan-200">shawni@devpost.com</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] flex-col border-r border-white/10 bg-slate-950/75 p-4 backdrop-blur-xl md:flex">
        <div className="mb-6 mt-2 flex items-center gap-3">
          <img src={novaFlowLogo} alt="NovaFlow" className="h-10 w-auto" />
          <div>
            <p className="text-sm text-slate-400">NovaFlow</p>
            <p className="text-base font-semibold gradient-text">AI Console</p>
          </div>
        </div>

        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeNav === item.label ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'
                }`}
                onClick={() => handleSidebarNavigation(item.label)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        
      </aside>

      <div className="relative z-10 min-h-screen md:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/45 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <img src={novaFlowLogo} alt="NovaFlow" className="hidden h-9 w-auto md:block" />
              <div>
                <h1 className="text-lg font-bold">NovaFlow AI</h1>
                <p className="text-xs text-slate-400">Your Autonomous AI Operating System</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full border border-white/20" referrerPolicy="no-referrer" />
                  <button
                    onClick={handleSignOut}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500/30"
                  >
                    <LogOut className="mr-1 inline h-3.5 w-3.5" /> Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="rounded-lg bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 px-4 py-2 text-sm font-semibold"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!showChat ? (
            <motion.main
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="overflow-hidden"
            >
              <section id="dashboard">
                <Hero user={user} onStartClick={() => openChat()} />
              </section>

              <motion.section
                id="automations"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="px-4 py-20 sm:px-6"
              >
                <div className="mx-auto max-w-6xl">
                  <NeuraFlow />
                </div>
              </motion.section>

              <motion.section
                id="agents"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="px-4 py-20 sm:px-6"
              >
                <div className="mx-auto max-w-6xl">
                  <h2 className="mb-4 text-center text-4xl font-bold">Specialized AI Agents</h2>
                  <p className="mx-auto mb-10 max-w-3xl text-center text-slate-400">
                    Premium feature cards with interactive motion, glow borders, and instant navigation into each AI workflow.
                  </p>
                  <div className="grid gap-6 md:grid-cols-3">
                    {features.map((feature) => (
                      <div key={feature.id}>
                        <AgentCard
                          id={feature.id}
                          icon={feature.icon}
                          label={feature.label}
                          description={feature.description}
                          gradient={feature.gradient}
                          examples={feature.examples}
                          color={feature.color}
                          onClick={(id) => openChat(id as FeatureType)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>

              <motion.section
                id="history"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="px-4 pb-24 sm:px-6"
              >
                <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3">
                  {[
                    { icon: Zap, title: 'Fast Responses', desc: 'Smooth 60fps UI and low-latency AI flow.' },
                    { icon: Shield, title: 'Secure Session', desc: 'Cookie-based auth with protected API routes.' },
                    { icon: Cpu, title: 'Nova Powered', desc: 'Server-backed Bedrock Nova intelligence.' },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08 }}
                        className="glass rounded-xl p-6"
                      >
                        <Icon className="mb-3 h-6 w-6 text-cyan-300" />
                        <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>

              <motion.section
                id="settings"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="px-4 pb-24 sm:px-6"
              >
                <div className="mx-auto max-w-6xl rounded-xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-xl font-semibold text-white">Settings</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Configure your preferred agent workflows, notification behavior, and UI experience.
                  </p>
                </div>
              </motion.section>
            </motion.main>
          ) : (
            <motion.main
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex h-[calc(100vh-73px)] flex-col"
            >
              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                {messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto mt-12 max-w-2xl text-center"
                  >
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 via-cyan-600 to-emerald-500 shadow-[0_0_35px_rgba(14,165,233,0.35)]">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-bold">Start AI Conversation</h2>
                    <p className="mt-2 text-slate-400">Choose a feature and ask naturally. The AI will reason and respond with structured output.</p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {currentFeature.examples.map((example) => (
                        <button
                          key={example}
                          onClick={() => setInput(example)}
                          className="glass rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-slate-300 hover:border-cyan-500/30"
                        >
                          <span className="mr-2 text-cyan-300">&gt;</span>
                          {example}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="mx-auto max-w-4xl space-y-5">
                    {messages.map((message, idx) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isLoading={isLoading && idx === messages.length - 1 && message.role === 'ai'}
                      />
                    ))}

                    {isLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="glass rounded-2xl rounded-bl-sm border border-white/10 p-4">
                          <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="h-2.5 w-2.5 rounded-full bg-cyan-400"
                                animate={{ y: [0, -7, 0] }}
                                transition={{ repeat: Infinity, duration: 0.85, delay: i * 0.12 }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur-xl sm:px-6">
                <div className="mx-auto max-w-4xl">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {features.map((feature) => {
                      const Icon = feature.icon;
                      const active = activeFeature === feature.id;
                      return (
                        <button
                          key={feature.id}
                          onClick={() => setActiveFeature(feature.id)}
                          className={
                            active
                              ? `rounded-lg bg-gradient-to-r ${feature.gradient} px-3 py-1.5 text-xs font-semibold text-white`
                              : 'rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-500/30'
                          }
                        >
                          <Icon className="mr-1 inline h-3.5 w-3.5" />
                          {feature.label}
                        </button>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSubmit} className="relative">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Ask ${currentFeature.label}...`}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none"
                    />
                    <motion.button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-500 p-2 text-white disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                    </motion.button>
                  </form>
                </div>
              </div>
            </motion.main>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAuthModal && (
          <GoogleAuthModal
            onSuccess={(u) => {
              setUser(u);
              setShowAuthModal(false);
            }}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
