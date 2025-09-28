import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Video,
  MessageSquare
} from 'lucide-react';

const AppointmentPage = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('upcoming');

  // Mock appointments data
  const appointments = [
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      specialty: 'Cardiology',
      date: '2024-01-15',
      time: '10:00 AM',
      status: 'confirmed',
      type: 'in-person',
      location: 'Downtown Medical Center',
      reason: 'Follow-up consultation',
      duration: '30 minutes',
      notes: 'Bring recent test results'
    },
    {
      id: '2',
      doctorName: 'Dr. Michael Chen',
      specialty: 'Emergency Medicine',
      date: '2024-01-12',
      time: '2:30 PM',
      status: 'completed',
      type: 'in-person',
      location: 'Emergency Department',
      reason: 'General consultation',
      duration: '45 minutes',
      notes: 'Routine check-up completed'
    },
    {
      id: '3',
      doctorName: 'Dr. Emily Rodriguez',
      specialty: 'Pediatrics',
      date: '2024-01-20',
      time: '11:30 AM',
      status: 'pending',
      type: 'telemedicine',
      location: 'Video Call',
      reason: 'Virtual consultation',
      duration: '25 minutes',
      notes: 'Prepare questions in advance'
    },
    {
      id: '4',
      doctorName: 'Dr. James Wilson',
      specialty: 'Orthopedics',
      date: '2024-01-08',
      time: '3:00 PM',
      status: 'cancelled',
      type: 'in-person',
      location: 'Sports Medicine Clinic',
      reason: 'Knee evaluation',
      duration: '40 minutes',
      notes: 'Cancelled due to emergency'
    },
    {
      id: '5',
      doctorName: 'Dr. Lisa Park',
      specialty: 'Dermatology',
      date: '2024-01-25',
      time: '9:00 AM',
      status: 'confirmed',
      type: 'in-person',
      location: 'Dermatology Center',
      reason: 'Skin screening',
      duration: '20 minutes',
      notes: 'Annual screening appointment'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-warning" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'completed':
        return 'bg-muted/10 text-muted-foreground border-muted/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  const filterAppointments = (appointments: any[], tab: string) => {
    const today = new Date();
    const filtered = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      
      switch (tab) {
        case 'upcoming':
          return appointmentDate >= today && appointment.status !== 'cancelled' && appointment.status !== 'completed';
        case 'past':
          return appointmentDate < today || appointment.status === 'completed';
        case 'cancelled':
          return appointment.status === 'cancelled';
        default:
          return true;
      }
    });

    // Apply search and status filters
    return filtered.filter(appointment => {
      const matchesSearch = searchTerm === '' || 
        appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const AppointmentCard = ({ appointment }: { appointment: any }) => (
    <Card className="shadow-card hover:shadow-hover transition-smooth">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{appointment.doctorName}</CardTitle>
              <CardDescription>{appointment.specialty}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(appointment.status)}>
              {getStatusIcon(appointment.status)}
              <span className="ml-1 capitalize">{appointment.status}</span>
            </Badge>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{new Date(appointment.date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{appointment.time} ({appointment.duration})</span>
          </div>
          <div className="flex items-center space-x-2">
            {appointment.type === 'telemedicine' ? (
              <Video className="w-4 h-4 text-muted-foreground" />
            ) : (
              <MapPin className="w-4 h-4 text-muted-foreground" />
            )}
            <span>{appointment.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span>{appointment.reason}</span>
          </div>
        </div>
        
        {appointment.notes && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Notes:</strong> {appointment.notes}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {appointment.status === 'confirmed' && (
            <>
              {appointment.type === 'telemedicine' ? (
                <Button className="flex-1">
                  <Video className="mr-2 h-4 w-4" />
                  Join Video Call
                </Button>
              ) : (
                <Button variant="outline" className="flex-1">
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Directions
                </Button>
              )}
              <Button variant="outline" className="flex-1">
                Reschedule
              </Button>
            </>
          )}
          
          {appointment.status === 'pending' && (
            <Button variant="outline" className="flex-1">
              <Phone className="mr-2 h-4 w-4" />
              Contact Office
            </Button>
          )}

          {appointment.status === 'completed' && (
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/book-appointment">
                <Plus className="mr-2 h-4 w-4" />
                Book Follow-up
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

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

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search appointments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Appointment Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upcoming">
                  Upcoming ({filterAppointments(appointments, 'upcoming').length})
                </TabsTrigger>
                <TabsTrigger value="past">
                  Past ({filterAppointments(appointments, 'past').length})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Cancelled ({filterAppointments(appointments, 'cancelled').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {filterAppointments(appointments, 'upcoming').length > 0 ? (
                  <div className="grid gap-4">
                    {filterAppointments(appointments, 'upcoming').map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No upcoming appointments
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        You don't have any upcoming appointments scheduled.
                      </p>
                      <Button asChild>
                        <Link to="/book-appointment">
                          <Plus className="mr-2 h-4 w-4" />
                          Schedule Your First Appointment
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {filterAppointments(appointments, 'past').length > 0 ? (
                  <div className="grid gap-4">
                    {filterAppointments(appointments, 'past').map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No past appointments
                      </h3>
                      <p className="text-muted-foreground">
                        Your appointment history will appear here.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4">
                {filterAppointments(appointments, 'cancelled').length > 0 ? (
                  <div className="grid gap-4">
                    {filterAppointments(appointments, 'cancelled').map((appointment) => (
                      <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No cancelled appointments
                      </h3>
                      <p className="text-muted-foreground">
                        You don't have any cancelled appointments.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
          {/* Surgery Hub Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Surgery Hub</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Surgeries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">Knee Replacement Surgery</p>
                        <p className="text-sm text-muted-foreground">Dr. Michael Chen</p>
                        <p className="text-sm">January 20, 2024 at 8:00 AM</p>
                      </div>
                      <Badge>Scheduled</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Pre-operative Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                      <span className="text-sm">Fast for 12 hours before surgery</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                      <span className="text-sm">Stop blood thinners 48 hours prior</span>
                    </li>
                  </ul>
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

export default AppointmentPage;