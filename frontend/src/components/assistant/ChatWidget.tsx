import React, { useState } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import { ChatDrawer } from './ChatDrawer';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <aside
        aria-label="Modern Shop AI Assistant Trigger"
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all duration-300 ${
            isOpen
              ? 'bg-slate-800 text-white hover:bg-slate-900 ring-2 ring-slate-400'
              : 'bg-[#0a0500] hover:bg-slate-950 text-[#ffcd05] ring-2 ring-amber-400/50 hover:ring-amber-400 hover:scale-105'
          }`}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Shopping Assistant'}
        >
          {isOpen ? (
            <>
              <X className="w-5 h-5 text-white" />
              <span className="text-xs font-bold text-white tracking-wide">Close</span>
            </>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#ffcd05] group-hover:rotate-12 transition-transform duration-200" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0500] animate-pulse" />
              </div>
              <span className="text-xs font-black tracking-wide text-white flex items-center gap-1">
                AI Assistant
                <Sparkles className="w-3.5 h-3.5 text-[#ffcd05] fill-[#ffcd05]" />
              </span>
            </>
          )}
        </button>
      </aside>

      {/* Assistant Drawer / Modal */}
      <ChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
