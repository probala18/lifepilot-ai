import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface AgentCardProps {
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  gradient: string;
  examples: string[];
  color: string;
  onClick: (id: string) => void;
}

export default function AgentCard({
  id,
  icon: Icon,
  label,
  description,
  gradient,
  examples,
  color,
  onClick,
}: AgentCardProps) {
  const [hoveredExample, setHoveredExample] = useState<number | null>(null);

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -8 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(id)}
      className="relative group text-left rounded-2xl overflow-hidden"
    >
      {/* Gradient Border Background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} blur-lg`} />
      </div>

      {/* Main Card */}
      <div className="relative rounded-2xl glass border border-slate-700/50 p-8 mb:p-6 group-hover:border-slate-600 transition-colors h-full">
        {/* Background gradient accent */}
        <motion.div
          className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-0 blur-3xl group-hover:opacity-20 transition-opacity duration-300`}
        />

        {/* Icon Container */}
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">{description}</p>

          {/* Examples */}
          <div className="space-y-2 mb-6">
            {examples.slice(0, 2).map((example, idx) => (
              <motion.div
                key={idx}
                animate={{ opacity: hoveredExample === idx ? 1 : 0.6 }}
                onMouseEnter={() => setHoveredExample(idx)}
                onMouseLeave={() => setHoveredExample(null)}
                className="group/example flex items-start gap-2 cursor-default"
              >
                <span className="text-xs font-bold text-cyan-400 mt-1">•</span>
                <span className="text-xs text-slate-300 group-hover/example:text-white transition-colors">
                  {example}
                </span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <span className="text-xs uppercase tracking-wider text-slate-500 group-hover:text-cyan-400 transition-colors">
              Try Now
            </span>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
