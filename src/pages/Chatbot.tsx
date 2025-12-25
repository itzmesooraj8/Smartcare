import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import SentientOrb from '../components/ui/SentientOrb';

const BACKEND_CHAT = 'https://smartcare-zflo.onrender.com/api/v1/chat';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const sendingRef = useRef(false);

  const send = async () => {
    if (!input.trim() || sendingRef.current) return;
    const text = input.trim();
    const userMsg: Msg = { id: Date.now().toString(), role: 'user', text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    sendingRef.current = true;
    try {
      const res = await fetch(BACKEND_CHAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const reply: string = data?.response ?? 'Sorry, no response.';
      const botMsg: Msg = { id: Date.now().toString() + '-bot', role: 'assistant', text: reply };
      setMessages(m => [...m, botMsg]);
    } catch (err) {
      const errMsg: Msg = { id: Date.now().toString() + '-err', role: 'assistant', text: 'Error contacting assistant.' };
      setMessages(m => [...m, errMsg]);
    } finally {
      sendingRef.current = false;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-transparent rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
          aria-label="Open chat"
        >
          <SentientOrb className="w-12 h-12" isThinking={isOpen} />
        </button>
      )}

      {isOpen && (
        <div className="w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="text-sm font-medium">SmartCare Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-black"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 h-64 overflow-y-auto space-y-2 text-sm">
            {messages.length === 0 && <div className="text-gray-400 text-center">Ask me about appointments or symptoms.</div>}
            {messages.map(m => (
              <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div className={`inline-block px-3 py-2 rounded-md ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              className="flex-1 px-3 py-2 rounded-md border border-gray-200"
              placeholder="Describe your issue or ask a question"
            />
            <button onClick={send} className="px-3 py-2 bg-green-600 text-white rounded-md">Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
