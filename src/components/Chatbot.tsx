import React, { useEffect, useRef, useState } from 'react';
const WS_URL = 'ws://localhost:8000/ws/chatbot';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; content: string }[]>([]);
  const [input, setInput] = useState('');
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
    <div className="fixed bottom-4 right-4 w-80 bg-white border rounded-lg shadow-lg flex flex-col h-96 z-50">
      <div className="flex-1 overflow-y-auto p-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 text-sm ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t flex">
        <input
          className="flex-1 border rounded px-2 py-1 mr-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
        />
        <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
