import React, { useState, useEffect } from 'react';
import { Calendar, Video, Clock, User, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Consultation {
  id: string;
  patientName?: string;
  doctorName?: string;
  date: string;
  time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  type: 'video' | 'audio' | 'chat';
  duration: number;
  notes?: string;
}

const TeleconsultationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockConsultations: Consultation[] = [
      {
        id: '1',
        doctorName: 'Dr. Sarah Johnson',
        patientName: 'John Doe',
        date: new Date().toISOString().split('T')[0],
        time: '14:30',
        status: 'scheduled',
        type: 'video',
        duration: 30,
        notes: 'Follow-up consultation for hypertension management'
      },
      {
        id: '2',
        doctorName: 'Dr. Michael Chen',
        patientName: 'Jane Smith',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '10:00',
        status: 'scheduled',
        type: 'video',
        duration: 45,
        notes: 'Initial consultation for diabetes care'
      },
      {
        id: '3',
        doctorName: 'Dr. Emily Brown',
        patientName: 'Robert Johnson',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        time: '16:00',
        status: 'completed',
        type: 'video',
        duration: 30,
        notes: 'Routine check-up completed successfully'
      }
    ];
    setConsultations(mockConsultations);

    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const isConsultationReady = (consultation: Consultation) => {
    const consultationDateTime = new Date(`${consultation.date} ${consultation.time}`);
    const timeDiff = consultationDateTime.getTime() - currentTime.getTime();
    const minutesDiff = Math.floor(timeDiff / 60000);
    return minutesDiff <= 5 && minutesDiff >= -30; // 5 minutes before to 30 minutes after
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'default',
      'in-progress': 'secondary',
      completed: 'outline',
      cancelled: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const handleJoinCall = (consultationId: string) => {
    navigate(`/video-call/${consultationId}`);
  };

  const upcomingConsultations = consultations.filter(c => c.status === 'scheduled');
  const completedConsultations = consultations.filter(c => c.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Teleconsultation Center</h1>
          <p className="text-muted-foreground">Connect with healthcare professionals from the comfort of your home</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Schedule Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Book a new video consultation with your doctor</p>
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={() => navigate('/book-appointment')}
              >
                Book Now
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Quick Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Start a quick chat consultation for minor queries</p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate('/messages')}
              >
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                View Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Access your consultation history and notes</p>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate('/medical-records')}
              >
                View Records
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Consultations Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming Consultations</TabsTrigger>
            <TabsTrigger value="history">Consultation History</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingConsultations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No upcoming consultations</p>
                  <p className="text-muted-foreground mb-4">Schedule a consultation to get started</p>
                  <Button onClick={() => navigate('/book-appointment')}>
                    Book Consultation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {upcomingConsultations.map((consultation) => (
                    <Card key={consultation.id} className="hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {user?.role === 'patient' ? consultation.doctorName : consultation.patientName}
                            </CardTitle>
                            <CardDescription>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(consultation.date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {consultation.time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Video className="w-4 h-4" />
                                  {consultation.duration} mins
                                </span>
                              </div>
                            </CardDescription>
                          </div>
                          {getStatusBadge(consultation.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {consultation.notes && (
                          <p className="text-sm text-muted-foreground mb-4">{consultation.notes}</p>
                        )}
                        
                        {isConsultationReady(consultation) && (
                          <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-950/20">
                            <AlertCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                              Your consultation is ready. You can join the call now.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          {isConsultationReady(consultation) ? (
                            <Button 
                              className="flex-1 bg-gradient-medical hover:opacity-90"
                              onClick={() => handleJoinCall(consultation.id)}
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Join Call
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              disabled
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Waiting Room Opens Soon
                            </Button>
                          )}
                          <Button variant="outline">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Button variant="outline">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {completedConsultations.map((consultation) => (
                  <Card key={consultation.id} className="hover:shadow-md transition-all duration-300">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {user?.role === 'patient' ? consultation.doctorName : consultation.patientName}
                          </CardTitle>
                          <CardDescription>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(consultation.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {consultation.time}
                              </span>
                              <span className="flex items-center gap-1">
                                <Video className="w-4 h-4" />
                                {consultation.duration} mins
                              </span>
                            </div>
                          </CardDescription>
                        </div>
                        {getStatusBadge(consultation.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {consultation.notes && (
                        <p className="text-sm text-muted-foreground mb-4">{consultation.notes}</p>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <FileText className="w-4 h-4 mr-2" />
                          View Notes
                        </Button>
                        <Button variant="outline">
                          Download Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TeleconsultationPage;