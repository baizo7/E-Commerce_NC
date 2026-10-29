import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, MessageCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { assistantService } from '../../services/assistantService';
import { ChatMessageItem, ChatMessageData } from './ChatMessageItem';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SESSION_STORAGE_KEY = 'modern_shop_assistant_session';

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or restore session token
  useEffect(() => {
    let token = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!token) {
      token = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem(SESSION_STORAGE_KEY, token);
    }
    setSessionToken(token);
  }, []);

  // Load chat history when session is initialized and drawer opens
  useEffect(() => {
    if (isOpen && sessionToken && messages.length === 0) {
      const loadHistory = async () => {
        try {
          const history = await assistantService.getHistory(sessionToken);
          if (history && history.length > 0) {
            setMessages(
              history.map((h) => ({
                id: h.id,
                sender: h.sender,
                content: h.content,
                intent: h.intent,
                suggested_products: h.suggested_products,
                created_at: h.created_at
              }))
            );
          }
        } catch {
          // Silent fallback on history fetch error
        }
      };
      loadHistory();
    }
  }, [isOpen, sessionToken]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    setError(null);
    const userMsgId = 'user_' + Date.now();
    const newUserMsg: ChatMessageData = {
      id: userMsgId,
      sender: 'USER',
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await assistantService.sendMessage(text, sessionToken);

      // Save token if updated
      if (res.session_token && res.session_token !== sessionToken) {
        setSessionToken(res.session_token);
        localStorage.setItem(SESSION_STORAGE_KEY, res.session_token);
      }

      const botMsg: ChatMessageData = {
        id: 'bot_' + Date.now(),
        sender: 'ASSISTANT',
        content: res.message,
        intent: res.intent,
        suggested_products: res.suggested_products,
        price_analysis: res.price_analysis,
        follow_up_suggestions: res.follow_up_suggestions,
        created_at: new Date().toISOString()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Unable to connect to shopping assistant. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear conversation history?')) {
      try {
        if (sessionToken) {
          await assistantService.clearHistory(sessionToken);
        }
      } catch {
        // Ignore error
      } finally {
        setMessages([]);
        const newToken = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        setSessionToken(newToken);
        localStorage.setItem(SESSION_STORAGE_KEY, newToken);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[460px] sm:h-[640px] z-50 flex flex-col bg-slate-50 sm:rounded-2xl shadow-2xl border border-slate-300/80 overflow-hidden font-sans">
      {/* Humanized Concierge Header */}
      <div className="bg-white text-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
              <MessageCircle className="w-4 h-4 fill-amber-500/20 text-amber-700" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm text-slate-900 leading-none">Shopping Assistant</h3>
              <span className="px-1.5 py-0.5 text-[9.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">Online</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Here to help you find & compare items</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50 to-slate-100/60">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            onProductClick={onClose}
          />
        ))}

        {loading && (
          <div className="flex items-start gap-2.5 my-3">
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-xs flex items-center gap-2 text-xs text-slate-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Looking up products for you...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Type Bar Only */}
      <div className="p-3 bg-white border-t border-slate-200 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || loading}
            className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0 shadow-xs"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
