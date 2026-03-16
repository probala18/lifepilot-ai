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
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Sun,
  Moon,
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
type LandingAccordion = 'problem' | 'solution' | 'architecture' | 'features' | 'voice';

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
  const [activeAccordion, setActiveAccordion] = useState<LandingAccordion>('architecture');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | FeatureType>('all');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historySort, setHistorySort] = useState<'newest' | 'oldest' | 'longest'>('newest');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceInterim, setVoiceInterim] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [uiSettings, setUiSettings] = useState<UiSettings>({
    cardTheme: 'dark',
    accent: 'cyan',
    density: 'comfortable',
    particles: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceRecognitionRef = useRef<any>(null);

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

  const filteredHistory = useMemo(() => {
    const byFilter =
      historyFilter === 'all'
        ? [...historyEntries]
        : historyEntries.filter((entry) => entry.feature === historyFilter);

    const query = historyQuery.trim().toLowerCase();
    const bySearch = query
      ? byFilter.filter((entry) => {
          return (
            entry.question.toLowerCase().includes(query) ||
            entry.answer.toLowerCase().includes(query) ||
            entry.feature.toLowerCase().includes(query)
          );
        })
      : byFilter;

    return bySearch.sort((a, b) => {
      if (historySort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (historySort === 'longest') {
        return b.answer.length - a.answer.length;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [historyEntries, historyFilter, historyQuery, historySort]);

  const historyStats = useMemo(() => {
    const base = {
      total: historyEntries.length,
      assistant: 0,
      shopping: 0,
      health: 0,
      avgAnswer: 0,
    };

    if (historyEntries.length === 0) return base;

    let totalAnswerChars = 0;
    for (const entry of historyEntries) {
      base[entry.feature] += 1;
      totalAnswerChars += entry.answer.length;
    }

    base.avgAnswer = Math.round(totalAnswerChars / historyEntries.length);
    return base;
  }, [historyEntries]);

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
  const bedrockBadgeClass =
    uiSettings.cardTheme === 'light'
      ? 'border-sky-500/40 bg-gradient-to-r from-sky-500/15 via-cyan-500/15 to-emerald-500/15 text-slate-700 shadow-[0_0_16px_rgba(56,189,248,0.15)]'
      : 'border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-emerald-500/20 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.22)]';

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
    if (uiSettings.cardTheme === 'light' && uiSettings.particles) {
      setUiSettings((prev) => ({ ...prev, particles: false }));
      return;
    }

    if (uiSettings.cardTheme === 'dark' && !uiSettings.particles) {
      setUiSettings((prev) => ({ ...prev, particles: true }));
    }
  }, [uiSettings.cardTheme, uiSettings.particles]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsVoiceListening(true);
      setVoiceError(null);
    };

    recognition.onend = () => {
      setIsVoiceListening(false);
      setVoiceInterim('');
    };

    recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      if (!result) return;

      const transcript = String(result[0]?.transcript || '').trim();
      if (!transcript) return;

      if (result.isFinal) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setVoiceInterim('');
      } else {
        setVoiceInterim(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      if (event?.error === 'not-allowed') {
        setVoiceError('Microphone permission is blocked. Please allow mic access.');
      } else {
        setVoiceError('Voice capture failed. Please try again.');
      }
    };

    voiceRecognitionRef.current = recognition;

    return () => {
      if (voiceRecognitionRef.current) {
        try {
          voiceRecognitionRef.current.stop();
        } catch {
          // Ignore stop errors during unmount.
        }
      }
    };
  }, []);

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

  const handleQuickNavigation = (sectionId: string, navContext: NavLabel) => {
    setSidebarOpen(false);
    setShowSettingsModal(false);
    setActiveNav(navContext);
    setShowChat(false);
    setPendingSectionId(sectionId);
  };

  const toggleVoiceInput = () => {
    if (!voiceSupported || !voiceRecognitionRef.current) {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    if (isVoiceListening) {
      voiceRecognitionRef.current.stop();
      return;
    }

    try {
      setVoiceError(null);
      voiceRecognitionRef.current.start();
    } catch {
      setVoiceError('Unable to start microphone. Please try again.');
    }
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

    if (isVoiceListening && voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
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

  const quickActions: { label: string; hint: string; onClick: () => void }[] = [
    {
      label: 'Start Voice Chat',
      hint: 'Open assistant and listen',
      onClick: () => {
        openChat('assistant');
        setTimeout(() => toggleVoiceInput(), 180);
      },
    },
    {
      label: 'View Architecture',
      hint: 'Jump to NeuraFlow diagram',
      onClick: () => handleQuickNavigation('architecture-section', 'Home'),
    },
    {
      label: 'History Insights',
      hint: 'Jump to analytics timeline',
      onClick: () => handleQuickNavigation('history', 'History'),
    },
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

            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Quick Links</p>
              <div className="space-y-1">
                {quickActions.map((item) => (
                  <button
                    key={item.label}
                    className="w-full rounded-md border border-white/10 px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-white/5"
                    onClick={item.onClick}
                  >
                    <span className="block font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] text-slate-500">{item.hint}</span>
                  </button>
                ))}
              </div>
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

        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">Quick Links</p>
          <div className="space-y-1">
            {quickActions.map((item) => (
              <button
                key={item.label}
                className="w-full rounded-md border border-white/10 px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-white/5"
                onClick={item.onClick}
              >
                <span className="block font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-[10px] text-slate-500">{item.hint}</span>
              </button>
            ))}
          </div>
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
                <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${bedrockBadgeClass}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                  Built with Amazon Nova on AWS Bedrock
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setUiSettings((prev) => ({
                    ...prev,
                    cardTheme: prev.cardTheme === 'light' ? 'dark' : 'light',
                    particles: prev.cardTheme === 'light',
                  }))
                }
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 hover:border-cyan-500/30"
                aria-label="Toggle theme"
                title={uiSettings.cardTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {uiSettings.cardTheme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>

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
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="px-4 pb-24 sm:px-6"
              >
                <div className="mx-auto max-w-6xl space-y-8">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div id="problem-section" className={panelClass}>
                      <button
                        className="flex w-full items-center justify-between"
                        onClick={() => setActiveAccordion((prev) => (prev === 'problem' ? 'solution' : 'problem'))}
                      >
                        <h3 className={`text-2xl font-semibold ${titleClass}`}>The Problem</h3>
                        {activeAccordion === 'problem' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                      <AnimatePresence initial={false}>
                        {activeAccordion === 'problem' && (
                          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`mt-3 space-y-2 overflow-hidden text-sm ${detailClass}`}>
                            <li>Modern productivity tools are fragmented.</li>
                            <li>Users must constantly switch between apps for emails, calendars, reminders, and decisions.</li>
                            <li>This creates cognitive overload and lost productivity.</li>
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>

                    <div id="solution-section" className={panelClass}>
                      <button
                        className="flex w-full items-center justify-between"
                        onClick={() => setActiveAccordion((prev) => (prev === 'solution' ? 'architecture' : 'solution'))}
                      >
                        <h3 className={`text-2xl font-semibold ${titleClass}`}>Our Solution</h3>
                        {activeAccordion === 'solution' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                      <AnimatePresence initial={false}>
                        {activeAccordion === 'solution' && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <p className={`mt-3 text-sm leading-relaxed ${detailClass}`}>
                              NovaFlow is an AI-powered productivity operating system that understands user intent and autonomously manages workflows.
                            </p>
                            <p className={`mt-2 text-sm leading-relaxed ${detailClass}`}>
                              Instead of manually switching between apps, users simply ask NovaFlow, and the system handles everything.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div id="architecture-section" className={panelClass}>
                    <button
                      className="flex w-full items-center justify-between"
                      onClick={() => setActiveAccordion((prev) => (prev === 'architecture' ? 'features' : 'architecture'))}
                    >
                      <h3 className={`text-2xl font-semibold ${titleClass}`}>How It Works: NeuraFlow Architecture</h3>
                      {activeAccordion === 'architecture' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {activeAccordion === 'architecture' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <p className={`mt-2 text-sm ${bodyClass}`}>NovaFlow uses a multi-agent AI architecture called NeuraFlow.</p>
                          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center">
                            {[
                              '1. User sends voice or text request',
                              '2. Amazon Nova model understands the intent',
                              '3. NeuraFlow routes the task to specialized agents',
                              '4. Agents execute actions such as email drafting, scheduling, or analysis',
                            ].map((step, idx) => (
                              <React.Fragment key={step}>
                                <div className={subPanelClass}>
                                  <p className={`text-sm font-medium ${detailClass}`}>{step}</p>
                                </div>
                                {idx < 3 && (
                                  <div className="hidden lg:flex items-center justify-center text-cyan-300">→</div>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div id="key-features" className={panelClass}>
                    <button
                      className="flex w-full items-center justify-between"
                      onClick={() => setActiveAccordion((prev) => (prev === 'features' ? 'voice' : 'features'))}
                    >
                      <h3 className={`text-2xl font-semibold ${titleClass}`}>Key Features</h3>
                      {activeAccordion === 'features' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {activeAccordion === 'features' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {[
                              {
                                title: 'AI Personal Assistant',
                                desc: 'Understands natural language tasks and converts them into structured actions.',
                              },
                              {
                                title: 'Smart Task Automation',
                                desc: 'Automatically schedules meetings, reminders, and follow-ups.',
                              },
                              {
                                title: 'AI Decision Engine',
                                desc: 'Analyzes options and helps users make better purchasing or planning decisions.',
                              },
                            
                              {
                                title: 'Multi-Agent Intelligence',
                                desc: 'Specialized AI agents collaborate to complete complex tasks.',
                              },
                            ].map((feature) => (
                              <div key={feature.title} className={subPanelClass}>
                                <p className={`text-sm font-semibold ${titleClass}`}>{feature.title}</p>
                                <p className={`mt-2 text-sm ${bodyClass}`}>{feature.desc}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div id="voice-assistant" className={panelClass}>
                    <button
                      className="flex w-full items-center justify-between"
                      onClick={() => setActiveAccordion((prev) => (prev === 'voice' ? 'architecture' : 'voice'))}
                    >
                      <h3 className={`text-2xl font-semibold ${titleClass}`}>Voice Assistant with Nova Model</h3>
                      {activeAccordion === 'voice' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {activeAccordion === 'voice' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <p className={`mt-3 text-sm leading-relaxed ${detailClass}`}>
                            NovaFlow voice assistant uses the same Amazon Nova reasoning pipeline as text interactions. Voice input is transcribed, interpreted by Nova, then routed through NeuraFlow agents for execution.
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className={subPanelClass}>
                              <p className={`text-xs uppercase tracking-wide ${bodyClass}`}>Input</p>
                              <p className={`mt-1 text-sm ${detailClass}`}>Voice command captured</p>
                            </div>
                            <div className={subPanelClass}>
                              <p className={`text-xs uppercase tracking-wide ${bodyClass}`}>Model</p>
                              <p className={`mt-1 text-sm ${detailClass}`}>Amazon Nova intent reasoning</p>
                            </div>
                            <div className={subPanelClass}>
                              <p className={`text-xs uppercase tracking-wide ${bodyClass}`}>Execution</p>
                              <p className={`mt-1 text-sm ${detailClass}`}>Agent actions + workflow outputs</p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                openChat('assistant');
                                setTimeout(() => toggleVoiceInput(), 180);
                              }}
                              className={`rounded-md border px-3 py-1.5 text-xs ${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}`}
                            >
                              Start Voice Assistant in Chat
                            </button>
                            <span className={`rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs ${bodyClass}`}>
                              {voiceSupported ? 'Mic supported in this browser' : 'Mic not supported in this browser'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.section>

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

                  <div className="mb-5 mt-10 text-center">
                    <h3 className={`text-2xl font-semibold ${titleClass}`}>Why we need Automation</h3>
                    <p className={`mx-auto mt-2 max-w-2xl text-sm ${bodyClass}`}>
                      Key capabilities your judges can validate directly in this project.
                    </p>
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
                            setExpandedHistoryId(null);
                          }}
                          className="ml-auto rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-300"
                        >
                          Clear History
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                          value={historyQuery}
                          onChange={(e) => setHistoryQuery(e.target.value)}
                          placeholder="Search question, answer, or agent"
                          className="w-full rounded-lg border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={() =>
                          setHistorySort((prev) =>
                            prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'longest' : 'newest',
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-300"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        Sort: {historySort === 'newest' ? 'Newest' : historySort === 'oldest' ? 'Oldest' : 'Longest'}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: 'Total Conversations', value: String(historyStats.total) },
                        { label: 'Assistant / Shopping / Health', value: `${historyStats.assistant} / ${historyStats.shopping} / ${historyStats.health}` },
                        { label: 'Avg Answer Length', value: `${historyStats.avgAnswer} chars` },
                        { label: 'Current View', value: `${filteredHistory.length} shown` },
                      ].map((stat, idx) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.06 }}
                          className={subPanelClass}
                        >
                          <p className="text-[11px] uppercase tracking-wide text-slate-400">{stat.label}</p>
                          <p className={`mt-1 text-sm font-semibold ${titleClass}`}>{stat.value}</p>
                        </motion.div>
                      ))}
                    </div>

                    {filteredHistory.length === 0 ? (
                      <div className="mt-5 rounded-lg border border-dashed border-white/20 px-4 py-6 text-sm text-slate-400">
                        No history for this filter yet. Ask in chat to populate this timeline.
                      </div>
                    ) : (
                      <motion.div layout className="mt-5 space-y-3">
                        <AnimatePresence initial={false}>
                        {filteredHistory.map((entry, index) => {
                          const expanded = expandedHistoryId === entry.id;
                          const shouldTruncate = entry.answer.length > 280;
                          const answerText = expanded || !shouldTruncate ? entry.answer : `${entry.answer.slice(0, 280)}...`;
                          return (
                          <motion.div
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.22, delay: index * 0.015 }}
                            className={`${subPanelClass} relative overflow-hidden`}
                          >
                            <div className={`absolute left-0 top-0 h-full w-1 ${activeAccent.solid}`} />
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <span className={`rounded-md border px-2.5 py-1 text-xs capitalize ${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}`}>
                                {entry.feature}
                              </span>
                              <span className={`text-xs ${bodyClass}`}>{new Date(entry.createdAt).toLocaleString()}</span>
                            </div>
                            <p className={`text-sm font-semibold ${titleClass}`}>Q: {entry.question}</p>
                            <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${detailClass}`}>A: {answerText}</p>

                            {shouldTruncate && (
                              <button
                                onClick={() => setExpandedHistoryId((prev) => (prev === entry.id ? null : entry.id))}
                                className={`mt-2 inline-flex items-center gap-1 text-xs ${activeAccent.text}`}
                              >
                                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                {expanded ? 'Show less' : 'Show full answer'}
                              </button>
                            )}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => handleReuseHistory(entry)}
                                className={`rounded-md border px-2.5 py-1 text-xs ${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}`}
                              >
                                Ask Again
                              </button>
                              <button
                                onClick={() => navigator.clipboard?.writeText(entry.answer).catch(() => {})}
                                className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                              >
                                Copy Answer
                              </button>
                            </div>
                          </motion.div>
                        );
                        })}
                        </AnimatePresence>
                      </motion.div>
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
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-24 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`absolute right-12 top-1/2 z-20 -translate-y-1/2 rounded-lg p-2 text-white transition ${
                        isVoiceListening
                          ? 'bg-red-500/80 hover:bg-red-500'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                      aria-label="Toggle voice input"
                    >
                      {isVoiceListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
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

                  {(isVoiceListening || voiceInterim || voiceError) && (
                    <div className="mt-2 text-xs">
                      {voiceError ? (
                        <p className="text-red-300">{voiceError}</p>
                      ) : (
                        <p className={`${activeAccent.text}`}>
                          {isVoiceListening ? 'Listening...' : 'Voice ready.'}
                          {voiceInterim ? ` ${voiceInterim}` : ''}
                        </p>
                      )}
                    </div>
                  )}
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
                      onClick={() => setUiSettings((prev) => ({ ...prev, cardTheme: 'dark', particles: true }))}
                      className={`rounded-md border px-3 py-1.5 text-xs ${uiSettings.cardTheme === 'dark' ? `${activeAccent.border} ${activeAccent.soft} ${activeAccent.text}` : 'border-white/15 text-slate-400'}`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setUiSettings((prev) => ({ ...prev, cardTheme: 'light', particles: false }))}
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
                    onClick={() => {
                      if (uiSettings.cardTheme === 'dark') {
                        setUiSettings((prev) => ({ ...prev, particles: true }));
                      }
                    }}
                    disabled={uiSettings.cardTheme === 'light'}
                    className={`mt-3 rounded-md border px-3 py-1.5 text-xs ${activeAccent.border} ${activeAccent.soft} ${activeAccent.text} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {uiSettings.cardTheme === 'light'
                      ? 'Particles: Off (Light mode)'
                      : 'Particles: On (Dark mode)'}
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
