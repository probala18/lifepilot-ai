import React, { useState, useEffect } from 'react';
import { Send, Bot, ShoppingCart, Stethoscope, CalendarCheck, Info, Sparkles, ArrowRight, Play } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';

type FeatureType = 'assistant' | 'shopping' | 'health';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: FeatureType;
  data?: any;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeFeature, setActiveFeature] = useState<FeatureType>('assistant');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const features = [
    { id: 'assistant', label: 'Personal Assistant', icon: CalendarCheck, color: '#60A5FA', gradient: 'from-blue-500 to-blue-600' },
    { id: 'shopping', label: 'Shopping Decision', icon: ShoppingCart, color: '#F59E0B', gradient: 'from-amber-500 to-amber-600' },
    { id: 'health', label: 'Symptom Analyzer', icon: Stethoscope, color: '#34D399', gradient: 'from-emerald-500 to-emerald-600' },
  ] as const;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [mouseX, mouseY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setShowChat(true);

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, type: activeFeature };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/${activeFeature}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to fetch response');
      }
      const data = await response.json();
      if (!data || typeof data !== 'object') throw new Error('Invalid response format');
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: '', type: activeFeature, data }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: `Error: ${errorMessage}. Please check your API key and try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureSwitch = (featureId: FeatureType) => {
    setActiveFeature(featureId);
    setMessages([]);
    setInput('');
  };

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

      {/* ── Cursor-following glow ── */}
      <motion.div
        className="pointer-events-none fixed w-[600px] h-[600px] rounded-full"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          background: 'radial-gradient(circle, rgba(148,163,184,0.08) 0%, rgba(148,163,184,0.03) 40%, transparent 70%)',
        }}
      />
      <motion.div
        className="pointer-events-none fixed w-[300px] h-[300px] rounded-full"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: '-50%',
          translateY: '-50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 60%)',
        }}
      />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Ambient blobs */}
      <motion.div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-slate-600/[0.07] blur-[120px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full bg-blue-600/[0.05] blur-[120px]"
        animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }} />
      <motion.div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-slate-500/[0.05] blur-[100px]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 5 }} />

      {/* Floating dots */}
      {[...Array(6)].map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 bg-slate-400 rounded-full"
          style={{ left: `${12 + i * 14}%`, top: `${18 + (i * 37) % 60}%` }}
          animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 1.2 }} />
      ))}

      {/* ── Main layout ── */}
      <div className="relative z-10 flex flex-col h-screen">

        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-[#0a0a1a]/70 border-b border-white/[0.06] px-6 sm:px-8 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3 cursor-pointer"
              onClick={() => { setShowChat(false); setMessages([]); }}>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">LifePilot <span className="text-blue-400">AI</span></h1>
            </motion.div>
            {showChat && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => { setShowChat(false); setMessages([]); }}
                className="text-sm text-gray-400 hover:text-white transition-colors">
                Back to Home
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {!showChat ? (
              <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto">

                {/* ── Hero ── */}
                <section className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6">
                  <div className="text-center max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.1] text-gray-300 text-sm font-medium mb-8">
                      <Sparkles className="w-4 h-4" /> Agentic Personal Life Assistant
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="text-5xl sm:text-7xl font-bold mb-6 text-white leading-tight">
                      Your Life, <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-slate-300">
                        Simplified by AI
                      </span>
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="text-lg sm:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                      Manage tasks, make smarter purchases, and understand health symptoms — all through natural conversation with three specialized AI agents.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                      className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowChat(true)}
                        className="px-8 py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                        Start Chatting <ArrowRight className="w-4 h-4 inline ml-2" />
                      </motion.button>
                      <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} href="#demo"
                        className="px-8 py-4 rounded-xl font-semibold text-gray-300 border border-white/[0.12] hover:bg-white/[0.05] transition-all flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" /> Watch Demo
                      </motion.a>
                    </motion.div>
                  </div>
                </section>

                {/* ── Features ── */}
                <section className="py-24 px-4 sm:px-6">
                  <div className="max-w-6xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                      <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                        Three AI Agents, <span className="text-blue-400">One App</span>
                      </h2>
                      <p className="text-gray-400 text-lg max-w-xl mx-auto">Chat naturally. Get structured, actionable insights instantly.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                      {features.map((f, i) => {
                        const Icon = f.icon;
                        const descs: Record<string, string> = {
                          assistant: 'Extract tasks, deadlines, and smart actions from natural language. Say "Schedule meeting tomorrow at 10 AM" and get structured plans.',
                          shopping: 'Get unbiased product analysis with price, reviews, and alternatives. Ask "Should I buy iPhone 14?" for a smart breakdown.',
                          health: 'Describe symptoms like "Headache and fever" to get possible conditions and advice. Not a substitute for medical consultation.',
                        };
                        return (
                          <motion.div key={f.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }} whileHover={{ y: -8 }}
                            onClick={() => { handleFeatureSwitch(f.id as FeatureType); setShowChat(true); }}
                            className="group cursor-pointer p-8 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/25 hover:bg-white/[0.05] transition-all duration-300">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{f.label}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{descs[f.id]}</p>
                            <div className="mt-6 flex items-center gap-2 text-sm font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              Try it now <ArrowRight className="w-4 h-4" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </section>

                {/* ── Demo Video ── */}
                <section id="demo" className="py-24 px-4 sm:px-6">
                  <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
                      <h2 className="text-4xl font-bold text-white mb-4">See It In Action</h2>
                      <p className="text-gray-400 text-lg">Watch how LifePilot AI handles tasks, shopping, and health queries.</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                      className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
                      <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-[#0f0f1a] to-[#0a0a12]">
                        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} className="text-center">
                          <div className="w-20 h-20 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mx-auto mb-4">
                            <Play className="w-8 h-8 text-gray-300 ml-1" />
                          </div>
                          <p className="text-gray-400 text-sm">Demo video coming soon</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </section>

                {/* ── How It Works ── */}
                <section className="py-24 px-4 sm:px-6">
                  <div className="max-w-3xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                      <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
                      <p className="text-gray-400 text-lg">Three steps. That's it.</p>
                    </motion.div>
                    <div className="space-y-6">
                      {[
                        { n: '01', title: 'Pick a Feature', desc: 'Choose Personal Assistant, Shopping Advisor, or Health Analyzer.' },
                        { n: '02', title: 'Ask Anything', desc: 'Chat in plain English — no commands, no syntax needed.' },
                        { n: '03', title: 'Get Results', desc: 'Receive structured, actionable responses powered by Gemini AI.' },
                      ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-6 items-start p-6 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.1] transition-all">
                          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600">{s.n}</span>
                          <div>
                            <h3 className="text-lg font-bold text-white mb-1">{s.title}</h3>
                            <p className="text-gray-400 text-sm">{s.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* ── Tech Stack ── */}
                <section className="py-24 px-4 sm:px-6">
                  <div className="max-w-4xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
                      <h2 className="text-4xl font-bold text-white mb-4">Built With Modern Tech</h2>
                    </motion.div>
                    <div className="grid md:grid-cols-3 gap-6">
                      {[
                        { title: 'Frontend', items: ['React 19', 'TypeScript', 'Tailwind CSS', 'Framer Motion'] },
                        { title: 'Backend', items: ['Node.js', 'Express.js', 'TypeScript', 'Better SQLite3'] },
                        { title: 'AI & Cloud', items: ['Google Gemini API', 'AWS Ready', 'Bedrock Compatible', 'RESTful APIs'] },
                      ].map((sec, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                          <h3 className="text-lg font-bold text-white mb-4">{sec.title}</h3>
                          <ul className="space-y-2">
                            {sec.items.map((item, j) => (
                              <li key={j} className="text-gray-400 text-sm flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> {item}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      className="mt-8 p-5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-center">
                      <p className="text-gray-300 text-sm">
                        <span className="font-semibold text-blue-300">Hackathon ready</span> — swap Google Gemini with Amazon Bedrock Nova for enterprise deployment.
                      </p>
                    </motion.div>
                  </div>
                </section>

                {/* ── CTA ── */}
                <section className="py-24 px-4 sm:px-6">
                  <div className="max-w-2xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                      <h2 className="text-4xl font-bold text-white mb-4">Ready to Try?</h2>
                      <p className="text-gray-400 text-lg mb-8">Start a conversation and see what LifePilot AI can do.</p>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowChat(true)}
                        className="px-10 py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 text-lg">
                        Start Using LifePilot AI
                      </motion.button>
                    </motion.div>
                  </div>
                </section>

                <footer className="py-8 px-4 border-t border-white/[0.04]">
                  <p className="text-center text-gray-500 text-sm">LifePilot AI — Agentic Personal Life Assistant</p>
                </footer>
              </motion.div>

            ) : (
              /* ── Chat View ── */
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 space-y-6">
                  <AnimatePresence initial={false}>
                    {messages.length === 0 && !isLoading && (
                      <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center space-y-6">
                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                          <Bot className="w-14 h-14 text-gray-500 mx-auto" />
                        </motion.div>
                        <div>
                          <p className="text-2xl font-semibold text-white mb-2">{features.find(f => f.id === activeFeature)?.label}</p>
                          <p className="text-gray-400">Type a message or pick an example below.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 max-w-md mt-4">
                          {activeFeature === 'assistant' && <>
                            <Chip text="Schedule meeting tomorrow" onClick={setInput} />
                            <Chip text="Remind me at 6 PM" onClick={setInput} />
                          </>}
                          {activeFeature === 'shopping' && <>
                            <Chip text="Should I buy iPhone 14?" onClick={setInput} />
                            <Chip text="Is MacBook M2 worth it?" onClick={setInput} />
                          </>}
                          {activeFeature === 'health' && <>
                            <Chip text="Headache and fever" onClick={setInput} />
                            <Chip text="Stomach pain and nausea" onClick={setInput} />
                          </>}
                        </div>
                      </motion.div>
                    )}

                    {messages.map((msg) => (
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

                {/* Input */}
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
                        placeholder={`Ask ${features.find(f => f.id === activeFeature)?.label}...`}
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
    </div>
  );
}

function Chip({ text, onClick }: { text: string; onClick: (t: string) => void }) {
  return (
    <motion.button onClick={() => onClick(text)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
      className="text-xs bg-white/[0.04] border border-white/[0.08] text-gray-300 px-4 py-2 rounded-full hover:bg-white/[0.08] hover:border-white/[0.15] transition-all">
      {text}
    </motion.button>
  );
}
