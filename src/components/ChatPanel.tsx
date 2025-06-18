import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatPanelProps {
  className?: string;
}

export default function ChatPanel({ className = '' }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I understand you want to "${userMessage.content}". This is a placeholder response. The AI integration will be implemented here to help you control and interact with your music workstation.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  return (
    <div className={`chat-panel ${className}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.38L1 22l5.62-2.05C8.96 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.4 0-2.76-.3-4-.85l-.28-.15-2.86 1.04 1.04-2.86-.15-.28C5.3 14.76 5 13.4 5 12c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7z"/>
            <circle cx="9" cy="12" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="15" cy="12" r="1"/>
          </svg>
          AI Assistant
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.04 1.05 4.38L1 22l5.62-2.05C8.96 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.4 0-2.76-.3-4-.85l-.28-.15-2.86 1.04 1.04-2.86-.15-.28C5.3 14.76 5 13.4 5 12c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7z"/>
              </svg>
            </div>
            <p>Ask me anything about your music project!</p>
            <p className="empty-state-hint">
              Try: "Create a new track", "Adjust the tempo", or "Export my project"
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-message ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="chat-textarea"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="send-button"
            type="button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--bg2);
          border-left: 1px solid var(--border1);
        }

        .chat-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border1);
          background-color: var(--bg2);
          flex-shrink: 0;
        }

        .chat-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--fg1);
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          background-color: var(--bg1);
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: var(--border1);
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: var(--border6);
        }

        .chat-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--fg1);
          opacity: 0.6;
        }

        .empty-state-icon {
          margin-bottom: 16px;
        }

        .empty-state-hint {
          font-size: 12px;
          margin-top: 8px;
          opacity: 0.7;
        }

        .chat-message {
          margin-bottom: 16px;
          animation: fadeIn 0.3s ease-in;
        }

        .chat-message.user .message-content {
          background-color: var(--color1);
          color: white;
          margin-left: 20%;
          border-radius: 12px 4px 12px 12px;
        }

        .chat-message.assistant .message-content {
          background-color: var(--bg6);
          color: var(--fg1);
          margin-right: 20%;
          border-radius: 4px 12px 12px 12px;
          border: 1px solid var(--border1);
        }

        .message-content {
          padding: 12px 16px;
          line-height: 1.4;
          font-size: 14px;
          word-wrap: break-word;
        }

        .message-time {
          font-size: 11px;
          color: var(--fg1);
          opacity: 0.5;
          margin-top: 4px;
          text-align: right;
        }

        .chat-message.user .message-time {
          text-align: right;
        }

        .chat-message.assistant .message-time {
          text-align: left;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: var(--fg1);
          border-radius: 50%;
          opacity: 0.4;
          animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        .chat-input {
          padding: 12px 16px;
          border-top: 1px solid var(--border1);
          background-color: var(--bg2);
          flex-shrink: 0;
        }

        .input-container {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .chat-textarea {
          flex: 1;
          resize: none;
          border: 1px solid var(--border1);
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          font-family: inherit;
          background-color: var(--bg6);
          color: var(--fg1);
          line-height: 1.4;
          min-height: 40px;
          max-height: 120px;
          transition: border-color 0.2s;
        }

        .chat-textarea:focus {
          outline: none;
          border-color: var(--color1);
        }

        .chat-textarea::placeholder {
          color: var(--fg1);
          opacity: 0.5;
        }

        .send-button {
          padding: 12px;
          border: none;
          border-radius: 8px;
          background-color: var(--color1);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s, transform 0.1s;
          flex-shrink: 0;
          height: 40px;
          width: 40px;
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }

        .send-button:active {
          transform: scale(0.95);
        }

        .send-button:disabled {
          background-color: var(--bg11);
          cursor: not-allowed;
          transform: none;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
} 