import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  ShoppingCart,
  Activity,
  Send,
  Mic,
  MicOff,
  Sun,
  Moon,
  CheckCircle2,
  BrainCircuit,
  Paperclip,
  X,
  Plus,
  BookOpen,
  Sparkles,
  ListTodo,
  Layers,
  ShieldCheck,
  Cpu,
  Mail,
  ArrowRight,
  Database,
  Clock,
} from 'lucide-react';

import Hero from './Hero';
import ChatMessage from './ChatMessage';
import AgentCard from './AgentCard';
import TaskTray, { TaskItem } from './TaskTray';

type AgentType = 'assistant' | 'shopping' | 'health';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: AgentType;
  data?: any;
  reasoning?: string;
  timestamp?: string;
}

export default function ChatInterface() {
  const [activeAgent, setActiveAgent] = useState<AgentType>('assistant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reasonEnabled, setReasonEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifepilot-theme') as 'dark' | 'light' | null;
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  });
  const [taskTrayOpen, setTaskTrayOpen] = useState<boolean>(false);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const refreshTaskCount = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.tasks)) {
          setTaskCount(data.tasks.filter((t: TaskItem) => !t.completed).length);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    refreshTaskCount();
  }, [refreshTaskCount]);

  // Apply theme to document element and localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    try {
      localStorage.setItem('lifepilot-theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  // Auto-scroll chat stream
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const scrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      inputRef.current?.focus();
    }, 400);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      type: activeAgent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: activeAgent, message: content }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errData.error || 'Request failed');
      }

      const result = await res.json();
      if (!result?.success) throw new Error(result?.error || 'Invalid response');

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: result.response?.text || '',
        type: activeAgent,
        data: result.response,
        reasoning: reasonEnabled ? result.reasoning : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      refreshTaskCount();
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Error: ${error.message || 'Unable to process request'}. Please try again.`,
        type: activeAgent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const commandCategories = {
    schedule: {
      label: 'Task & Reminders',
      icon: CalendarCheck,
      agent: 'assistant' as AgentType,
      prompts: [
        'Schedule dentist appointment tomorrow at 10am',
        'Remind me to submit Q3 budget review this Friday at 4pm',
        'Add grocery run to my task list for Saturday morning',
      ],
    },
    decisions: {
      label: 'Purchase Decisions',
      icon: ShoppingCart,
      agent: 'shopping' as AgentType,
      prompts: [
        'Compare Sony WH-1000XM5 vs Bose QuietComfort Ultra headphones',
        'Is the M3 MacBook Air 16GB worth the upgrade over M2?',
        'Best ergonomic mechanical keyboard under $150',
      ],
    },
    health: {
      label: 'Symptom Triage',
      icon: Activity,
      agent: 'health' as AgentType,
      prompts: [
        'Mild tension headache and dry eyes after 8 hours of screen time',
        'Sore throat and low-grade fever for 2 days, no cough',
        'Sharp knee discomfort after running 5k',
      ],
    },
  };

  const agentDetails = [
    {
      id: 'assistant',
      icon: CalendarCheck,
      label: 'Personal Assistant',
      description: 'Parses tasks and dates with automated SQLite storage and scheduled email reminders.',
      examples: [
        'Schedule team sync tomorrow at 2pm',
        'Remind me to take vitamins at 8am',
      ],
    },
    {
      id: 'shopping',
      icon: ShoppingCart,
      label: 'Shopping Decisions',
      description: 'Objective comparative analysis, spec breakdowns, and trade-off evaluations.',
      examples: [
        'MacBook Air M3 vs ThinkPad X1 Carbon',
        'Best budget espresso machine under $300',
      ],
    },
    {
      id: 'health',
      icon: Activity,
      label: 'Symptom Analyzer',
      description: 'Clinical-style triage assessment with emergency red flags and medical disclaimers.',
      examples: [
        'Persistent dull headache and shoulder tension',
        'Mild dry cough for 3 days',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col antialiased transition-colors duration-150">
      {/* Top Bar Navigation */}
      <header className="h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-semibold text-sm tracking-tight text-[var(--text-main)]">LifePilot</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
              v2.0
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-5 text-xs text-[var(--text-secondary)]">
            <a href="#overview" className="hover:text-[var(--text-main)] transition-colors">
              Overview
            </a>
            <a href="#workspace" className="hover:text-[var(--text-main)] transition-colors">
              Assistant
            </a>
            <a href="#architecture" className="hover:text-[var(--text-main)] transition-colors">
              Architecture
            </a>
            <a href="#faq" className="hover:text-[var(--text-main)] transition-colors">
              FAQ
            </a>
          </nav>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2.5">
          {/* SQLite Tasks Drawer Button */}
          <button
            onClick={() => setTaskTrayOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] transition-colors shadow-sm"
            title="Open SQLite Task Database"
          >
            <ListTodo className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Tasks</span>
            {taskCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-mono text-[10px] flex items-center justify-center">
                {taskCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] transition-colors shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>
        </div>
      </header>

      {/* Hero Section (Landing Page) */}
      <div id="overview">
        <Hero
          onStartClick={scrollToWorkspace}
          onSelectAgent={(agent) => {
            setActiveAgent(agent);
            scrollToWorkspace();
          }}
        />
      </div>

      {/* Main Interactive Assistant Workspace Section */}
      <section
        id="workspace"
        ref={workspaceRef}
        className="border-t border-[var(--border-subtle)] bg-[var(--bg-app)] py-16 px-4 sm:px-6 scroll-mt-14 transition-colors"
      >
        <div className="max-w-4xl w-full mx-auto flex flex-col">
          {/* Section Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[var(--border-subtle)] gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-blue-500">
                Live Interactive System
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] mt-1">
                Multi-Agent Workspace
              </h2>
            </div>

            {/* Agent Mode Pills */}
            <div className="flex items-center gap-1.5">
              {(['assistant', 'shopping', 'health'] as const).map((agentKey) => {
                const meta = commandCategories[
                  agentKey === 'assistant'
                    ? 'schedule'
                    : agentKey === 'shopping'
                      ? 'decisions'
                      : 'health'
                ];
                const Icon = meta.icon;
                const isActive = activeAgent === agentKey;

                return (
                  <button
                    key={agentKey}
                    onClick={() => setActiveAgent(agentKey)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--agent-assistant-bg)] text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Stream or Quick Launch Panel */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4">
              {/* Agent Capability Cards */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                {agentDetails.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    id={agent.id}
                    icon={agent.icon}
                    label={agent.label}
                    description={agent.description}
                    examples={agent.examples}
                    isActive={activeAgent === agent.id}
                    onClick={(id) => setActiveAgent(id as AgentType)}
                    onSelectPrompt={(p) => {
                      setActiveAgent(agent.id as AgentType);
                      handleSendMessage(p);
                    }}
                  />
                ))}
              </div>

              {/* Quick Command categories accordion (21st.dev reference) */}
              <div className="w-full mb-6">
                <div className="grid grid-cols-3 gap-2.5 mb-3">
                  {Object.entries(commandCategories).map(([key, cat]) => {
                    const Icon = cat.icon;
                    const isCatActive = activeCategory === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveCategory(isCatActive ? null : key)}
                        className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors shadow-sm ${
                          isCatActive
                            ? 'bg-[var(--bg-surface-elevated)] border-blue-500/50 text-[var(--text-main)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-[var(--text-main)]">{cat.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {activeCategory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1 shadow-sm">
                        {commandCategories[activeCategory as keyof typeof commandCategories].prompts.map(
                          (prompt, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setActiveAgent(
                                  commandCategories[activeCategory as keyof typeof commandCategories]
                                    .agent
                                );
                                handleSendMessage(prompt);
                              }}
                              className="w-full text-left p-2 rounded text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)] transition-colors flex items-center justify-between"
                            >
                              <span>&rarr; {prompt}</span>
                              <span className="text-[11px] text-[var(--text-muted)]">Run &rarr;</span>
                            </button>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Active Messages Stream */
            <div className="space-y-4 py-4 min-h-[300px]">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && (
                <ChatMessage
                  message={{
                    id: 'loading',
                    role: 'ai',
                    content: '',
                    type: activeAgent,
                  }}
                  isLoading={true}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Unified Input Box (21st.dev reference, no gradients, pure solid surfaces) */}
          <div className="mt-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus-within:border-blue-500/50 transition-colors shadow-sm overflow-hidden">
            <div className="px-4 pt-3.5 pb-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={`Ask ${
                  activeAgent === 'assistant'
                    ? 'to schedule tasks, set reminders, or organize plans...'
                    : activeAgent === 'shopping'
                      ? 'to compare products, evaluate specs, or recommend gear...'
                      : 'about symptoms, triage protocols, or medical context...'
                }`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Controls Row */}
            <div className="px-3 pb-2.5 pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded bg-[var(--bg-surface-elevated)] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5 border border-[var(--border-subtle)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="capitalize">{activeAgent}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setReasonEnabled(!reasonEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                    reasonEnabled
                      ? 'bg-[var(--agent-assistant-bg)] text-blue-600 dark:text-blue-400 border border-blue-500/40 shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]'
                  }`}
                  title="Toggle multi-agent reasoning trace visibility"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Reason</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-1.5 rounded-md transition-colors ${
                    isListening
                      ? 'bg-red-500/20 text-red-500'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                  title={isListening ? 'Listening...' : 'Voice Input'}
                >
                  {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  disabled={!input.trim() || isLoading}
                  onClick={() => handleSendMessage()}
                  className="w-7 h-7 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--bg-subtle)] text-white disabled:text-[var(--text-muted)] flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & How It Works Section */}
      <section id="architecture" className="py-20 px-4 sm:px-8 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] transition-colors">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-500">
              System Architecture
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-main)] mt-1.5 mb-3">
              How LifePilot executes without hallucinated actions
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Every request is routed through a deterministic triage pipeline, validated against strict schemas, and persisted locally.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-8 h-8 rounded-md bg-[var(--agent-assistant-bg)] text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">Intent Classification</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Natural language inquiries are parsed into structured entity slots. Dates, priorities, product models, and symptom severity flags are extracted deterministically.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                Phase 01 · Parsing
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-8 h-8 rounded-md bg-[var(--agent-assistant-bg)] text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">Synchronous SQLite Persistence</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Scheduled tasks and reminders are immediately written to local WAL-mode SQLite storage (`lifepilot.db`). No cloud lock-in; your schedule stays local.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                Phase 02 · State
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-8 h-8 rounded-md bg-[var(--agent-assistant-bg)] text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-main)] mb-2">Automated Cron Dispatch</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  A high-efficiency background node-cron worker polls due reminders every 60 seconds and dispatches verified SMTP reminder emails directly to your inbox.
                </p>
              </div>
              <div className="pt-4 mt-6 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)]">
                Phase 03 · Execution
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-8 border-t border-[var(--border-subtle)] bg-[var(--bg-app)] transition-colors">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-500">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text-main)] mt-1.5">
              Clear answers, zero fluff.
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1.5">
                Where are my tasks and reminders stored?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                All tasks are stored in your local SQLite database (`lifepilot.db`) in WAL mode. You have full ownership and direct access to your data.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1.5">
                How does email reminder dispatch work?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                LifePilot runs a background cron task every 60 seconds. When a reminder’s due timestamp arrives, the system triggers your configured Gmail or SMTP transporter and flags `reminder_sent = 1` in SQLite.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm">
              <h3 className="text-sm font-semibold text-[var(--text-main)] mb-1.5">
                Does the symptom analyzer provide medical diagnosis?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                No. The symptom analyzer is an educational triage protocol designed to provide structured context, self-care suggestions, and red-flag escalation guidance. It never replaces professional medical consultation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer per taste-skill */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-app)] py-12 px-4 sm:px-8 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-semibold text-[var(--text-main)]">LifePilot AI</span>
            <span>· Autonomous Multi-Agent Intelligence</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#overview" className="hover:text-[var(--text-main)] transition-colors">
              Overview
            </a>
            <a href="#workspace" className="hover:text-[var(--text-main)] transition-colors">
              Assistant
            </a>
            <a href="#architecture" className="hover:text-[var(--text-main)] transition-colors">
              Architecture
            </a>
            <a href="#faq" className="hover:text-[var(--text-main)] transition-colors">
              FAQ
            </a>
          </div>

          <div className="text-[11px] font-mono text-[var(--text-muted)]">
            SQLite WAL · Node.js 26 · Framer Motion
          </div>
        </div>
      </footer>

      {/* Task Drawer */}
      <TaskTray
        isOpen={taskTrayOpen}
        onClose={() => setTaskTrayOpen(false)}
        onSelectTask={(task) => {
          setInput(`Review task: "${task.task}" due on ${task.due_at || 'unscheduled'}`);
          setTaskTrayOpen(false);
          scrollToWorkspace();
        }}
      />
    </div>
  );
}
