import React from 'react';

const Chatbot: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div aria-live="polite">
      {/* Minimal floating chatbot button/widget to avoid heavy runtime code */}
      <div className="fixed bottom-6 right-6 z-50">
        {open ? (
          <div className="w-80 h-96 bg-white rounded-xl shadow-lg border overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <div className="font-medium">Chatbot</div>
              <button aria-label="close" onClick={() => setOpen(false)} className="text-sm text-zinc-600">Close</button>
            </div>
            <div className="p-3 text-sm text-zinc-500">The chatbot widget is temporarily disabled for stability. Use the Triage page.</div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="bg-primary text-white p-3 rounded-full shadow-lg"
            aria-label="Open chatbot"
          >
            💬
          </button>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
