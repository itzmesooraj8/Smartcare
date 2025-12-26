import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, Clock, FileText } from 'lucide-react';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { title: "Today's Appointments", value: '8', icon: Calendar, color: 'text-primary', to: '/appointments' },
    { title: 'Total Patients', value: '156', icon: Users, color: 'text-secondary', to: '/patients' },
    { title: 'Messages', value: 'Inbox', icon: FileText, color: 'text-success', to: '/messages' },
    { title: 'Teleconsultation', value: 'Join', icon: Clock, color: 'text-warning', to: '/teleconsultation' }
  ];

  const handleNavigate = (path?: string) => {
    if (!path) return;
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Good morning, {user?.name}!
              </h1>
              <p className="text-muted-foreground">
                Here's your schedule and patient overview for today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="shadow-card cursor-pointer transform transition-transform duration-150 hover:scale-105" onClick={() => handleNavigate(stat.to)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
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

export default DoctorDashboard;