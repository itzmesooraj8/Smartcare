import { useEffect, useState, useCallback } from 'react';
import { subscribeToAppointments, RealtimeAppointment } from '@/lib/realtime';
import { format, subDays } from 'date-fns';
import { getAppointments, apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export interface UIAppointment {
  id: string;
  title: string;
  doctor: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  mode: 'video' | 'clinic';
}

const INITIAL_APPOINTMENTS: UIAppointment[] = [
  { id: 'a1', title: 'Follow-up consult', doctor: 'Dr. Helena Ward', date: format(new Date(), 'yyyy-MM-dd'), time: '09:30', status: 'confirmed', mode: 'video' },
  { id: 'a2', title: 'Orthopedic review', doctor: 'Dr. Marcus Lee', date: format(subDays(new Date(), -2), 'yyyy-MM-dd'), time: '12:15', status: 'pending', mode: 'clinic' },
  { id: 'a3', title: 'Dermatology check', doctor: 'Dr. Priya Shah', date: format(subDays(new Date(), -5), 'yyyy-MM-dd'), time: '16:00', status: 'cancelled', mode: 'video' },
  { id: 'a4', title: 'Cardio consult', doctor: 'Dr. Helena Ward', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), time: '11:00', status: 'completed', mode: 'video' },
  { id: 'a5', title: 'General care review', doctor: 'Dr. Alan Rivera', date: format(subDays(new Date(), -9), 'yyyy-MM-dd'), time: '14:40', status: 'confirmed', mode: 'clinic' },
];

export function useRealtimeAppointments() {
  const [appointments, setAppointments] = useState<UIAppointment[]>(INITIAL_APPOINTMENTS);
  const [isLive, setIsLive] = useState(false);

  // Load appointments from FastAPI API layer
  useEffect(() => {
    let mounted = true;
    async function fetchDBAppointments() {
      try {
        const data = await getAppointments();
        if (data && data.length > 0 && mounted) {
          const mapped: UIAppointment[] = data.map((d: any) => {
            const dt = new Date(d.appointment_time);
            return {
              id: d.id,
              title: d.reason || 'General Consultation',
              doctor: 'Dr. SmartCare Specialist',
              date: format(dt, 'yyyy-MM-dd'),
              time: format(dt, 'HH:mm'),
              status: (d.status === 'booked' ? 'pending' : d.status) as any,
              mode: 'video',
            };
          });
          setAppointments(mapped);
        }
      } catch {
        // Fallback to initial appointments
      }
    }

    void fetchDBAppointments();
    return () => {
      mounted = false;
    };
  }, []);

  // Subscribe to Realtime Postgres Changes & Broadcasts
  useEffect(() => {
    setIsLive(true);
    const channel = subscribeToAppointments(
      // Realtime gateway delivers authorized appointment changes.
      (newApt: RealtimeAppointment) => {
        try {
          const dt = new Date(newApt.appointment_time || new Date());
          const uiApt: UIAppointment = {
            id: newApt.id,
            title: newApt.reason || 'New Consultation',
            doctor: newApt.doctor_name || 'Assigned Specialist',
            date: format(dt, 'yyyy-MM-dd'),
            time: format(dt, 'HH:mm'),
            status: (newApt.status === 'booked' ? 'pending' : newApt.status) as any,
            mode: 'video',
          };
          setAppointments((prev) => [uiApt, ...prev.filter((a) => a.id !== uiApt.id)]);
          toast.success('Realtime Update: New appointment received!', {
            description: `${uiApt.title} on ${uiApt.date} at ${uiApt.time}`,
          });
        } catch (e) {
          console.error(e);
        }
      },
      // On Update
      (updatedApt: RealtimeAppointment) => {
        try {
          setAppointments((prev) =>
            prev.map((item) => {
              if (item.id === updatedApt.id) {
                const dt = updatedApt.appointment_time ? new Date(updatedApt.appointment_time) : null;
                return {
                  ...item,
                  status: (updatedApt.status === 'booked' ? 'pending' : updatedApt.status) as any,
                  date: dt ? format(dt, 'yyyy-MM-dd') : item.date,
                  time: dt ? format(dt, 'HH:mm') : item.time,
                };
              }
              return item;
            })
          );
          toast.info(`Appointment status updated to ${updatedApt.status}`);
        } catch (e) {
          console.error(e);
        }
      },
      // On Delete
      (deleted) => {
        setAppointments((prev) => prev.filter((item) => item.id !== deleted.id));
        toast.info('An appointment was cancelled.');
      }
    );

    return () => {
      channel.unsubscribe();
      setIsLive(false);
    };
  }, []);

  const updateStatus = useCallback(async (id: string, newStatus: UIAppointment['status']) => {
    try {
      await apiFetch.patch(`/appointments/${id}`, { status: newStatus === 'pending' ? 'booked' : newStatus });
    } catch {
      toast.error('Unable to update the appointment.');
    }
  }, []);

  return { appointments, isLive, updateStatus };
}
