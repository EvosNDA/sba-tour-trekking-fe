import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { APP_CONFIG } from '../constants/config';

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
  timestamp: string;
}

export const QuickChatBox: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => 'session-' + Math.random().toString(36).substring(2, 9));
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý RAG hỗ trợ thông tin các tour trekking và chính sách. Bạn muốn hỏi gì hôm nay?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // Prepare empty bot message placeholder for streaming
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
      const response = await fetch('/api/v1/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          question: query,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser/response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Split by lines but keep uncompleted line in buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.replace(/\r$/, '');
          if (trimmed.startsWith('data:')) {
            // Spring WebFlux SSE formats as "data:<token>"
            // Slice 5 to preserve leading spaces of tokens (e.g., " word" -> "data: word")
            const chunk = trimmed.length > 5 ? trimmed.slice(5) : '\n';
            accumulatedText += chunk;
          } else if (trimmed === '') {
            // Standard SSE empty line between events
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMessageId ? { ...m, content: accumulatedText } : m
          )
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi kết nối';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? {
                ...m,
                content: `⚠️ Lỗi streaming RAG: ${errorMessage}. Vui lòng kiểm tra backend.`,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background Backdrop Blur when Maximized */}
      {isOpen && isMaximized && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setIsMaximized(false)}
        />
      )}

      <div
        className={
          isMaximized && isOpen
            ? 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 pointer-events-none'
            : 'fixed bottom-6 right-6 z-50 flex flex-col items-end'
        }
      >
        {/* Chat Window */}
        {isOpen && (
          <div
            className={`bg-white rounded-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden pointer-events-auto transition-all duration-300 ${
              isMaximized
                ? 'w-full h-full max-w-5xl max-h-[92vh] animate-in zoom-in-95'
                : 'mb-3 w-[360px] sm:w-[420px] h-[540px] rounded-xl animate-in fade-in slide-in-from-bottom-5'
            }`}
          >
            {/* Header */}
            <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-700 rounded-lg">
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">RAG AI Assistant</h3>
                  <p className="text-[11px] text-emerald-200">Streaming /api/v1/ai/chat/stream</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMaximized((prev) => !prev)}
                  className="p-1.5 rounded-lg hover:bg-emerald-700/70 transition-colors text-emerald-100 hover:text-white"
                  title={isMaximized ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsMaximized(false);
                  }}
                  className="p-1.5 rounded-lg hover:bg-emerald-700/70 transition-colors text-emerald-100 hover:text-white"
                  title="Đóng chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50 text-sm">
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
                          img: ({ src, alt }) => {
                            if (!src) return null;
                            return (
                              <span className="block my-2">
                                <img
                                  src={src}
                                  alt={alt || 'Tour image'}
                                  className="w-full max-h-56 object-cover rounded-xl border border-stone-200 shadow-sm transition-opacity duration-200"
                                  loading="lazy"
                                  onError={(e) => {
                                    // Hide broken/fake image URLs gracefully
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                {alt && alt !== 'Tour image' && (
                                  <span className="block text-[11px] text-stone-500 mt-1 italic text-center">
                                    📸 {alt}
                                  </span>
                                )}
                              </span>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}

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
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-stone-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi test RAG..."
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
      )}

      {/* Floating Toggle Button (hidden when maximized) */}
      {!isMaximized && (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-14 w-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-emerald-700/30"
          title={isOpen ? 'Đóng RAG Chat' : 'Mở RAG Chat Test'}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      )}
    </div>
  </>
);
};
