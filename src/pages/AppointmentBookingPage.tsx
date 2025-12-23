import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, User, ArrowRight, Check, Heart, AlertCircle } from 'lucide-react';

const AppointmentBookingPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const doctors = [
    { id: '1', name: 'Dr. Sarah Johnson', specialty: 'Cardiology', nextAvailable: 'Tomorrow' },
    { id: '2', name: 'Dr. Michael Chen', specialty: 'Emergency Medicine', nextAvailable: 'Today' },
    { id: '3', name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics', nextAvailable: 'Friday' },
    { id: '4', name: 'Dr. James Wilson', specialty: 'Orthopedics', nextAvailable: 'Monday' },
    { id: '5', name: 'Dr. Lisa Park', specialty: 'Dermatology', nextAvailable: 'Thursday' },
  ];

  const services = [
    'General Consultation',
    'Follow-up Visit',
    'Preventive Care',
    'Specialist Consultation',
    'Diagnostic Testing',
    'Procedure/Treatment',
    'Emergency Care',
    'Other',
  ];

  const timeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
    '4:00 PM', '4:30 PM', '5:00 PM'
  ];

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  const validateStep = (step: number) => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!selectedService) e.service = 'Please select a service';
      if (!selectedDoctor) e.doctor = 'Please select a doctor';
    }
    if (step === 2) {
      if (!selectedDate) e.date = 'Please select a date';
      if (!selectedTime) e.time = 'Please select a time';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((s) => Math.min(3, s + 1));
  };

  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  const submitBooking = async () => {
    // Basic validation before final submit
    if (!validateStep(1) || !validateStep(2)) return setCurrentStep(1);
    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise((res) => setTimeout(res, 900));
      setSuccessMessage('Appointment booked successfully');
      // Reset form (but keep selections visible)
      setSubmitting(false);
      setCurrentStep(1);
    } catch (err) {
      setSubmitting(false);
      setErrors({ submit: 'Unable to book appointment at this time' });
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Type of Service *</label>
            <select
              className="border p-2 rounded w-full"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              <option value="">Select service type</option>
              {services.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.service && <p className="text-sm text-red-500 mt-1">{errors.service}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Choose Doctor *</label>
            <div className="grid gap-3">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedDoctor(doc.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedDoctor(doc.id); }}
                  className={`cursor-pointer p-4 border rounded transition-all ${selectedDoctor === doc.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{doc.name}</h4>
                      <p className="text-sm text-gray-500">{doc.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Next available</p>
                      <p className="text-sm font-medium text-indigo-600">{doc.nextAvailable}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.doctor && <p className="text-sm text-red-500 mt-1">{errors.doctor}</p>}
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={nextStep} className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={!selectedService || !selectedDoctor}>Save & Continue</button>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-base font-semibold mb-2">Select Date *</label>
            <input
              type="date"
              className="border p-2 rounded"
              value={selectedDate ? new Date(selectedDate).toISOString().slice(0, 10) : ''}
              onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : undefined)}
              min={new Date().toISOString().slice(0, 10)}
            />
            {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div>
            <label className="block text-base font-semibold mb-2">Select Time *</label>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((t) => (
                <button key={t} type="button" onClick={() => setSelectedTime(t)} className={`px-3 py-2 rounded text-sm border ${selectedTime === t ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{t}</button>
              ))}
            </div>
            {errors.time && <p className="text-sm text-red-500 mt-1">{errors.time}</p>}
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={prevStep} className="px-4 py-2 border rounded">Previous</button>
            <button type="button" onClick={nextStep} className="px-4 py-2 bg-indigo-600 text-white rounded">Next Step</button>
          </div>
        </div>
      );
    }

    // step 3
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Reason for Visit</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Describe your symptoms, concerns, or reason for visit..." rows={4} className="border p-2 rounded w-full" />
        </div>

        <div className="flex items-center space-x-2">
          <input id="urgent" type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
          <label htmlFor="urgent" className="flex items-center space-x-2"><AlertCircle className="w-4 h-4 text-yellow-500" /><span>This is an urgent medical matter</span></label>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={submitBooking} className="bg-green-600 text-white px-4 py-2 rounded" disabled={submitting}>{submitting ? 'Booking...' : 'Confirm Booking'}</button>
        </div>

        {urgent && (
          <div className="border-yellow-200 bg-yellow-50 p-4 rounded">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-700">Urgent Care Notice</p>
                <p className="text-sm text-gray-600">For immediate medical emergencies, please call 911 or visit our Emergency Department. Urgent appointments will be prioritized and you may be contacted sooner.</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded">
          <div className="text-lg font-medium mb-2">Appointment Summary</div>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Service:</span><span className="font-medium">{selectedService}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Doctor:</span><span className="font-medium">{doctors.find(d => d.id === selectedDoctor)?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium">{selectedDate?.toDateString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Time:</span><span className="font-medium">{selectedTime}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Notes:</span><span className="font-medium">{reason || '—'}</span></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book an Appointment</h1>
          <p className="text-gray-600">Schedule your visit with our healthcare professionals</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          {[1,2,3].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'} transition-colors`}>
                {currentStep > step ? <Check className="w-5 h-5" /> : <span className="font-medium">{step}</span>}
              </div>
              {step < 3 && <div className={`w-16 h-1 mx-2 ${currentStep > step ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="mb-8 flex justify-center space-x-8 text-sm">
          <span className={currentStep >= 1 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Select Service & Doctor</span>
          <span className={currentStep >= 2 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Choose Date & Time</span>
          <span className={currentStep >= 3 ? 'text-indigo-600 font-medium' : 'text-gray-500'}>Review & Confirm</span>
        </div>

        <div className="shadow-card bg-white rounded p-4">
          <div className="p-4 border-b mb-4">
            <div className="flex items-center space-x-2">
              {currentStep === 1 && <User className="w-5 h-5" />}
              {currentStep === 2 && <CalendarIcon className="w-5 h-5" />}
              {currentStep === 3 && <Check className="w-5 h-5" />}
              <span>Step {currentStep}: {currentStep === 1 ? 'Select Service & Doctor' : currentStep === 2 ? 'Choose Date & Time' : 'Review & Confirm'}</span>
            </div>
          </div>

          {successMessage && <div className="mb-4 p-2 bg-green-100 text-green-800 rounded">{successMessage}</div>}

          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingPage;
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, User, ArrowRight, Check, Heart, AlertCircle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBookAppointment } from '@/hooks/useAppointments';

const AppointmentBookingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const book = useBookAppointment();

  const schema = z.object({
    service: z.string().min(1, 'Please select a service'),
    consultType: z.enum(['video', 'audio', 'chat']).optional(),
    doctorId: z.string().min(1, 'Please select a doctor'),
    date: z.date(),
    time: z.string().min(1, 'Please select a time'),
    reason: z.string().optional(),
    urgent: z.boolean().optional(),
  });

  type FormValues = z.infer<typeof schema>;

  const { register, control, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      service: selectedService,
      doctorId: selectedDoctor,
      date: selectedDate ?? new Date(),
      time: selectedTime,
      reason: '',
      urgent: false,
    },
  });
  const { register: registerFn, watch } = { register } as any;
  const isUrgent = watch ? watch('urgent') : false;
  const [currentStep, setCurrentStep] = useState(1);
  const [visitType, setVisitType] = useState<'in-person' | 'video'>();
  const [consultType, setConsultType] = useState<'video' | 'audio' | 'chat' | undefined>(undefined);
  const navigate = window.location ? (window.location.pathname ? null : null) : null;

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

  const onSubmit = async (values: FormValues) => {
    try {
      await book.mutateAsync({
        patientId: user?.id ?? 'me',
        doctorId: values.doctorId,
        service: values.service,
        date: values.date.toISOString(),
        time: values.time,
        reason: values.reason,
        urgent: values.urgent,
      });
      toast({ title: 'Appointment booked', description: 'Your appointment was scheduled.' });
    } catch (e: unknown) {
      toast({ title: 'Booking failed', description: e instanceof Error ? e.message : 'Unable to book', variant: 'destructive' });
    }
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Type of Service *</label>
                <select
                  className="border p-2 rounded w-full"
                  value={selectedService}
                  onChange={(e) => { const v = e.target.value; setSelectedService(v); setValue('service', v); }}
                >
                  <option value="">Select service type</option>
                  {services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
                {errors.service && <p className="text-sm text-red-500 mt-1">{errors.service.message as string}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Consultation Type</label>
                <select
                  className="border p-2 rounded w-full"
                  onChange={(e) => setValue('consultType', e.target.value as any)}
                >
                  <option value="">Select consultation type</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="chat">Chat</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Choose Doctor *</label>
                <div className="grid gap-3">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => { setSelectedDoctor(doctor.id); setValue('doctorId', doctor.id); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedDoctor(doctor.id); setValue('doctorId', doctor.id); } }}
                      className={`cursor-pointer p-4 border rounded transition-all ${
                        selectedDoctor === doctor.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{doctor.name}</h4>
                          <p className="text-sm text-gray-500">{doctor.specialty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Next available</p>
                          <p className="text-sm font-medium text-indigo-600">{doctor.nextAvailable}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={!selectedService || !selectedDoctor}>Save & Continue</button>
              </div>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="text-base font-semibold block mb-2">Select Date *</label>
              <p className="text-sm text-gray-500 mb-3">Choose your preferred appointment date</p>
              <div className="flex justify-center">
                <Controller
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <input
                      type="date"
                      className="border p-2 rounded"
                      value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ''}
                      onChange={(e) => { const d = e.target.value ? new Date(e.target.value) : undefined; field.onChange(d); setSelectedDate(d); }}
                      min={new Date().toISOString().slice(0, 10)}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <label className="text-base font-semibold block mb-2">Select Time *</label>
              <p className="text-sm text-gray-500 mb-3">Available time slots for {selectedDate?.toDateString()}</p>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => { setSelectedTime(time); setValue('time', time); }}
                    className={`px-3 py-2 rounded text-sm border ${selectedTime === time ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Reason for Visit</label>
                <textarea
                  {...register('reason')}
                  placeholder="Describe your symptoms, concerns, or reason for visit..."
                  rows={4}
                  className="border p-2 rounded w-full"
                />
                {errors.reason && <p className="text-sm text-red-500 mt-1">{errors.reason.message as string}</p>}
              </div>

              <div className="flex items-center space-x-2">
                <input id="urgent" type="checkbox" {...register('urgent')} />
                <label htmlFor="urgent" className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>This is an urgent medical matter</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                  <Check className="mr-2 h-4 w-4 inline" /> Confirm Booking
                </button>
              </div>
            </form>

            {isUrgent && (
              <div className="border-yellow-200 bg-yellow-50 p-4 rounded">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700">Urgent Care Notice</p>
                    <p className="text-sm text-gray-600">
                      For immediate medical emergencies, please call 911 or visit our Emergency Department. Urgent appointments will be prioritized and you may be contacted sooner.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Appointment Summary */}
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-lg font-medium mb-2">Appointment Summary</div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-medium">{selectedService}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Doctor:</span>
                  <span className="font-medium">{doctors.find(d => d.id === selectedDoctor)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{selectedDate?.toDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Patient:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
              </div>
            </div>
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
            <div className="shadow-card bg-white rounded">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
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
                </div>
              </div>
              <div className="p-4">
                {renderStepContent()}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 mt-6 border-t">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="px-4 py-2 border rounded bg-white"
                  >
                    Previous
                  </button>
                  
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepComplete(currentStep)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded"
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4 inline" />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit(onSubmit)} className="px-4 py-2 bg-pink-600 text-white rounded">
                      <Heart className="mr-2 h-4 w-4 inline" />
                      Book Appointment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default AppointmentBookingPage;