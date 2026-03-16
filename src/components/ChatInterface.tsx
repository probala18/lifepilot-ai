import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  X,
  House,
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
import novaFlowLogo from '../assets/novaflow-logo.png';
import novaFlowMark from '../assets/novaflow-mark.svg';

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

type NavLabel = 'Home' | 'Agents' | 'Automations' | 'History' | 'Settings';

interface HistoryEntry {
  id: string;
  feature: FeatureType;
  question: string;
  answer: string;
  createdAt: string;
}

interface UiSettings {
  cardTheme: 'dark' | 'light';
  accent: 'cyan' | 'emerald' | 'blue';
  density: 'comfortable' | 'compact';
  particles: boolean;
}

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
  const [messagesByFeature, setMessagesByFeature] = useState<Record<FeatureType, Message[]>>({
    assistant: [],
    shopping: [],
    health: [],
  });
  const [input, setInput] = useState('');
  const [activeFeature, setActiveFeature] = useState<FeatureType>('assistant');
  const [loadingFeature, setLoadingFeature] = useState<FeatureType | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<NavLabel>('Home');
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | FeatureType>('all');
  const [uiSettings, setUiSettings] = useState<UiSettings>({
    cardTheme: 'dark',
    accent: 'cyan',
    density: 'comfortable',
    particles: true,
  });

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
  const messages = messagesByFeature[activeFeature] || [];
  const isLoading = loadingFeature === activeFeature;
  const filteredHistory = historyFilter === 'all' ? historyEntries : historyEntries.filter((entry) => entry.feature === historyFilter);

  const accentClassMap: Record<UiSettings['accent'], { solid: string; soft: string; border: string; text: string }> = {
    cyan: {
      solid: 'bg-cyan-500',
      soft: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-300',
    },
    emerald: {
      solid: 'bg-emerald-500',
      soft: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-300',
    },
    blue: {
      solid: 'bg-blue-500',
      soft: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-300',
    },
  };

  const activeAccent = accentClassMap[uiSettings.accent];

  const panelClass =
    uiSettings.cardTheme === 'light'
      ? 'rounded-xl border border-slate-200 bg-white/95 p-6 shadow-[0_12px_30px_rgba(2,6,23,0.08)]'
      : 'rounded-xl border border-white/10 bg-white/5 p-6';

  const subPanelClass =
    uiSettings.cardTheme === 'light'
      ? 'rounded-lg border border-slate-200 bg-white p-4'
      : 'rounded-lg border border-white/10 bg-slate-900/60 p-4';

  const titleClass = uiSettings.cardTheme === 'light' ? 'text-slate-900' : 'text-white';
  const bodyClass = uiSettings.cardTheme === 'light' ? 'text-slate-600' : 'text-slate-400';
  const detailClass = uiSettings.cardTheme === 'light' ? 'text-slate-700' : 'text-slate-200';

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
    try {
      const rawSettings = localStorage.getItem('novaflow-ui-settings-v1');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings) as UiSettings;
        setUiSettings(parsed);
      }

      const rawHistory = localStorage.getItem('novaflow-history-v1');
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory) as HistoryEntry[];
        setHistoryEntries(parsed);
      }
    } catch {
      // Ignore localStorage parse errors and keep defaults.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('novaflow-ui-settings-v1', JSON.stringify(uiSettings));
    } catch {
      // Ignore storage errors in restricted environments.
    }
  }, [uiSettings]);

  useEffect(() => {
    const accentHexMap: Record<UiSettings['accent'], string> = {
      cyan: '#06b6d4',
      emerald: '#10b981',
      blue: '#3b82f6',
    };

    document.documentElement.style.setProperty('--accent-cyan', accentHexMap[uiSettings.accent]);
  }, [uiSettings.accent]);

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

    let attempts = 0;
    const timer = window.setInterval(() => {
      const section = document.getElementById(pendingSectionId);
      attempts += 1;

      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPendingSectionId(null);
        window.clearInterval(timer);
      } else if (attempts > 18) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setPendingSectionId(null);
        window.clearInterval(timer);
      }
    }, 90);

    return () => window.clearInterval(timer);
  }, [showChat, pendingSectionId]);

  const handleSidebarNavigation = (label: NavLabel) => {
    setActiveNav(label);
    setSidebarOpen(false);

    if (label === 'Settings') {
      setShowSettingsModal(true);
      return;
    }

    setShowSettingsModal(false);
    setShowChat(false);

    const sectionMap: Record<NavLabel, string> = {
      Home: 'home',
      Agents: 'agents',
      Automations: 'automation-advantages',
      History: 'history',
      Settings: 'home',
    };

    setPendingSectionId(sectionMap[label]);
  };

  const streamText = async (id: string, full: string, feature: FeatureType) => {
    for (let i = 1; i <= full.length; i += 2) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      setMessagesByFeature((prev) => ({
        ...prev,
        [feature]: prev[feature].map((m) => (m.id === id ? { ...m, content: full.slice(0, i) } : m)),
      }));
    }
    setMessagesByFeature((prev) => ({
      ...prev,
      [feature]: prev[feature].map((m) => (m.id === id ? { ...m, content: full } : m)),
    }));
  };

  const formatHistoryAnswer = (feature: FeatureType, reasoning: string, data: any) => {
    const lines: string[] = [reasoning.trim() || 'Done.'];

    if (feature === 'assistant' && data) {
      lines.push('');
      lines.push(`Task: ${data.task || 'N/A'}`);
      lines.push(`Time: ${data.time || 'N/A'}`);
      lines.push(`Action: ${data.suggestedAction || 'N/A'}`);
    }

    if (feature === 'shopping' && data) {
      lines.push('');
      lines.push(`Recommendation: ${data.recommendation || 'N/A'}`);
      lines.push(`Reason: ${data.reason || 'N/A'}`);
      lines.push(`Alternative: ${data.betterAlternative || 'N/A'}`);
    }

    if (feature === 'health' && data) {
      lines.push('');
      lines.push(`Possible Condition: ${data.possibleCondition || 'N/A'}`);
      lines.push(`Advice: ${data.advice || 'N/A'}`);
      lines.push(`When To Consult: ${data.whenToConsultDoctor || 'N/A'}`);
    }

    return lines.join('\n');
  };

  const appendHistory = (question: string, answer: string, feature: FeatureType) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      feature,
      question,
      answer,
      createdAt: new Date().toISOString(),
    };

    setHistoryEntries((prev) => {
      const updated = [entry, ...prev].slice(0, 30);
      try {
        localStorage.setItem('novaflow-history-v1', JSON.stringify(updated));
      } catch {
        // Ignore storage errors in restricted environments.
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const featureAtSend = activeFeature;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      type: featureAtSend,
    };

    setMessagesByFeature((prev) => ({
      ...prev,
      [featureAtSend]: [...prev[featureAtSend], userMessage],
    }));
    setInput('');
    setLoadingFeature(featureAtSend);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: featureAtSend, message: userMessage.content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Request failed');
      }

      const result = await response.json();
      if (!result?.success) throw new Error(result?.error || 'Invalid response');

      const aiId = (Date.now() + 1).toString();
      setMessagesByFeature((prev) => ({
        ...prev,
        [featureAtSend]: [
          ...prev[featureAtSend],
          {
            id: aiId,
            role: 'ai',
            content: '',
            type: featureAtSend,
            data: result.response,
          },
        ],
      }));

      const fullText = (result.reasoning || 'Done.').trim();
      await streamText(aiId, fullText, featureAtSend);
      appendHistory(userMessage.content, formatHistoryAnswer(featureAtSend, fullText, result.response), featureAtSend);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      appendHistory(userMessage.content, `Error: ${message}. Please try again.`, featureAtSend);
      setMessagesByFeature((prev) => ({
        ...prev,
        [featureAtSend]: [
          ...prev[featureAtSend],
          {
            id: (Date.now() + 2).toString(),
            role: 'ai',
            content: `Error: ${message}. Please try again.`,
            type: featureAtSend,
          },
        ],
      }));
    } finally {
      setLoadingFeature(null);
      setShowChat(true);
      setActiveNav('Agents');
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setShowChat(false);
    setMessagesByFeature({ assistant: [], shopping: [], health: [] });
    setLoadingFeature(null);
    setActiveNav('Home');
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

  const handleReuseHistory = (entry: HistoryEntry) => {
    setActiveFeature(entry.feature);
    setInput(entry.question);
    setShowChat(true);
    setActiveNav('Agents');
    setSidebarOpen(false);
    setShowSettingsModal(false);
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
    { label: 'Home', icon: House },
    { label: 'Agents', icon: Bot },
    { label: 'Automations', icon: Workflow },
    { label: 'History', icon: History },
    { label: 'Settings', icon: Settings },
  ];

  return (
    <div data-accent={uiSettings.accent} className={`novaflow-app relative min-h-screen overflow-hidden bg-[#020617] text-white ${uiSettings.cardTheme === 'light' ? 'nf-theme-light' : ''} ${uiSettings.density === 'compact' ? 'text-[14px]' : 'text-[15px]'}`}>
      {uiSettings.particles && <ParticleBackground />}
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
              <img src={novaFlowMark} alt="NovaFlow" className="h-10 w-10" />
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

            
          </motion.aside>
        )}
      </AnimatePresence>

      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] flex-col border-r border-white/10 bg-slate-950/75 p-4 backdrop-blur-xl md:flex">
        <div className="mb-6 mt-2 flex items-center gap-3">
          <img src={novaFlowMark} alt="NovaFlow" className="h-10 w-10" />
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
              <img src={novaFlowMark} alt="NovaFlow" className="hidden h-9 w-9 md:block" />
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
                  onClick={() => {
                    setShowSettingsModal(false);
                    setShowAuthModal(true);
                  }}
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
              <section id="home">
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
                  <div id="intelligence-map">
                    <NeuraFlow />
                  </div>

                  <div id="automation-advantages" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        title: 'Scheduled Reminders',
                        desc: 'Minute-wise cron automation sends timely task nudges without manual effort.',
                        stat: 'Every 1 min',
                      },
                      {
                        title: 'Auto Agent Routing',
                        desc: 'Requests are routed to specialist agents for planning, shopping, and health analysis.',
                        stat: '3 AI Agents',
                      },
                      {
                        title: 'Persistent Task Memory',
                        desc: 'Actions are stored in SQLite so your plan survives refreshes and restarts.',
                        stat: 'SQLite + Indexes',
                      },
                      {
                        title: 'Secure Workflows',
                        desc: 'Session-protected APIs keep automation events scoped to authenticated users only.',
                        stat: 'Auth Guarded',
                      },
                    ].map((item) => (
                      <div key={item.title} className={panelClass}>
                        <p className="text-xs uppercase tracking-wide text-slate-400">Automation Advantage</p>
                        <h3 className={`mt-2 text-lg font-semibold ${titleClass}`}>{item.title}</h3>
                        <p className={`mt-2 text-sm ${bodyClass}`}>{item.desc}</p>
                        <span className={`mt-4 inline-block rounded-md border px-2.5 py-1 text-xs ${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}`}>
                          {item.stat}
                        </span>
                      </div>
                    ))}
                  </div>
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
                <div className="mx-auto max-w-6xl">
                  <div className={panelClass}>
                    <h3 className={`text-xl font-semibold ${titleClass}`}>Conversation History</h3>
                    <p className={`mt-2 text-sm ${bodyClass}`}>
                      Every user prompt and AI response is captured here so judges can see clear evidence of your assistant flow.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {(['all', 'assistant', 'shopping', 'health'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setHistoryFilter(filter)}
                          className={`rounded-md border px-2.5 py-1 text-xs capitalize ${historyFilter === filter ? `${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}` : 'border-white/15 text-slate-400'}`}
                        >
                          {filter === 'all' ? 'All Agents' : filter}
                        </button>
                      ))}
                      {historyEntries.length > 0 && (
                        <button
                          onClick={() => {
                            setHistoryEntries([]);
                            localStorage.removeItem('novaflow-history-v1');
                          }}
                          className="ml-auto rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-300"
                        >
                          Clear History
                        </button>
                      )}
                    </div>

                    {filteredHistory.length === 0 ? (
                      <div className="mt-5 rounded-lg border border-dashed border-white/20 px-4 py-6 text-sm text-slate-400">
                        No history for this filter yet. Ask in chat to populate this timeline.
                      </div>
                    ) : (
                      <div className="mt-5 space-y-3">
                        {filteredHistory.map((entry) => (
                          <div key={entry.id} className={subPanelClass}>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className={`rounded-md border px-2.5 py-1 text-xs capitalize ${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}`}>
                                {entry.feature}
                              </span>
                              <span className={`text-xs ${bodyClass}`}>{new Date(entry.createdAt).toLocaleString()}</span>
                            </div>
                            <p className={`text-sm font-semibold ${titleClass}`}>Q: {entry.question}</p>
                            <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${detailClass}`}>A: {entry.answer}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => handleReuseHistory(entry)}
                                className={`rounded-md border px-2.5 py-1 text-xs ${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}`}
                              >
                                Reuse Prompt
                              </button>
                              <button
                                onClick={() => navigator.clipboard?.writeText(entry.answer).catch(() => {})}
                                className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                              >
                                Copy Answer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
        {showSettingsModal && (
          <motion.div className="fixed inset-0 z-[95] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowSettingsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.95 }}
              className={`relative z-10 w-full max-w-4xl ${panelClass}`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className={`text-xl font-semibold ${titleClass}`}>Settings</h3>
                  <p className={`mt-1 text-sm ${bodyClass}`}>Customize the interface live. Changes affect the entire app shell instantly.</p>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg border border-white/15 bg-white/5 p-2 text-slate-300"
                  aria-label="Close settings"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className={subPanelClass}>
                  <p className={`text-xs uppercase tracking-wide ${bodyClass}`}>Card Theme</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setUiSettings((prev) => ({ ...prev, cardTheme: 'dark' }))}
                      className={`rounded-md border px-3 py-1.5 text-xs ${uiSettings.cardTheme === 'dark' ? `${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}` : 'border-white/15 text-slate-400'}`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setUiSettings((prev) => ({ ...prev, cardTheme: 'light' }))}
                      className={`rounded-md border px-3 py-1.5 text-xs ${uiSettings.cardTheme === 'light' ? `${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}` : 'border-white/15 text-slate-400'}`}
                    >
                      White
                    </button>
                  </div>
                </div>

                <div className={subPanelClass}>
                  <p className={`text-xs uppercase tracking-wide ${bodyClass}`}>Accent</p>
                  <div className="mt-3 flex gap-2">
                    {(['cyan', 'emerald', 'blue'] as const).map((color) => (
                      <button
                        key={color}
                        onClick={() => setUiSettings((prev) => ({ ...prev, accent: color }))}
                        className={`h-7 w-7 rounded-full border ${
                          color === 'cyan'
                            ? 'bg-cyan-500'
                            : color === 'emerald'
                              ? 'bg-emerald-500'
                              : 'bg-blue-500'
                        } ${uiSettings.accent === color ? 'border-white' : 'border-white/30'}`}
                        aria-label={`Set accent to ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className={subPanelClass}>
                  <p className={`text-xs uppercase tracking-wide ${bodyClass}`}>Density</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setUiSettings((prev) => ({ ...prev, density: 'comfortable' }))}
                      className={`rounded-md border px-3 py-1.5 text-xs ${uiSettings.density === 'comfortable' ? `${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}` : 'border-white/15 text-slate-400'}`}
                    >
                      Comfortable
                    </button>
                    <button
                      onClick={() => setUiSettings((prev) => ({ ...prev, density: 'compact' }))}
                      className={`rounded-md border px-3 py-1.5 text-xs ${uiSettings.density === 'compact' ? `${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}` : 'border-white/15 text-slate-400'}`}
                    >
                      Compact
                    </button>
                  </div>
                </div>

                <div className={subPanelClass}>
                  <p className={`text-xs uppercase tracking-wide ${bodyClass}`}>Background Motion</p>
                  <button
                    onClick={() => setUiSettings((prev) => ({ ...prev, particles: !prev.particles }))}
                    className={`mt-3 rounded-md border px-3 py-1.5 text-xs ${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}`}
                  >
                    {uiSettings.particles ? 'Particles: On' : 'Particles: Off'}
                  </button>
                </div>
              </div>

              <div className={`mt-5 flex flex-wrap gap-2 text-xs ${activeAccent.text}`}>
                <span className={`rounded-md border px-2.5 py-1 ${activeAccent.border} ${activeAccent.soft}`}>Auth: Active</span>
                <span className={`rounded-md border px-2.5 py-1 ${activeAccent.border} ${activeAccent.soft}`}>Cron: Every 1 min</span>
                <span className={`rounded-md border px-2.5 py-1 ${activeAccent.border} ${activeAccent.soft}`}>Email: Gmail SMTP</span>
              </div>
            </motion.div>
          </motion.div>
        )}

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
