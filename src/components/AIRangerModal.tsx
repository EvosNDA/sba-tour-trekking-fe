import React, { useState, useRef, useEffect } from 'react';
import { Radio, X, Send, Shield, AlertTriangle, Mountain, Bot } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bookingRef?: string;
  tourName?: string;
}

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  time: string;
}

export const AIRangerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  bookingRef = '#TRK-98421-FANSIPAN',
  tourName = 'Fansipan Cloud Ridge & Muong Hoa Valley',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      role: 'assistant',
      text: `Hello Eleanor! I am Giang A Pao, Lead Mountain Guide and Dispatcher at Hoang Lien Son Basecamp. I have your expedition dossier ${bookingRef} on file. We meet tomorrow at 06:30 AM at Tram Ton Gate (1,900m MSL). How can I assist with your packing, trail conditions, or summit route?`,
      time: '06:15 AM',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const quickPrompts = [
    'What should I pack for Fansipan?',
    'What is the weather at Camp II tonight?',
    'Where exactly is Tram Ton Pass Gate?',
    'What is the porter weight policy?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ranger-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-5),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const replyText = data.reply || data.error || 'Basecamp radio acknowledged. Keep emergency channel 147.425 MHz open.';

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      const fallbackResponses = [
        'Ranger A Pao here: Tram Ton Pass basecamp is reporting 14°C, dropping to 4°C above 2,800m. Be sure your warm sleeping bag and waterproof shell jacket are in your dry-bag.',
        'Dispatch Notice: Expedition meeting point is at Tram Ton Gate (1,900m MSL) at 06:30 AM sharp. Ensure your trekking pass QR is ready.',
        'Radio Advisory: Hoang Lien Son park regulations require 1 certified guide per 4 climbers. VHF Emergency channel 147.425 MHz is active.',
      ];
      const randomReply = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FDFBF7] border border-[#E6E1D8] rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1F4E43] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#39675B] flex items-center justify-center text-[#B9EADB] border border-[#B9EADB]/40">
              <Mountain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Giang A Pao & Dispatch</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ONLINE
                </span>
              </div>
              <span className="text-[11px] text-stone-200 block truncate max-w-[260px]">
                {tourName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#9B2F00] hidden sm:flex items-center gap-1">
              <Radio className="w-3 h-3" /> 147.425 MHz · DISPATCH CHAT OFFLINE
            </span>
            <button
              onClick={onClose}
              className="text-stone-300 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Unavailable notice — /api/ranger-chat has no backend */}
        <div className="bg-orange-50 border border-orange-200 p-3 text-[11px] text-orange-950 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            Live ranger dispatch chat is not connected to a backend in this frontend. No AI replies are sent. Contact Hoang Lien Son Basecamp at
            <span className="font-mono font-bold">+84 24 3942 9999</span>.
          </span>
        </div>

        {/* Advisory banner */}
        <div className="bg-[#FAF8F5] border-b border-[#E6E1D8] px-4 py-2 flex items-center justify-between text-xs text-[#78716C]">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#1F4E43]" />
            <span>WFR Certified Alpine Assistant · Hoang Lien Son Dispatch</span>
          </div>
          <span className="font-mono text-[11px] text-[#C2410C]">Gemini 3.8</span>
        </div>

        {/* Chat History */}
        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FDFBF7]">
          {messages.map((m) => {
            const isAsst = m.role === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isAsst ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                    isAsst
                      ? 'bg-white border border-[#E6E1D8] text-[#1C2526] shadow-2xs'
                      : 'bg-[#C2410C] text-white shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
                <span className="text-[10px] text-[#78716C] font-mono mt-1 px-1">
                  {m.time}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-[#64748B] italic p-2 bg-white/60 rounded border border-[#E6E1D8]/60 w-fit">
              <Bot className="w-3.5 h-3.5 animate-spin text-[#1F4E43]" />
              <span>Receiving basecamp dispatch radio telemetry...</span>
            </div>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="px-3 py-2 bg-[#F7F4EE] border-t border-[#E6E1D8] flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled
              className="text-[11px] bg-[#F7F4EE] border border-[#E6E1D8] text-[#78716C] px-2.5 py-1 rounded whitespace-nowrap cursor-not-allowed"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#E6E1D8] flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="Ranger dispatch chat is not connected in this frontend."
            disabled
            className="flex-1 bg-[#F7F4EE] border border-[#E6E1D8] rounded px-3 py-2 text-xs sm:text-sm text-[#78716C] placeholder-[#78716C] cursor-not-allowed"
          />
          <button
            onClick={() => handleSend()}
            disabled
            className="bg-[#C2410C] text-white px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 opacity-50 cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
