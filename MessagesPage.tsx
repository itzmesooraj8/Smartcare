import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, Reply, Clock } from 'lucide-react';

const MessagesPage = () => {
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
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Messages
              </h1>
              <p className="text-lg text-muted-foreground">
                Communicate securely with your healthcare providers and receive important updates.
              </p>
            </div>

            <div className="mb-6">
              <Button asChild>
                <a href="#" className="inline-flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Compose Message
                </a>
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
                      <Button size="sm">
                        <Reply className="mr-2 h-4 w-4" />
                        Reply
                      </Button>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View Full Message
                      </Button>
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