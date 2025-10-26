import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, Reply, Clock } from 'lucide-react';
import { useState } from 'react';

const MessagesPage = () => {
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [viewMessage, setViewMessage] = useState(null);
  const { user } = useAuth();

  const messages = [
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
      {/* Compose Message Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Compose Message</h2>
            <textarea className="w-full border rounded p-2 mb-4" rows={5} placeholder="Type your message here..." />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowCompose(false)} variant="outline">Cancel</Button>
              <Button onClick={() => { setShowCompose(false); alert('Message sent!'); }}>Send</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {replyTo && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Reply to {replyTo.from}</h2>
            <textarea className="w-full border rounded p-2 mb-4" rows={5} placeholder="Type your reply here..." />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setReplyTo(null)} variant="outline">Cancel</Button>
              <Button onClick={() => { setReplyTo(null); alert('Reply sent!'); }}>Send</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Full Message Modal */}
      {viewMessage && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">{viewMessage.subject}</h2>
            <div className="mb-4 text-muted-foreground">From: {viewMessage.from}</div>
            <div className="mb-4">{viewMessage.preview}</div>
            <div className="flex justify-end">
              <Button onClick={() => setViewMessage(null)} variant="outline">Close</Button>
            </div>
          </div>
        </div>
      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default MessagesPage;