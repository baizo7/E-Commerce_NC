import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatDrawer } from './ChatDrawer';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Humanized Floating Action Button */}
      <aside
        aria-label="Shopping Assistant Concierge"
        className="fixed bottom-6 right-6 z-40"
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border ${
            isOpen
              ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90 hover:border-slate-300'
          }`}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close Shopping Assistant' : 'Open Shopping Assistant'}
        >
          {isOpen ? (
            <>
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 group-hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-200 pr-1.5">Close</span>
            </>
          ) : (
            <>
              {/* Friendly Concierge Avatar with Active Indicator */}
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shadow-xs group-hover:bg-amber-100/80 transition-colors">
                  <MessageCircle className="w-4 h-4 fill-amber-500/20 text-amber-700" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>

              {/* Humanized Greeting & Title */}
              <div className="text-left pr-1.5 hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 leading-none">
                    Shopping Assistant
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                </div>
                <span className="text-[10.5px] text-slate-500 font-medium block mt-0.5 leading-tight">
                  How can we help today?
                </span>
              </div>
            </>
          )}
        </button>
      </aside>

      {/* Assistant Drawer / Modal */}
      <ChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
