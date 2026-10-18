import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface AgentCardProps {
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
      className={`rounded-xl p-5 border text-left transition-colors flex flex-col justify-between ${
        isActive
          ? 'bg-[#161b24] border-blue-500/50 shadow-sm'
          : 'bg-[#10141a] border-[#1e2430] hover:border-[#2c3547] hover:bg-[#131720]'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isActive ? 'bg-blue-600 text-white' : 'bg-[#1a202c] text-[#9aa2b2]'
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>

          <button
            onClick={() => onClick(id)}
            className="flex items-center gap-1 text-xs text-[#9aa2b2] hover:text-[#f3f5f8] transition-colors"
          >
            <span>Activate</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-[#f3f5f8] mb-1.5">{label}</h3>
        <p className="text-xs text-[#9aa2b2] leading-relaxed mb-4">{description}</p>
      </div>

      <div className="space-y-1.5 pt-3 border-t border-[#1e2430]">
        <div className="text-[11px] font-medium text-[#677184] uppercase tracking-wider mb-1">
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
            className="w-full text-left text-xs text-[#cbd5e1] hover:text-blue-400 p-1.5 rounded hover:bg-[#1c222e] transition-colors truncate block"
          >
            &rarr; {example}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
