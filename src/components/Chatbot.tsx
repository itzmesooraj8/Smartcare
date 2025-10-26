import React, { useEffect, useRef, useState } from 'react';
const WS_URL = 'ws://localhost:8000/ws/chatbot';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(WS_URL);
    ws.current.onmessage = (event) => {
      setMessages((prev) => [...prev, { sender: 'bot', content: event.data }]);
    };
    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && ws.current) {
      setMessages((prev) => [...prev, { sender: 'user', content: input }]);
      ws.current.send(input);
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
              <span className="font-semibold text-blue-700 text-lg">SmartCare Chatbot</span>
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
              placeholder="Type your message..."
            />
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-xl font-semibold transition-all duration-150"
              onClick={sendMessage}
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
