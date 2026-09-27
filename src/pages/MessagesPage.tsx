import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, Reply, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { subscribeToMessages, sendRealtimeMessage } from '@/lib/realtime';
import { toast } from 'sonner';

interface MessageItem {
  id: string | number;
  from: string;
  subject: string;
  preview: string;
  date: string;
  time: string;
  unread: boolean;
  avatar: string;
}

const INITIAL_MESSAGES: MessageItem[] = [
  {
    id: 1,
    from: 'Dr. Sarah Smith',
    subject: 'Your Test Results Are Ready',
    preview: 'Your recent blood work results are now available. Please review and contact us if you have any questions.',
    date: '2024-03-15',
    time: '10:30 AM',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 2,
    from: 'SmartCare Team',
    subject: 'Appointment Reminder',
    preview: 'This is a friendly reminder of your upcoming appointment tomorrow at 2:00 PM with Dr. Johnson.',
    date: '2024-03-14',
    time: '3:45 PM',
    unread: true,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 3,
    from: 'Dr. Michael Johnson',
    subject: 'Follow-up Instructions',
    preview: 'Thank you for visiting today. Here are your post-appointment care instructions and next steps.',
    date: '2024-03-12',
    time: '4:20 PM',
    unread: false,
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face'
  }
];

const MessagesPage = () => {
  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MESSAGES);
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [replyTo, setReplyTo] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [viewMessage, setViewMessage] = useState<any>(null);
  const { user } = useAuth();

  useEffect(() => {
    const channel = subscribeToMessages('doctor-patient-chat', (incoming) => {
      if (incoming.sender_id !== (user?.id || 'patient-me')) {
        const newMsg: MessageItem = {
          id: incoming.id,
          from: incoming.sender_name || 'Care Team',
          subject: 'Direct Consultation Message',
          preview: incoming.text,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true,
          avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face',
        };
        setMessages((prev) => [newMsg, ...prev.filter((m) => m.id !== newMsg.id)]);
        toast.success(`New message from ${newMsg.from}`, {
          description: newMsg.preview,
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const handleSendMessage = async (text: string, subject = 'Patient Inquiry') => {
    if (!text.trim()) return;
    const optimistic: MessageItem = {
      id: `local-${Date.now()}`,
      from: user?.email || 'You',
      subject,
      preview: text,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unread: false,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    };
    setMessages((prev) => [optimistic, ...prev]);

    try {
      await sendRealtimeMessage('doctor-patient-chat', {
        sender_id: user?.id || 'patient-me',
        sender_name: user?.email || 'Patient',
        text,
      });
      toast.success('Message delivered in realtime');
    } catch {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Arrow */}
            <div className="mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  Back
                </Link>
              </Button>
            </div>
            {/* ...existing code... */}

            <div className="mb-6">
              <Button onClick={() => setShowCompose(true)} className="inline-flex items-center">
                <Send className="mr-2 h-4 w-4" />
                Compose Message
              </Button>
            </div>

            <div className="grid gap-4">
              {messages.map((message) => (
                <Card 
                  key={message.id} 
                  className={`shadow-card hover:shadow-hover transition-smooth cursor-pointer ${
                    message.unread ? 'border-primary/30 bg-primary/5' : ''
                  }`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden">
                          <img 
                            src={message.avatar} 
                            alt={message.from}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <CardTitle className={`text-lg ${message.unread ? 'font-bold' : 'font-semibold'}`}>
                              {message.from}
                            </CardTitle>
                            {message.unread && (
                              <span className="w-2 h-2 bg-primary rounded-full"></span>
                            )}
                          </div>
                          <CardDescription className={`text-base ${message.unread ? 'font-semibold text-foreground' : ''}`}>
                            {message.subject}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="flex items-center mb-1">
                          <Clock className="w-4 h-4 mr-1" />
                          {message.time}
                        </div>
                        <div>{new Date(message.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className={`text-muted-foreground mb-4 ${message.unread ? 'font-medium' : ''}`}>
                      {message.preview}
                    </p>
                    <div className="flex items-center space-x-3">
                      <Button size="sm" onClick={() => setReplyTo(message)}>
                        <Reply className="mr-2 h-4 w-4" />
                        Reply
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setViewMessage(message)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View Full Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Compose Message Modal */}
            {showCompose && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-background border rounded-2xl shadow-2xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">Compose Message (Realtime)</h2>
                  <textarea
                    className="w-full border rounded-xl p-3 mb-4 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={5}
                    placeholder="Type your clinical inquiry or message here..."
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setShowCompose(false)} variant="outline">Cancel</Button>
                    <Button
                      onClick={() => {
                        handleSendMessage(composeText);
                        setComposeText('');
                        setShowCompose(false);
                      }}
                    >
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Reply Modal */}
            {replyTo && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-background border rounded-2xl shadow-2xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-1">Reply to {replyTo.from}</h2>
                  <p className="text-xs text-muted-foreground mb-4">Re: {replyTo.subject}</p>
                  <textarea
                    className="w-full border rounded-xl p-3 mb-4 bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={5}
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setReplyTo(null)} variant="outline">Cancel</Button>
                    <Button
                      onClick={() => {
                        handleSendMessage(replyText, `Re: ${replyTo.subject}`);
                        setReplyText('');
                        setReplyTo(null);
                      }}
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* View Full Message Modal */}
            {viewMessage && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-background border rounded-2xl shadow-2xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-1">{viewMessage.subject}</h2>
                  <div className="mb-4 text-xs text-muted-foreground">From: {viewMessage.from} · {viewMessage.time}</div>
                  <div className="mb-6 p-4 rounded-xl bg-muted/20 text-sm leading-relaxed">{viewMessage.preview}</div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const target = viewMessage;
                        setViewMessage(null);
                        setReplyTo(target);
                      }}
                    >
                      Reply
                    </Button>
                    <Button onClick={() => setViewMessage(null)} variant="outline" size="sm">Close</Button>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default MessagesPage;