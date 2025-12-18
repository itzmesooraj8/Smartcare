import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { Paperclip, Send, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Minimal toast helper (fallback if app doesn't provide one)
const useToast = () => {
  const notify = ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    const id = `toast-${Date.now()}`;
    const el = document.createElement('div');
    el.id = id;
    el.className = `fixed bottom-6 right-6 z-50 w-80 p-3 rounded shadow-lg border ${variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-black'}`;
    el.innerHTML = `<strong>${title}</strong><div class=\"text-sm\">${description || ''}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('opacity-100'), 20);
    setTimeout(() => el.remove(), 4500);
  };
  return { toast: notify };
};

type ChatMessage = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  createdAt: number;
  status?: 'sending' | 'sent' | 'error' | 'read';
};

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
});

export default function DoctorMessagesPage() {
  const { toast } = useToast();

  const useChat = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
      const now = Date.now();
      return [
        { id: 'm1', text: 'Hi Dr. Jones, I have a question about my meds.', sender: 'them', createdAt: now - 1000 * 60 * 60, status: 'read' },
        { id: 'm2', text: 'Sure — tell me more.', sender: 'me', createdAt: now - 1000 * 60 * 55, status: 'read' },
      ];
    });
    const [loading, setLoading] = useState(false);
    const [typing, setTyping] = useState(false);

    const sendMessage = async (text: string) => {
      const id = `local-${Date.now()}`;
      const optimistic: ChatMessage = { id, text, sender: 'me', createdAt: Date.now(), status: 'sending' };
      setMessages((m) => [...m, optimistic]);
      try {
        setLoading(true);
        await new Promise((res) => setTimeout(res, 600));
        setMessages((m) => m.map((mm) => (mm.id === id ? { ...mm, status: 'sent' } : mm)));
        setTimeout(() => {
          const reply: ChatMessage = { id: `r-${Date.now()}`, text: 'Thanks for the message — I will review and follow up.', sender: 'them', createdAt: Date.now(), status: 'sent' };
          setMessages((m) => [...m, reply]);
          toast({ title: 'New message from Sarah Jones', description: reply.text });
        }, 3000);
      } catch (e) {
        setMessages((m) => m.map((mm) => (mm.id === id ? { ...mm, status: 'error' } : mm)));
      } finally {
        setLoading(false);
      }
    };

    const retrySend = async (msg: ChatMessage) => {
      setMessages((m) => m.map((mm) => (mm.id === msg.id ? { ...mm, status: 'sending' } : mm)));
      try {
        await new Promise((res) => setTimeout(res, 700));
        setMessages((m) => m.map((mm) => (mm.id === msg.id ? { ...mm, status: 'sent' } : mm)));
      } catch {
        setMessages((m) => m.map((mm) => (mm.id === msg.id ? { ...mm, status: 'error' } : mm)));
      }
    };

    return { messages, sendMessage, retrySend, loading, typing, setTyping };
  };

  const chat = useChat();
  const { register, handleSubmit, reset, formState } = useForm({ resolver: zodResolver(chatSchema) });
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.messages.length]);

  const onSubmit = async (data: any) => {
    await chat.sendMessage(data.message);
    reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <div className="flex h-[70vh] bg-card rounded-lg overflow-hidden shadow-card">
            <aside className="w-80 border-r bg-surface p-3 hidden md:block">
              <div className="mb-4 font-semibold">Conversations</div>
              <div className="space-y-2 overflow-auto h-full">
                <div className="flex items-center p-2 rounded hover:bg-primary/5 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3"><User className="text-primary" /></div>
                  <div className="flex-1">
                    <div className="font-medium">Sarah Jones</div>
                    <div className="text-sm text-muted-foreground">Last message preview…</div>
                  </div>
                  <div className="text-xs text-muted-foreground">2m</div>
                </div>
              </div>
            </aside>

            <section className="flex-1 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3"><User className="text-primary" /></div>
                  <div>
                    <div className="font-semibold">Sarah Jones</div>
                    <div className="text-sm text-muted-foreground">Online</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Connected</div>
              </div>

              <div className="flex-1 p-4 overflow-auto" style={{ background: 'linear-gradient(180deg,transparent, rgba(0,0,0,0.02))' }}>
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {chat.messages.map((m) => (
                      <motion.div key={m.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                        <ChatBubble message={m} onRetry={() => chat.retrySend(m)} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {chat.typing && (
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-surface mr-3" />
                      <TypingIndicator />
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-3 border-t">
                <div className="flex items-end gap-2">
                  <label className="p-2 rounded hover:bg-surface cursor-pointer" title="Attach">
                    <Paperclip />
                  </label>
                  <textarea {...register('message')} placeholder="Write a message..." className="flex-1 resize-none p-3 rounded border bg-white" rows={1} />
                  <button type="submit" className="inline-flex items-center px-4 py-2 rounded bg-primary text-white">
                    {chat.loading ? <span className="animate-pulse">Sending...</span> : <Send className="h-4 w-4" />}
                  </button>
                </div>
                {formState.errors.message && <div className="text-red-600 text-sm mt-1">{(formState.errors.message as any)?.message}</div>}
              </form>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

function ChatBubble({ message, onRetry }: { message: ChatMessage; onRetry: () => void }) {
  const isMe = message.sender === 'me';
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] p-3 rounded-lg ${isMe ? 'bg-primary text-white' : 'bg-white text-black border'}`}>
        <div className="whitespace-pre-wrap">{message.text}</div>
        <div className="mt-2 flex items-center justify-end text-[11px] opacity-80">
          {message.status === 'sending' && <span className="mr-2">Sending…</span>}
          {message.status === 'sent' && <Check className="h-3 w-3 text-white/80" />}
          {message.status === 'error' && (
            <button onClick={onRetry} className="ml-2 text-xs underline">Retry</button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <motion.div className="p-2 bg-white rounded" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center space-x-1">
        <Dot />
        <Dot delay={0.15} />
        <Dot delay={0.3} />
      </div>
    </motion.div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return <motion.span className="w-2 h-2 bg-muted-foreground rounded-full block" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay }} />;
}
