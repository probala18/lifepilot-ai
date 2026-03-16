import React from 'react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: 'assistant' | 'shopping' | 'health';
  data?: any;
}

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading }) => {
  const isUser = message.role === 'user';

  const agentColors = {
    assistant: {
      text: 'text-cyan-400',
      bg: 'from-cyan-500/10 to-blue-500/10',
      border: 'border-cyan-500/20',
    },
    shopping: {
      text: 'text-orange-400',
      bg: 'from-orange-500/10 to-red-500/10',
      border: 'border-orange-500/20',
    },
    health: {
      text: 'text-green-400',
      bg: 'from-green-500/10 to-emerald-500/10',
      border: 'border-green-500/20',
    },
  };

  const agentColor = message.type ? agentColors[message.type] : agentColors.assistant;

  const Field = ({
    label,
    value,
    color,
    delay = 0,
  }: {
    label: string;
    value: string;
    color: string;
    delay?: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-start gap-3"
    >
      <span className={`font-semibold ${color} min-w-24 text-sm`}>{label}</span>
      <span className="text-slate-300">{value}</span>
    </motion.div>
  );

  const renderData = () => {
    if (!message.data) return null;

    switch (message.type) {
      case 'assistant':
        return (
          <div className="space-y-3">
            <Field
              label="Task:"
              value={message.data.task}
              color="text-cyan-400"
            />
            <Field
              label="Time:"
              value={message.data.time}
              color="text-cyan-400"
              delay={0.1}
            />
            <Field
              label="Action:"
              value={message.data.suggestedAction}
              color="text-cyan-400"
              delay={0.2}
            />
            {message.data.reminderScheduled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Reminder scheduled
              </motion.div>
            )}
          </div>
        );

      case 'shopping':
        return (
          <div className="space-y-3">
            <Field
              label="Recommendation:"
              value={message.data.recommendation}
              color="text-orange-400"
            />
            <Field
              label="Reason:"
              value={message.data.reason}
              color="text-orange-400"
              delay={0.1}
            />
            <Field
              label="Alternative:"
              value={message.data.betterAlternative}
              color="text-orange-400"
              delay={0.2}
            />
          </div>
        );

      case 'health':
        return (
          <div className="space-y-3">
            <Field
              label="Condition:"
              value={message.data.possibleCondition}
              color="text-green-400"
            />
            <Field
              label="Advice:"
              value={message.data.advice}
              color="text-green-400"
              delay={0.1}
            />
            <Field
              label="Consult:"
              value={message.data.whenToConsultDoctor}
              color="text-green-400"
              delay={0.2}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-start gap-2 text-orange-400 text-xs"
            >
              <span className="mt-0.5">⚠️</span>
              <p>{message.data.disclaimer}</p>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-xs sm:max-w-md rounded-2xl rounded-br-sm bg-gradient-to-r from-sky-600 to-cyan-600 p-4 text-white shadow-[0_8px_24px_rgba(14,165,233,0.3)]">
          <p className="text-sm">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="max-w-xl rounded-2xl rounded-bl-sm glass border border-slate-700/50 p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-700/50">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${agentColor.bg}`} />
          <span className={`text-xs font-semibold uppercase tracking-wider ${agentColor.text}`}>
            {message.type === 'assistant'
              ? 'Personal Assistant'
              : message.type === 'shopping'
                ? 'Shopping Decision'
                : message.type === 'health'
                  ? 'Symptom Analyzer'
                  : 'LifePilot'}
          </span>
          {isLoading && (
            <motion.span
              animate={{ opacity: [0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-xs text-slate-500 ml-auto"
            >
              thinking...
            </motion.span>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3">
          {message.content && <p className="text-slate-300 text-sm leading-relaxed">{message.content}</p>}

          {message.data && (
            <div className={`mt-4 pt-4 border-t border-slate-700/50 ${agentColor.bg}`}>
              {renderData()}
            </div>
          )}

          {isLoading && (
            <div className="flex gap-1 pt-2">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-cyan-400"
              />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
                className="w-2 h-2 rounded-full bg-sky-400"
              />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 rounded-full bg-cyan-400"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
