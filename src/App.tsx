/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import ChatInterface from './components/ChatInterface';

export default function App() {
  return (
    <div className="bg-[#0a0a1a] text-gray-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
      <ChatInterface />
    </div>
  );
}
