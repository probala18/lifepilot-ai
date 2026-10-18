import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface AgentCardProps {
  key?: React.Key;
  id: string;
  icon: LucideIcon;
  label: string;
  description: string;
  examples: string[];
  isActive?: boolean;
  onClick: (id: string) => void;
  onSelectPrompt?: (prompt: string) => void;
}

export default function AgentCard({
  id,
  icon: Icon,
  label,
  description,
  examples,
  isActive = false,
  onClick,
  onSelectPrompt,
}: AgentCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className={`rounded-xl p-5 border text-left transition-all flex flex-col justify-between shadow-sm ${
        isActive
          ? 'bg-[var(--bg-surface-elevated)] border-blue-500/50'
          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>

          <button
            onClick={() => onClick(id)}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <span>Activate</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-[var(--text-main)] mb-1.5 transition-colors">
          {label}
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4 transition-colors">
          {description}
        </p>
      </div>

      <div className="space-y-1.5 pt-3 border-t border-[var(--border-subtle)] transition-colors">
        <div className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
          Quick Prompts
        </div>
        {examples.slice(0, 2).map((example, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectPrompt) onSelectPrompt(example);
              else onClick(id);
            }}
            className="w-full text-left text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] p-1.5 rounded hover:bg-[var(--bg-subtle)] transition-colors truncate block"
          >
            &rarr; {example}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
