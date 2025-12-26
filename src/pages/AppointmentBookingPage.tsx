import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, User, ArrowRight, Check, Heart, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { bookAppointment, getDoctors } from '@/lib/api'; // ✅ Used centralized API
import { useNavigate } from 'react-router-dom';

const AppointmentBookingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Local state for form
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    service: '',
    doctor: '',
    date: '',
    time: '',
    reason: '',
    urgent: false
  });

  const [doctors, setDoctors] = useState<Array<any>>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState<string | null>(null); // ✅ Added Error State
  
  // Ref to prevent state updates on unmounted component
  const mountedRef = useRef(true);

  const fetchDoctors = async () => {
    setError(null);
    setLoadingDoctors(true);
    try {
      const data = await getDoctors(); // ✅ Using centralized function
      if (!mountedRef.current) return;
      setDoctors(data || []);
      // Auto-select first doctor if available
      if (data && data.length > 0) {
        setFormData((s) => ({ ...s, doctor: data[0].id?.toString() }));
      }
    } catch (err: any) {
      console.error('Could not fetch doctors', err);
      if (!mountedRef.current) return;
      setError('Failed to load doctors. Please try again.');
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to fetch doctors list.' 
      });
    } finally {
      if (mountedRef.current) setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void fetchDoctors();
    return () => { mountedRef.current = false; };
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(c => c + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const doctorId = Number(formData.doctor);
      if (!doctorId) throw new Error('Please select a doctor');
      if (!formData.date || !formData.time) throw new Error('Please select date and time');
      
      const appointmentTime = new Date(`${formData.date}T${formData.time}`);
      const payload = {
        doctor_id: doctorId,
        appointment_time: appointmentTime.toISOString(),
        reason: formData.reason || undefined,
        type: formData.service === 'Emergency' ? 'in-person' : 'video',
      };

      await bookAppointment(payload as any);
      toast({ title: 'Success', description: 'Appointment booked successfully' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Booking failed' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Book an Appointment</h1>
            <p className="text-gray-500 mb-8">Schedule a visit with our specialists.</p>

            {/* Steps Indicator */}
            <div className="flex items-center justify-center mb-8 space-x-4">
               {[1, 2, 3].map(step => (
                 <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                   {step}
                 </div>
               ))}
            </div>

            {/* Form Content */}
            <div className="bg-white rounded-lg shadow p-6 border">
              <form onSubmit={handleSubmit}>
                
                {/* Step 1: Service & Doctor */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Select Service & Doctor</h2>
                    <div>
                      <label className="block text-sm font-medium mb-1">Service Type</label>
                      <select 
                        className="w-full border p-2 rounded"
                        value={formData.service}
                        onChange={(e) => handleInputChange('service', e.target.value)}
                      >
                        <option value="">Select a service...</option>
                        <option value="General">General Consultation</option>
                        <option value="Specialist">Specialist</option>
                        <option value="Emergency">Emergency</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Doctor</label>
                      <div className="grid gap-3">
                          {loadingDoctors ? (
                            <div className="h-10 w-full animate-pulse rounded bg-gray-200" />
                          ) : error ? (
                            // ✅ Error UI with Retry Button
                            <div className="p-4 rounded bg-red-50 border border-red-200 text-red-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <AlertCircle size={20} />
                                <span>{error}</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => void fetchDoctors()} 
                                className="px-3 py-1 bg-white border border-red-300 rounded text-sm hover:bg-red-50"
                              >
                                Retry
                              </button>
                            </div>
                          ) : doctors.length === 0 ? (
                            <div className="p-4 rounded bg-gray-50 border text-gray-500 text-center">
                              No doctors available at the moment.
                            </div>
                          ) : (
                            doctors.map((d) => (
                              <div 
                                key={d.id}
                                onClick={() => handleInputChange('doctor', d.id?.toString())}
                                className={`p-3 border rounded cursor-pointer hover:bg-indigo-50 ${formData.doctor === d.id?.toString() ? 'border-indigo-600 bg-indigo-50' : ''}`}
                              >
                                <div className="font-medium">{d.full_name} — {d.specialization}</div>
                              </div>
                            ))
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Date & Time */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Choose Date & Time</h2>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date</label>
                      <input 
                        type="date" 
                        className="w-full border p-2 rounded"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Time</label>
                      <select 
                        className="w-full border p-2 rounded"
                        value={formData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                      >
                        <option value="">Select time...</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Confirm Booking</h2>
                    <div className="bg-gray-50 p-4 rounded text-sm space-y-2">
                      <p><strong>Service:</strong> {formData.service}</p>
                      <p><strong>Doctor:</strong> {doctors.find(d => d.id?.toString() === formData.doctor)?.full_name || 'Selected Doctor'}</p>
                      <p><strong>Date:</strong> {formData.date} at {formData.time}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
                      <textarea 
                        className="w-full border p-2 rounded"
                        value={formData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-4 border-t">
                  {currentStep > 1 ? (
                    <button type="button" onClick={prevStep} className="px-4 py-2 border rounded">Back</button>
                  ) : <div></div>}
                  
                  {currentStep < 3 ? (
                    <button type="button" onClick={nextStep} className="px-4 py-2 bg-indigo-600 text-white rounded">Next</button>
                  ) : (
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Book Appointment</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AppointmentBookingPage;