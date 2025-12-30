import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthProvider';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Remove the static initial loader (if present) as early as possible so the
// React render replaces it and avoids a persistent white/blank screen.
try {
  const el = document.getElementById('initial-loader');
  if (el && el.parentNode) el.parentNode.removeChild(el);
} catch (e) {
  // swallow errors — removing the loader is best-effort
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <App />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </React.StrictMode>
);