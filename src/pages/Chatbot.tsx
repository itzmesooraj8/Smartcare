import React from 'react';
import Chatbot from '@/components/Chatbot';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const ChatbotPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-4xl h-[80vh] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <Chatbot />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatbotPage;
