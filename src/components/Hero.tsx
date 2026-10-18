import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, ShoppingBag, HeartPulse, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  user: any;
  onStartClick: () => void;
  onSelectAgent?: (agent: 'assistant' | 'shopping' | 'health') => void;
}

export default function Hero({ user, onStartClick, onSelectAgent }: HeroProps) {
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
        {/* Status indicator - solid and subtle */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#161b24] border border-[#232836] text-xs text-[#9aa2b2] mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Local SQLite & Cron Engine Active</span>
        </motion.div>

        {/* 2-line confident headline per taste-skill */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#f3f5f8] max-w-3xl leading-[1.1] mb-5"
        >
          Autonomous personal intelligence, grounded in real tasks.
        </motion.h1>

        {/* Supporting statement */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg text-[#9aa2b2] max-w-2xl leading-relaxed mb-8"
        >
          LifePilot coordinates scheduling with automated email reminders, cross-examines purchase decisions, and provides structured health symptom triage in one unified interface.
        </motion.p>

        {/* Action Button */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-3 mb-14">
          <button
            onClick={onStartClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium text-sm transition-all shadow-sm"
          >
            <span>Launch Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Tri-Agent Architecture Showcase - Pure Flat Surfaces */}
        <motion.div
          variants={itemVariants}
          className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 text-left"
        >
          <div
            onClick={() => onSelectAgent?.('assistant')}
            className="p-5 rounded-xl bg-[#10141a] border border-[#1e2430] hover:border-[#2c3547] hover:bg-[#141922] transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-[#1e293b] text-blue-400 flex items-center justify-center mb-3">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#f3f5f8] mb-1">Personal Assistant</h3>
              <p className="text-xs text-[#9aa2b2] leading-relaxed mb-3">
                Natural language task extraction, automatic SQLite database persistence, and scheduled email dispatch.
              </p>
            </div>
            <div className="text-[11px] text-blue-400 font-medium flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full SQLite persistence & cron reminders</span>
            </div>
          </div>

          <div
            onClick={() => onSelectAgent?.('shopping')}
            className="p-5 rounded-xl bg-[#10141a] border border-[#1e2430] hover:border-[#2c3547] hover:bg-[#141922] transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-[#292524] text-amber-400 flex items-center justify-center mb-3">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#f3f5f8] mb-1">Shopping Decision Engine</h3>
              <p className="text-xs text-[#9aa2b2] leading-relaxed mb-3">
                Rigorous value analysis, specification comparison, and proactive alternative recommendations.
              </p>
            </div>
            <div className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Unbiased trade-off analysis</span>
            </div>
          </div>

          <div
            onClick={() => onSelectAgent?.('health')}
            className="p-5 rounded-xl bg-[#10141a] border border-[#1e2430] hover:border-[#2c3547] hover:bg-[#141922] transition-colors cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-8 h-8 rounded-md bg-[#14291f] text-emerald-400 flex items-center justify-center mb-3">
                <HeartPulse className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-[#f3f5f8] mb-1">Symptom Analyzer</h3>
              <p className="text-xs text-[#9aa2b2] leading-relaxed mb-3">
                Clinical symptom intake, red-flag escalation guidance, and self-care recommendations with medical disclaimers.
              </p>
            </div>
            <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Triage protocols & emergency flags</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
