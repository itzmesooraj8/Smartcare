import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Heart, FileText, Clock, Plus, Bell } from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { title: 'Upcoming Appointments', value: '2', icon: Calendar, color: 'text-primary' },
    { title: 'Health Records', value: '12', icon: FileText, color: 'text-secondary' },
    { title: 'Prescriptions', value: '3', icon: Heart, color: 'text-success' },
    { title: 'Last Visit', value: '5 days ago', icon: Clock, color: 'text-warning' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-muted-foreground">
                Here's an overview of your health and upcoming appointments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="shadow-card">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" asChild>
                    <Link to="/book-appointment">
                      <Plus className="mr-2 h-4 w-4" />
                      Book New Appointment
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/appointments">
                      <Calendar className="mr-2 h-4 w-4" />
                      View All Appointments
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/medical-records">
                      <FileText className="mr-2 h-4 w-4" />
                      Medical Records
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Appointment Reminder</p>
                        <p className="text-xs text-muted-foreground">Tomorrow at 10:00 AM</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default PatientDashboard;