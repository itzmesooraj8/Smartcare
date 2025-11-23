import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Use standard WebSocket URL
// In production, this should be wss:// if https://
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/chatbot';
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const role = user?.role || 'patient';

  const placeholder = useMemo(() => (
    role === 'patient'
      ? 'Ask for general health news or updates…'
      : 'Ask about a patient update or general medical news…'
  ), [role]);

  // Cleanup function for WebSocket
  const cleanupWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect to WebSocket with auto-reconnect logic
  const connectWebSocket = useCallback(() => {
    if (isConnecting || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    console.log('Attempting to connect to WebSocket:', WS_URL);

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected successfully');
        setWsConnected(true);
        setIsConnecting(false);
        setReconnectAttempts(0);
        // Welcome message will come from the server
      };

      ws.onmessage = (event) => {
        const text = event.data;
        setMessages((prev) => [...prev, { sender: 'bot', content: text }]);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setWsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Attempt to reconnect if chat is still open and we haven't exceeded max attempts
        if (open && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              content: `Connection lost. Attempting to reconnect... (${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`
            },
          ]);

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connectWebSocket();
          }, RECONNECT_DELAY);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              content: 'Unable to establish connection. Please check your internet connection and try reopening the chat.'
            },
          ]);
        }
      };

    } catch (err) {
      console.error('Failed to initialize chatbot connection:', err);
      setIsConnecting(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          content: 'Chatbot configuration error. Please check your connection and try again.',
        },
      ]);
    }
  }, [open, reconnectAttempts, isConnecting]);

  // Connect when chat is opened
  useEffect(() => {
    if (!open) {
      cleanupWebSocket();
      setMessages([]);
      setReconnectAttempts(0);
      return;
    }

    setMessages([
      {
        sender: 'bot',
        content: 'Connecting to SmartCare Assistant…',
      },
    ]);

    connectWebSocket();

    return () => {
      cleanupWebSocket();
    };
  }, [open, connectWebSocket, cleanupWebSocket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && wsRef.current && wsConnected) {
      setMessages((prev) => [...prev, { sender: 'user', content: input }]);
      wsRef.current.send(input);
      setInput('');
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <button
          className="fixed bottom-6 right-6 w-16 h-16 bg-blue-500 rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-blue-600 transition-all duration-200"
          onClick={() => setOpen(true)}
          aria-label="Open Chatbot"
        >
          <span className="text-white text-3xl">🤖</span>
        </button>
      )}
      {/* Chatbox */}
      {open && (
        <div
          className="fixed bottom-0 right-0 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl bg-gradient-to-br from-blue-50 via-white to-blue-100 border border-blue-300 rounded-t-2xl shadow-2xl flex flex-col h-[60vh] sm:h-[32rem] z-50"
          style={{
            maxHeight: '90vh',
            minHeight: '350px',
          }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-blue-200 bg-blue-100 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="flex w-8 h-8 bg-blue-500 rounded-full items-center justify-center text-white font-bold text-lg">🤖</span>
              <div className="flex flex-col">
                <span className="font-semibold text-blue-700 text-lg">SmartCare Chatbot</span>
                <span className="text-xs flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-gray-600">
                    {wsConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                  </span>
                </span>
              </div>
            </div>
            <button
              className="ml-auto text-blue-500 hover:text-blue-700 text-xl font-bold"
              onClick={() => setOpen(false)}
              aria-label="Close Chatbot"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
            {messages.length === 0 && (
              <div className="text-center text-blue-400 text-sm mt-10">How can I help you today?</div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`mb-3 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className={`max-w-[70%] px-4 py-2 rounded-2xl shadow ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800 border border-blue-100'}`}>{msg.content}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t border-blue-200 bg-blue-50 flex gap-2 items-center rounded-b-2xl">
            <input
              className="flex-1 border border-blue-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder={placeholder}
            />
            <button
              className={`bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold transition-all duration-150 ${!wsConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={sendMessage}
              disabled={!wsConnected}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
