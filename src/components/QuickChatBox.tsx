import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Maximize2, Minimize2, CalendarDays, Mountain, Compass, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { navigateTo, useLocation } from '../lib/navigation';
import { ROUTES } from '../constants/routes';

interface DocumentSource {
  title?: string;
  excerpt?: string;
  score?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentSource[];
  recommendations?: TourRecommendation[];
  timestamp: string;
}

interface TourRecommendation {
  tourId: number;
  title: string;
  difficulty: string;
  durationDays: number;
  coverImageUrl?: string;
  priceFromVnd?: number;
  partySize: number;
  estimatedTotalVnd?: number;
  departures: { startsAt: string; availableSeats: number; basePriceVnd?: number; equipmentFeeVnd?: number }[];
  locations: string[];
  reason: string;
}

export const QuickChatBox: React.FC = () => {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('wetrek-ai-session') || '');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Mình có thể giúp bạn tìm tour trekking theo độ khó, ngân sách, điểm đến và ngày khởi hành.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSupportedPage = pathname === '/' || pathname === '/home' || pathname === '/tours' || pathname === '/tours/';

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const botMessageId = 'bot-' + Date.now();
    // Reserve the assistant message while the server checks current tour data.
    setMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    try {
      const response = await fetch('/api/v1/integrate-ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          question: query,
          ...(sessionId ? { sessionId } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const result = await response.json() as {
        sessionId?: string;
        answer?: string;
        recommendations?: TourRecommendation[];
      };
      if (result.sessionId) {
        setSessionId(result.sessionId);
        localStorage.setItem('wetrek-ai-session', result.sessionId);
      }
      setMessages((prev) => prev.map((m) => m.id === botMessageId
        ? { ...m, content: result.answer || 'Mình chưa có thông tin phù hợp để trả lời.', recommendations: result.recommendations || [] }
        : m));
    } catch (err: unknown) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? {
                ...m,
                content: 'Mình chưa thể tra cứu lúc này. Bạn vui lòng thử lại sau nhé.',
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isSupportedPage) return null;

  return (
    <div className={isFullscreen
      ? 'fixed inset-0 z-[70] bg-[#f7f5ef]'
      : 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end'}>
      {/* Chat Window */}
      {isOpen && (
        <div className={isFullscreen
          ? 'h-full w-full flex flex-col overflow-hidden bg-[#f7f5ef]'
          : 'mb-3 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100dvh-6rem))] bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200'}>
          {isFullscreen && (
            <div className="h-16 shrink-0 border-b border-stone-200 bg-white px-5 sm:px-8 flex items-center justify-between">
              <div className="flex items-center gap-3 text-emerald-950">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-900 text-white"><Mountain className="h-5 w-5" /></span>
                <div><p className="font-bold leading-tight">WeTrek <span className="font-normal text-stone-500">AI</span></p><p className="text-xs text-stone-500">Tư vấn hành trình trekking</p></div>
              </div>
              <button onClick={() => setIsFullscreen(false)} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50" title="Thu nhỏ khung chat">
                <Minimize2 className="h-4 w-4" /><span className="hidden sm:inline">Thu nhỏ</span>
              </button>
            </div>
          )}
          <div className={isFullscreen ? 'mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-6 p-3 sm:p-6' : 'flex min-h-0 flex-1 flex-col'}>
          <div className={isFullscreen ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm' : 'flex min-h-0 flex-1 flex-col overflow-hidden'}>
          {/* Header */}
          <div className="bg-emerald-950 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
                <Sparkles className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Trợ lý hành trình</h3>
                <p className="text-[11px] text-emerald-200">Gợi ý tour theo nhu cầu của bạn</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isFullscreen && <button onClick={() => setIsFullscreen(true)} className="rounded-lg p-2 hover:bg-white/10 transition-colors" title="Mở toàn màn hình" aria-label="Mở toàn màn hình"><Maximize2 className="h-4 w-4" /></button>}
              {!isFullscreen && <button onClick={() => { setIsOpen(false); setIsFullscreen(false); }} className="rounded-lg p-2 hover:bg-white/10 transition-colors" title="Đóng chat" aria-label="Đóng chat"><X className="w-5 h-5" /></button>}
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#fbfaf7] text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-br-xs'
                      : 'bg-white text-stone-800 border border-stone-200 shadow-xs rounded-bl-xs'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-stone max-w-none leading-relaxed"
                      style={{
                        fontSize: 'inherit',
                        color: 'inherit',
                      }}
                    >
                      <ReactMarkdown
                        components={{
                          // Headings
                          h1: ({ children }) => <h1 className="text-base font-bold mt-2 mb-1">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-sm font-bold mt-2 mb-1">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mt-1.5 mb-0.5">{children}</h3>,
                          // Bold / Italic
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          // Paragraphs
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          // Lists
                          ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          // Horizontal rule (***)
                          hr: () => <hr className="my-2 border-stone-200" />,
                          // Inline code
                          code: ({ children }) => <code className="bg-stone-100 text-emerald-800 px-1 rounded text-xs font-mono">{children}</code>,
                          // Code block
                          pre: ({ children }) => <pre className="bg-stone-100 p-2 rounded text-xs overflow-x-auto my-1">{children}</pre>,
                          // Images
                          img: ({ src, alt }) => (
                            <img
                              src={src}
                              alt={alt || 'Tour image'}
                              className="w-full max-h-48 object-cover rounded-lg my-2 border border-stone-200 shadow-sm"
                              loading="lazy"
                            />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}

                  {msg.recommendations?.map((tour) => (
                    <div key={tour.tourId} className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
                      {tour.coverImageUrl && <img src={tour.coverImageUrl} alt={tour.title} className="h-28 w-full object-cover" loading="lazy" />}
                      <div className="space-y-1.5 p-3">
                        <p className="font-semibold text-stone-900">{tour.title}</p>
                        <p className="text-xs text-stone-600">{tour.difficulty} · {tour.durationDays} ngày{tour.locations.length ? ` · ${tour.locations.join(' • ')}` : ''}</p>
                        {tour.priceFromVnd != null && <div className="space-y-0.5 text-xs"><p className="font-semibold text-emerald-800">Giá tour cơ bản từ {new Intl.NumberFormat('vi-VN').format(tour.priceFromVnd)} ₫ / người</p>{tour.partySize > 1 && tour.estimatedTotalVnd != null && <p className="font-semibold text-stone-800">Tạm tính tour cơ bản cho {tour.partySize} người: {new Intl.NumberFormat('vi-VN').format(tour.estimatedTotalVnd)} ₫</p>}</div>}
                        {tour.departures.slice(0, 2).map((departure) => <p key={departure.startsAt} className="text-xs text-stone-600">{new Date(departure.startsAt).toLocaleDateString('vi-VN')} · còn {departure.availableSeats} chỗ</p>)}
                        {tour.reason && <p className="text-xs text-stone-600">{tour.reason}</p>}
                        <button type="button" onClick={() => navigateTo(ROUTES.PUBLIC.TOUR_DETAIL(tour.tourId))} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
                          Xem tour <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Sources Preview (if any) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
                      <div className="font-medium text-emerald-800 mb-1 flex items-center gap-1">
                        <span>📚 Nguồn tài liệu:</span>
                      </div>
                      <div className="space-y-1">
                        {msg.sources.map((s, idx) => (
                          <div key={idx} className="bg-stone-50 p-1.5 rounded border border-stone-100">
                            <span className="font-semibold text-stone-700">{s.title || `Doc #${idx + 1}`}</span>
                            {s.score != null && (
                              <span className="ml-1 text-[10px] text-stone-400">
                                (Score: {s.score.toFixed(2)})
                              </span>
                            )}
                            {s.excerpt && <p className="line-clamp-2 text-stone-600 mt-0.5">{s.excerpt}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1 text-right ${
                      msg.role === 'user' ? 'text-emerald-200' : 'text-stone-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-stone-500 text-xs">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Đang tìm kiếm & suy nghĩ...</span>
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="mt-2 space-y-1.5">
                <p className="text-[11px] text-stone-500 font-medium">💡 Gợi ý câu hỏi:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Gợi ý vài tour trekking nổi bật',
                    'Có tour nào cho người mới bắt đầu không?',
                    'Tour Tà Năng Phan Dũng giá bao nhiêu?',
                    'Chính sách hủy tour như thế nào?'
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setInput(suggestion);
                      }}
                      className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 rounded-full px-2.5 py-1 text-left transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-stone-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Bạn muốn đi trekking ở đâu?"
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          </div>
          {isFullscreen && <aside className="hidden w-80 shrink-0 flex-col gap-4 lg:flex">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-emerald-950"><Compass className="h-5 w-5 text-emerald-800" /><h3 className="font-bold">Tiêu chí chuyến đi</h3></div>
              <p className="mb-4 text-sm leading-6 text-stone-600">Mô tả mong muốn của bạn trong cuộc trò chuyện. Trợ lý sẽ dựa trên ngày đi, điểm đến, độ khó và ngân sách để gợi ý hành trình phù hợp.</p>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3 rounded-xl bg-stone-50 p-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" /><span className="text-stone-700">Ngày khởi hành linh hoạt</span></div>
                <div className="flex gap-3 rounded-xl bg-stone-50 p-3"><Mountain className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" /><span className="text-stone-700">Độ khó theo thể lực</span></div>
              </div>
            </section>
            <section className="rounded-2xl border border-emerald-900/10 bg-emerald-900 p-5 text-white">
              <Sparkles className="mb-3 h-5 w-5 text-emerald-200" /><p className="font-semibold">Chưa biết bắt đầu từ đâu?</p><p className="mt-1 text-sm leading-6 text-emerald-100">Hãy cho mình biết bạn muốn đi ngày nào và mức độ trekking mong muốn.</p>
            </section>
          </aside>}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isFullscreen && <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-emerald-700/30"
        title={isOpen ? 'Đóng trợ lý tour' : 'Mở trợ lý tour'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>}
    </div>
  );
};
