import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Node {
  id: string;
  label: string;
  position: { x: number; y: number };
  color: string;
}

const nodes: Node[] = [
  {
    id: 'email-agent',
    label: 'Email Agent',
    position: { x: 20, y: 25 },
    color: '#06B6D4',
  },
  {
    id: 'calendar-agent',
    label: 'Calendar Agent',
    position: { x: 80, y: 25 },
    color: '#0EA5E9',
  },
  {
    id: 'decision-agent',
    label: 'Decision Agent',
    position: { x: 20, y: 75 },
    color: '#F59E0B',
  },
  {
    id: 'health-agent',
    label: 'Health Agent',
    position: { x: 80, y: 75 },
    color: '#22C55E',
  },
];

const connections = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [0, 3],
];

export default function NeuraFlow() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 mb-4">
            NeuraFlow Intelligence Network
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Watch how four specialist AI agents collaborate in real-time, forming an intelligent network that powers your decisions.
          </p>
        </motion.div>

        <div className="rounded-2xl glass p-8 overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="w-full aspect-square mb-6"
            style={{ filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.1))' }}
          >
            {/* Center glow */}
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="30%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
              </radialGradient>

              <linearGradient
                id="connectionGradient1"
                x1="20%"
                y1="25%"
                x2="80%"
                y2="25%"
              >
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id="connectionGradient2" x1="20%" y1="25%" x2="20%" y2="75%">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.3" />
              </linearGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Center glow circle */}
            <circle cx="50" cy="50" r="30" fill="url(#centerGlow)" />

            {/* Animated connections */}
            {connections.map((conn, idx) => {
              const [fromIdx, toIdx] = conn;
              const from = nodes[fromIdx];
              const to = nodes[toIdx];

              return (
                <motion.g
                  key={`conn-${idx}`}
                  animate={{
                    opacity: hoveredNode ? (hoveredNode === from.id || hoveredNode === to.id ? 0.6 : 0.15) : 0.3,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.line
                    x1={from.position.x}
                    y1={from.position.y}
                    x2={to.position.x}
                    y2={to.position.y}
                    stroke={from.color}
                    strokeWidth="1.5"
                    filter="url(#glow)"
                  />

                  {/* Animated flowing particles on connection */}
                  <motion.circle
                    cx={from.position.x}
                    cy={from.position.y}
                    r="0.8"
                    fill={from.color}
                    animate={{
                      cx: [from.position.x, to.position.x],
                      cy: [from.position.y, to.position.y],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    opacity="0.6"
                  />
                </motion.g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node, idx) => (
              <motion.g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node pulse ring */}
                <motion.circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r="3.5"
                  fill="none"
                  stroke={node.color}
                  strokeWidth="0.5"
                  animate={{
                    r: [3.5, 6],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />

                {/* Node core */}
                <motion.circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r="2"
                  fill={node.color}
                  animate={{
                    r: hoveredNode === node.id ? 3 : 2.2,
                  }}
                  transition={{ duration: 0.2 }}
                  filter="url(#glow)"
                />

                {/* Node label on hover */}
                <motion.text
                  x={node.position.x}
                  y={node.position.y + 7}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize="2.5"
                  fontWeight="600"
                  animate={{
                    opacity: hoveredNode === node.id ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  pointerEvents="none"
                >
                  {node.label}
                </motion.text>
              </motion.g>
            ))}
          </svg>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                whileHover={{ scale: 1.05 }}
                className="p-3 rounded-lg glass cursor-pointer text-center transition-all"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div className="flex items-center gap-2 justify-center mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: node.color }}
                  />
                  <span className="text-xs font-semibold text-slate-300">
                    {node.label.split(' ')[0]}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {node.label === 'Email Agent'
                    ? 'Manage & process'
                    : node.label === 'Calendar Agent'
                      ? 'Schedule & organize'
                      : node.label === 'Decision Agent'
                        ? 'Analyze & advise'
                        : 'Monitor & alert'}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
