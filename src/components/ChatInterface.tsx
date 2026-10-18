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
  User,
  LogOut,
  ListTodo,
} from 'lucide-react';

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

interface AuthUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

export default function ChatInterface() {
  const [activeAgent, setActiveAgent] = useState<AgentType>('assistant');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reasonEnabled, setReasonEnabled] = useState<boolean>(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [taskTrayOpen, setTaskTrayOpen] = useState<boolean>(false);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check auth status on load
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          refreshTaskCount();
          return;
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const refreshTaskCount = async () => {
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
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-scroll chat stream
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleDemoSignIn = async () => {
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          refreshTaskCount();
        }
      }
    } catch (e) {
      console.error('Demo sign-in failed', e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setTaskCount(0);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || isLoading) return;

    // Ensure session exists; if not, auto-activate guest session
    if (!user) {
      await handleDemoSignIn();
    }

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
    <div className="min-h-screen bg-[#090b0e] text-[#f3f5f8] flex flex-col antialiased">
      {/* Top Bar - No glass, pure solid bar */}
      <header className="h-14 border-b border-[#1e2430] bg-[#090b0e] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="font-semibold text-sm tracking-tight text-[#f3f5f8]">LifePilot</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#161b24] text-[#9aa2b2]">
              v2.0
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1 ml-4 pl-4 border-l border-[#1e2430]">
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
                      ? 'bg-[#1e293b] text-blue-400 border border-blue-500/40'
                      : 'text-[#9aa2b2] hover:bg-[#161b24] hover:text-[#f3f5f8]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2.5">
          {/* SQLite Tasks Drawer Button */}
          <button
            onClick={() => setTaskTrayOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#161b24] hover:bg-[#1c222e] border border-[#1e2430] text-xs text-[#f3f5f8] transition-colors"
            title="Open SQLite Task Database"
          >
            <ListTodo className="w-3.5 h-3.5 text-blue-400" />
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
            className="p-1.5 rounded-md text-[#9aa2b2] hover:text-[#f3f5f8] hover:bg-[#161b24] transition-colors"
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Auth indicator */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#1e2430]">
              <span className="text-xs text-[#9aa2b2] hidden sm:inline">{user.name || user.email}</span>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-md text-[#9aa2b2] hover:text-red-400 hover:bg-[#161b24] transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleDemoSignIn}
              className="text-xs px-2.5 py-1 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium transition-colors"
            >
              Demo Sign-In
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 pt-6 pb-28">
        {/* Welcome Empty State (When no messages yet) */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            {/* 2-line confident headline per taste-skill */}
            <div className="text-center mb-8 max-w-xl">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f3f5f8] mb-2 leading-tight">
                Autonomous personal intelligence, grounded in action.
              </h1>
              <p className="text-sm text-[#9aa2b2] leading-relaxed">
                Choose an agent below or ask a question directly to begin coordinating your life.
              </p>
            </div>

            {/* Tri-Agent Cards per taste-skill */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
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
            <div className="w-full mb-4">
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {Object.entries(commandCategories).map(([key, cat]) => {
                  const Icon = cat.icon;
                  const isCatActive = activeCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(isCatActive ? null : key)}
                      className={`p-3 rounded-lg border text-left flex items-center justify-between transition-colors ${
                        isCatActive
                          ? 'bg-[#161b24] border-blue-500/50 text-[#f3f5f8]'
                          : 'bg-[#10141a] border-[#1e2430] hover:border-[#2c3547] text-[#9aa2b2]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-[#f3f5f8]">{cat.label}</span>
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
                    <div className="p-3 rounded-lg bg-[#10141a] border border-[#1e2430] space-y-1">
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
                            className="w-full text-left p-2 rounded text-xs text-[#cbd5e1] hover:text-white hover:bg-[#161b24] transition-colors flex items-center justify-between"
                          >
                            <span>&rarr; {prompt}</span>
                            <span className="text-[11px] text-[#677184]">Run &rarr;</span>
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
          /* Active Chat Stream */
          <div className="flex-1 space-y-4 py-4">
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
      </main>

      {/* Floating Bottom Prompt Bar (21st.dev inspired, flat surfaces, zero gradients) */}
      <footer className="fixed bottom-0 inset-x-0 bg-[#090b0e] border-t border-[#1e2430] p-4 z-30">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-[#10141a] border border-[#1e2430] focus-within:border-blue-500/50 transition-colors shadow-sm overflow-hidden">
            {/* Input Line */}
            <div className="px-4 pt-3 pb-2 flex items-center gap-2">
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
                className="w-full bg-transparent text-sm text-[#f3f5f8] outline-none placeholder:text-[#677184]"
              />
            </div>

            {/* Controls Bar */}
            <div className="px-3 pb-2.5 pt-1 border-t border-[#161b24] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {/* Active Agent Badge */}
                <span className="px-2 py-1 rounded bg-[#161b24] text-blue-400 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="capitalize">{activeAgent}</span>
                </span>

                {/* Reasoning Toggle Pill */}
                <button
                  type="button"
                  onClick={() => setReasonEnabled(!reasonEnabled)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                    reasonEnabled
                      ? 'bg-[#1e293b] text-blue-400 border border-blue-500/40'
                      : 'text-[#677184] hover:text-[#9aa2b2] bg-[#161b24]'
                  }`}
                  title="Toggle multi-agent reasoning trace visibility"
                >
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>Reason</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Microphone Voice Button */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-1.5 rounded-md transition-colors ${
                    isListening
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-[#677184] hover:text-[#f3f5f8] hover:bg-[#161b24]'
                  }`}
                  title={isListening ? 'Listening...' : 'Voice Input'}
                >
                  {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  disabled={!input.trim() || isLoading}
                  onClick={() => handleSendMessage()}
                  className="w-7 h-7 rounded-lg bg-[#2563eb] disabled:bg-[#1e2430] text-white disabled:text-[#677184] flex items-center justify-center transition-colors shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
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
          inputRef.current?.focus();
        }}
      />
    </div>
  );
}
