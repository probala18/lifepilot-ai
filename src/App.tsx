/**
 * LifePilot AI - Autonomous Multi-Agent Personal Intelligence
 * Slate minimal design system, Framer Motion, zero gradients
 */

import React from 'react';
import ChatInterface from './components/ChatInterface';

export default function App() {
  return (
    <div className="min-h-screen font-sans selection:bg-blue-600/30 selection:text-white overflow-x-hidden">
      <ChatInterface />
    </div>
  );
}
