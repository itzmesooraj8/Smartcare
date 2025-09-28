import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { MessageSquare, Reply } from 'lucide-react';

const messages = [
  {
    id: 1,
    from: 'John Doe',
    subject: 'Prescription Query',
    preview: 'Doctor, I have a question about my recent prescription.',
    date: '2024-09-27',
    time: '09:30 AM',
    unread: true,
  },
  {
    id: 2,
    from: 'Jane Smith',
    subject: 'Appointment Follow-up',
    preview: 'Thank you for today’s appointment. Can you clarify the next steps?',
    date: '2024-09-26',
    time: '02:15 PM',
    unread: false,
  },
];

const DoctorMessagesPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-4">Patient Messages</h1>
        <p className="text-lg text-muted-foreground mb-8">View and reply to messages from your patients.</p>
        <div className="grid gap-4">
          {messages.map((message) => (
            <div key={message.id} className={`border rounded-lg p-4 bg-card shadow-card ${message.unread ? 'border-primary/30 bg-primary/5' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-semibold text-foreground">{message.from}</span>
                  <span className="ml-2 text-muted-foreground">{message.subject}</span>
                </div>
                <div className="text-sm text-muted-foreground">{message.time} | {new Date(message.date).toLocaleDateString()}</div>
              </div>
              <div className="mb-2 text-muted-foreground">{message.preview}</div>
              <button className="inline-flex items-center px-3 py-1 rounded bg-primary text-white hover:bg-primary/80">
                <Reply className="mr-2 h-4 w-4" />Reply
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
    <Footer />
  </div>
);

export default DoctorMessagesPage;
