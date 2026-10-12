import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  BookOpen,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  Minimize2
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggestedFollowUps?: string[];
  policyReference?: string;
  timestamp: string;
}

const FAQ_SUGGESTIONS = [
  'What is the Dream Offer policy for offers >= 8 LPA?',
  'What are the dress code & entry rules on drive day?',
  'Can I register for drives if I have 1 active backlog?',
  'How do I unlock remedial training clinics with Rooman?'
];

export const CampusHelpdeskChatbot: React.FC = () => {
  const { user, role } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello ${user?.name || 'there'}! I am your 24/7 Placement Policy & Operations Copilot. You can ask me about drive eligibility criteria, dress code, dream offer rules, interview schedules, or Rooman remedial clinics.`,
      suggestedFollowUps: FAQ_SUGGESTIONS.slice(0, 3),
      policyReference: 'Rooman University Placement Bylaws §4.2',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyContext = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await api.ai.campusHelpdesk({
        userMessage: text,
        chatHistory: historyContext,
        studentContext: {
          name: user?.name || 'Student Candidate',
          role: role || 'Student',
          email: user?.email || 'student@campus.edu'
        }
      });

      if (res?.response) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: res.response.reply,
          suggestedFollowUps: res.response.suggestedFollowUps,
          policyReference: res.response.policyReference,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error('Malformed AI response from server');
      }
    } catch (err: any) {
      console.error('Campus Helpdesk AI Error:', err);
      setErrorMessage(err.message || 'HTTP 500: Failed to fetch answer from Gemini');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 group"
          aria-label="Open 24/7 AI Placement Helpdesk"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
          </div>
          <span className="text-xs font-semibold tracking-wide">24/7 Placement AI Helpdesk</span>
          <Sparkles className="w-4 h-4 text-amber-300 opacity-90 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 sm:w-[420px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-bold tracking-tight">CAMPUSLINK Helpdesk</h3>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Live Gemini AI
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center space-x-1">
                  <span>Rooman Placement Bylaws & Support</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Minimize Helpdesk"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-900 p-2.5 px-3 flex items-start space-x-2 text-xs text-rose-700 dark:text-rose-300 shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Gemini Error: </span>
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 text-[11px] font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Policy Reference badge */}
                  {msg.policyReference && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      <BookOpen className="w-3 h-3 shrink-0" />
                      <span>{msg.policyReference}</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Follow-up question chips */}
                {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                  <div className="mt-2 space-y-1.5 w-full max-w-[85%]">
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center space-x-1">
                      <HelpCircle className="w-3 h-3 text-indigo-500" />
                      <span>Suggested Questions:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedFollowUps.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(suggestion)}
                          disabled={isLoading}
                          className="text-[11px] text-left bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-2 text-xs text-slate-500">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl rounded-bl-none text-xs text-slate-600 dark:text-slate-300">
                  <span className="animate-pulse">Consulting placement policy guidelines...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick FAQ Bar */}
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap scrollbar-none">
            <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">FAQ:</span>
            {FAQ_SUGGESTIONS.map((faq, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(faq)}
                disabled={isLoading}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
              >
                {faq.split('?')[0]}?
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about placement policy, rules, dress code..."
                disabled={isLoading}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow transition-colors shrink-0"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
