import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAI } from '../api/chatApi'; // Import the helper we created

// Simple type for message structure
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface ChatbotProps {
  onTranscriptChange?: (transcript: string) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ onTranscriptChange }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hello! I am Smartcare AI. How can I help you today?", sender: 'ai' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Notify parent of transcript changes (concatenate user messages)
  useEffect(() => {
    if (onTranscriptChange) {
      const transcript = messages.filter(m => m.sender === 'user').map(m => m.text).join('\n');
      onTranscriptChange(transcript);
    }
  }, [messages, onTranscriptChange]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Add User Message
    const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. Call the API
      const aiResponseText = await sendMessageToAI(userMessage.text);
      
      // 3. Add AI Message
      const aiMessage: Message = { id: Date.now() + 1, text: aiResponseText, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Handle error gracefully in UI
      const errorMessage: Message = { id: Date.now() + 1, text: "⚠️ Network Error. Please try again.", sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="chat-container">
      {/* Messages Area */}
      <div className="messages-list" style={{ height: '400px', overflowY: 'auto', padding: '1rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`} style={{ 
            textAlign: msg.sender === 'user' ? 'right' : 'left',
            margin: '10px 0' 
          }}>
            <span style={{ 
              background: msg.sender === 'user' ? '#007bff' : '#f1f1f1',
              color: msg.sender === 'user' ? '#fff' : '#000',
              padding: '8px 12px', 
              borderRadius: '12px',
              display: 'inline-block'
            }}>
              {msg.text}
            </span>
          </div>
        ))}
        {isLoading && <div className="loading">AI is typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area" style={{ display: 'flex', padding: '1rem', borderTop: '1px solid #ddd' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          disabled={isLoading}
        />
        <button 
          onClick={handleSend} 
          disabled={isLoading}
          style={{ marginLeft: '10px', padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
