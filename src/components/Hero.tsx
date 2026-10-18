import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, ShoppingBag, HeartPulse, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  user?: any;
  onStartClick: () => void;
  onSelectAgent?: (agent: 'assistant' | 'shopping' | 'health') => void;
}

export default function Hero({ onStartClick, onSelectAgent }: HeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <section className="relative px-4 sm:px-8 pt-12 pb-16 max-w-6xl mx-auto">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center"
      >
        {/* Status indicator */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] mb-6 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Local SQLite & Cron Engine Active</span>
        </motion.div>

        {/* 2-line confident headline per taste-skill */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[var(--text-main)] max-w-3xl leading-[1.1] mb-5 transition-colors"
        >
          Autonomous personal intelligence, grounded in real tasks.
        </motion.h1>

        {/* Supporting statement */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-8 transition-colors"
        >
          LifePilot coordinates scheduling with automated email reminders, cross-examines purchase decisions, and provides structured health symptom triage in one unified interface.
        </motion.p>

        {/* Action Button */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 mb-14">
          <button
            onClick={onStartClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium text-sm transition-all shadow-sm"
          >
            <span>Launch Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Tri-Agent Architecture Showcase */}
        <motion.div
          variants={itemVariants}
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 text-left"
        >
          <div
            onClick={() => onSelectAgent?.('assistant')}
            className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-[var(--agent-assistant-bg)] text-[var(--agent-assistant-text)] flex items-center justify-center mb-3">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-main)] mb-1">Personal Assistant</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                Natural language task extraction, automatic SQLite database persistence, and scheduled email dispatch.
              </p>
            </div>
            <div className="text-[11px] text-[var(--agent-assistant-text)] font-medium flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full SQLite persistence & cron reminders</span>
            </div>
          </div>

          <div
            onClick={() => onSelectAgent?.('shopping')}
            className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-[var(--agent-shopping-bg)] text-[var(--agent-shopping-text)] flex items-center justify-center mb-3">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-main)] mb-1">Shopping Decision Engine</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                Rigorous value analysis, specification comparison, and proactive alternative recommendations.
              </p>
            </div>
            <div className="text-[11px] text-[var(--agent-shopping-text)] font-medium flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Unbiased trade-off analysis</span>
            </div>
          </div>

          <div
            onClick={() => onSelectAgent?.('health')}
            className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-[var(--agent-health-bg)] text-[var(--agent-health-text)] flex items-center justify-center mb-3">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-main)] mb-1">Symptom Analyzer</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                Clinical symptom intake, red-flag escalation guidance, and self-care recommendations with medical disclaimers.
              </p>
            </div>
            <div className="text-[11px] text-[var(--agent-health-text)] font-medium flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Triage protocols & emergency flags</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
