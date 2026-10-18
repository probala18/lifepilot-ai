import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarCheck,
  ShoppingCart,
  Activity,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: 'assistant' | 'shopping' | 'health';
  data?: any;
  reasoning?: string;
  timestamp?: string;
}

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleCopy = () => {
    let textToCopy = message.content;
    if (message.data) {
      textToCopy += '\n\n' + JSON.stringify(message.data, null, 2);
    }
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const agentMeta = {
    assistant: {
      label: 'Personal Assistant',
      icon: CalendarCheck,
      badgeBg: 'bg-[var(--agent-assistant-bg)]',
      badgeText: 'text-[var(--agent-assistant-text)]',
      borderAccent: 'border-blue-500/30',
    },
    shopping: {
      label: 'Shopping Decision',
      icon: ShoppingCart,
      badgeBg: 'bg-[var(--agent-shopping-bg)]',
      badgeText: 'text-[var(--agent-shopping-text)]',
      borderAccent: 'border-amber-500/30',
    },
    health: {
      label: 'Health & Symptoms',
      icon: Activity,
      badgeBg: 'bg-[var(--agent-health-bg)]',
      badgeText: 'text-[var(--agent-health-text)]',
      borderAccent: 'border-emerald-500/30',
    },
  };

  const meta = message.type ? agentMeta[message.type] : agentMeta.assistant;
  const AgentIcon = meta.icon;

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end mb-4"
      >
        <div className="max-w-xl rounded-xl bg-[var(--accent)] text-white px-4 py-3 text-sm leading-relaxed shadow-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start mb-6 w-full"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 shadow-sm text-sm transition-colors">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-md ${meta.badgeBg} ${meta.badgeText} transition-colors`}>
              <AgentIcon className="w-4 h-4" />
            </div>
            <span className="font-medium text-xs text-[var(--text-main)] transition-colors">{meta.label}</span>
          </div>

          <div className="flex items-center gap-2">
            {message.reasoning && (
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-main)] px-2 py-1 rounded bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-subtle)] transition-colors"
                title="View Agent Reasoning Chain"
              >
                <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                <span>Reasoning</span>
                {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            <button
              onClick={handleCopy}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Reasoning Block */}
        <AnimatePresence>
          {showReasoning && message.reasoning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="p-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed transition-colors">
                <div className="flex items-center gap-1.5 font-semibold text-[var(--text-main)] mb-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                  Agent Execution Log
                </div>
                {message.reasoning}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {message.content && (
          <p className="text-[var(--text-main)] leading-relaxed whitespace-pre-wrap transition-colors">{message.content}</p>
        )}

        {/* Structured Data Cards */}
        {message.data && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3">
            {message.type === 'assistant' && (
              <div className="p-3.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-2.5 transition-colors">
                {message.data.task && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-20 font-medium">Task:</span>
                    <span className="text-xs text-[var(--text-main)] font-medium">{message.data.task}</span>
                  </div>
                )}
                {message.data.time && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-20 font-medium">Time / Due:</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-mono">{message.data.time}</span>
                  </div>
                )}
                {message.data.suggestedAction && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-20 font-medium">Action:</span>
                    <span className="text-xs text-[var(--text-secondary)]">{message.data.suggestedAction}</span>
                  </div>
                )}
                {message.data.reminderScheduled && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Automated reminder queued in SQLite & Cron
                  </div>
                )}
              </div>
            )}

            {message.type === 'shopping' && (
              <div className="p-3.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-2.5 transition-colors">
                {message.data.recommendation && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-24 font-medium">Top Pick:</span>
                    <span className="text-xs text-[var(--text-main)] font-semibold text-amber-600 dark:text-amber-300">
                      {message.data.recommendation}
                    </span>
                  </div>
                )}
                {message.data.reason && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-24 font-medium">Rationale:</span>
                    <span className="text-xs text-[var(--text-secondary)]">{message.data.reason}</span>
                  </div>
                )}
                {message.data.betterAlternative && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-24 font-medium">Alternative:</span>
                    <span className="text-xs text-[var(--text-muted)]">{message.data.betterAlternative}</span>
                  </div>
                )}
              </div>
            )}

            {message.type === 'health' && (
              <div className="p-3.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-2.5 transition-colors">
                {message.data.possibleCondition && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-24 font-medium">Assessment:</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold">
                      {message.data.possibleCondition}
                    </span>
                  </div>
                )}
                {message.data.advice && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-24 font-medium">Self-Care:</span>
                    <span className="text-xs text-[var(--text-secondary)]">{message.data.advice}</span>
                  </div>
                )}
                {message.data.whenToConsultDoctor && (
                  <div className="flex items-start gap-2.5">
                    <span className="text-xs text-[var(--text-muted)] min-w-24 font-medium">When to Consult:</span>
                    <span className="text-xs text-[var(--text-secondary)]">{message.data.whenToConsultDoctor}</span>
                  </div>
                )}
                {message.data.disclaimer && (
                  <div className="mt-2.5 p-2.5 rounded bg-[var(--agent-shopping-bg)] border border-[var(--agent-shopping-border)] flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{message.data.disclaimer}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 pt-3 mt-2 text-xs text-[var(--text-muted)]">
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
            />
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
            />
            <span className="ml-1 font-mono text-xs text-[var(--text-muted)]">Executing multi-agent pipeline...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(ChatMessage);
