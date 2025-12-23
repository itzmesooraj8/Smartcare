import React, { useState } from 'react';
  import { MessageCircle, X } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)} 
            className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
            aria-label="Open chat"
          >
            <MessageCircle className="w-6 h-6" />
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
            <div className="p-4 h-64 overflow-y-auto flex items-center justify-center text-gray-400 text-sm">
              Chat feature coming soon...
            </div>
          </div>
      )}
    </div>
  );
};

export default Chatbot;
