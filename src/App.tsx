/**
 * LifePilot AI - Modern SaaS Dashboard
 * Dark theme with glassmorphism, animations, and neural visualization
 */

import React from 'react';
import ChatInterface from './components/ChatInterface';

export default function App() {
  return (
    <div className="min-h-screen font-['Space_Grotesk'] selection:bg-cyan-600/30 selection:text-white overflow-x-hidden">
      <ChatInterface />
    </div>
  );
}
