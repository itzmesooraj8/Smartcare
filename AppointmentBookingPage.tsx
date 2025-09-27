import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User,
  ArrowRight,
  Check,
  Heart,
  AlertCircle
} from 'lucide-react';

const AppointmentBookingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [reason, setReason] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const doctors = [
    { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Cardiology', nextAvailable: 'Tomorrow' },
    { id: '2', name: 'Dr. Michael Chen', specialty: 'Emergency Medicine', nextAvailable: 'Today' },
    { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics', nextAvailable: 'Friday' },
    { id: '4', name: 'Dr. James Wilson', specialty: 'Orthopedics', nextAvailable: 'Monday' },
    { id: '5', name: 'Dr. Lisa Park', specialty: 'Dermatology', nextAvailable: 'Thursday' }
  ];

  const services = [
    'General Consultation',
    'Follow-up Visit',
    'Preventive Care',
    'Specialist Consultation',
    'Diagnostic Testing',
    'Procedure/Treatment',
    'Emergency Care',
    'Other'
  ];

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM'
  ];

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedDoctor || !selectedService) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Simulate booking appointment
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Appointment Booked!",
      description: "Your appointment has been successfully scheduled. You'll receive a confirmation email shortly.",
    });

    // Reset form
    setSelectedDate(new Date());
    setSelectedTime('');
    setSelectedDoctor('');
    setSelectedService('');
    setReason('');
    setIsUrgent(false);
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return selectedService && selectedDoctor;
      case 2:
        return selectedDate && selectedTime;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Type of Service *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                What type of appointment do you need?
              </p>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold">Choose Doctor *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select your preferred healthcare provider
              </p>
              <div className="grid gap-3">
                {doctors.map((doctor) => (
                  <Card 
                    key={doctor.id} 
                    className={`cursor-pointer transition-all ${
                      selectedDoctor === doctor.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedDoctor(doctor.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{doctor.name}</h4>
                          <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Next available</p>
                          <p className="text-sm font-medium text-primary">{doctor.nextAvailable}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Select Date *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose your preferred appointment date
              </p>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md border"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Select Time *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Available time slots for {selectedDate?.toDateString()}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTime(time)}
                    className="justify-center"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold">Reason for Visit</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Please describe your symptoms or reason for the appointment
              </p>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your symptoms, concerns, or reason for visit..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="urgent"
                checked={isUrgent}
                onCheckedChange={(checked) => setIsUrgent(checked === true)}
              />
              <Label htmlFor="urgent" className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <span>This is an urgent medical matter</span>
              </Label>
            </div>

            {isUrgent && (
              <Card className="border-warning/50 bg-warning/5">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Urgent Care Notice</p>
                      <p className="text-sm text-muted-foreground">
                        For immediate medical emergencies, please call 911 or visit our Emergency Department. 
                        Urgent appointments will be prioritized and you may be contacted sooner.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appointment Summary */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">Appointment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{selectedService}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor:</span>
                  <span className="font-medium">
                    {doctors.find(d => d.id === selectedDoctor)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{selectedDate?.toDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Book an Appointment
              </h1>
              <p className="text-muted-foreground">
                Schedule your visit with our healthcare professionals
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  } transition-colors`}>
                    {currentStep > step ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="font-medium">{step}</span>
                    )}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 mx-2 ${
                      currentStep > step ? 'bg-primary' : 'bg-muted'
                    } transition-colors`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Step Labels */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-8 text-sm">
                <span className={currentStep >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  Select Service & Doctor
                </span>
                <span className={currentStep >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  Choose Date & Time
                </span>
                <span className={currentStep >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                  Review & Confirm
                </span>
              </div>
            </div>

            {/* Main Content */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {currentStep === 1 && <User className="w-5 h-5" />}
                  {currentStep === 2 && <CalendarIcon className="w-5 h-5" />}
                  {currentStep === 3 && <Check className="w-5 h-5" />}
                  <span>
                    Step {currentStep}: {
                      currentStep === 1 ? 'Select Service & Doctor' :
                      currentStep === 2 ? 'Choose Date & Time' :
                      'Review & Confirm'
                    }
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
                
                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 mt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button
                      onClick={nextStep}
                      disabled={!isStepComplete(currentStep)}
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit}>
                      <Heart className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default AppointmentBookingPage;