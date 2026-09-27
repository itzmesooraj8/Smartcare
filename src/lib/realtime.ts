import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealtimeAppointment {
  id: string;
  doctor_id?: string;
  patient_id: string;
  appointment_time: string;
  status: 'booked' | 'confirmed' | 'cancelled' | 'completed' | 'pending';
  reason?: string;
  doctor_name?: string;
  patient_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RealtimeMessage {
  id: string;
  sender_id: string;
  receiver_id?: string;
  room_id?: string;
  text: string;
  sender_name?: string;
  created_at: string;
}

/**
 * Subscribes to Realtime Appointment updates (INSERT, UPDATE, DELETE).
 */
export function subscribeToAppointments(
  onInsert?: (apt: RealtimeAppointment) => void,
  onUpdate?: (apt: RealtimeAppointment) => void,
  onDelete?: (oldApt: { id: string }) => void
): RealtimeChannel {
  const channel = supabase
    .channel('realtime:appointments')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'appointments' },
      (payload) => {
        if (onInsert) onInsert(payload.new as RealtimeAppointment);
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'appointments' },
      (payload) => {
        if (onUpdate) onUpdate(payload.new as RealtimeAppointment);
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'appointments' },
      (payload) => {
        if (onDelete) onDelete(payload.old as { id: string });
      }
    )
    .on('broadcast', { event: 'appointment_update' }, (payload) => {
      if (onUpdate && payload.payload) onUpdate(payload.payload as RealtimeAppointment);
    })
    .subscribe();

  return channel;
}

/**
 * Broadcasts an appointment update to all connected clients immediately.
 */
export async function broadcastAppointmentUpdate(appointment: RealtimeAppointment) {
  try {
    const channel = supabase.channel('realtime:appointments');
    await channel.send({
      type: 'broadcast',
      event: 'appointment_update',
      payload: appointment,
    });
  } catch (err) {
    console.warn('Realtime appointment broadcast warning:', err);
  }
}

/**
 * Subscribes to Realtime Chat Messages for a specific room or user.
 */
export function subscribeToMessages(
  roomId: string,
  onMessageReceived: (msg: RealtimeMessage) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: roomId ? `room_id=eq.${roomId}` : undefined,
      },
      (payload) => {
        onMessageReceived(payload.new as RealtimeMessage);
      }
    )
    .on('broadcast', { event: 'new_message' }, (payload) => {
      if (payload.payload) {
        onMessageReceived(payload.payload as RealtimeMessage);
      }
    })
    .subscribe();

  return channel;
}

/**
 * Sends a realtime message via Supabase broadcast and persists to DB if table exists.
 */
export async function sendRealtimeMessage(
  roomId: string,
  message: {
    sender_id: string;
    text: string;
    sender_name?: string;
    receiver_id?: string;
  }
): Promise<RealtimeMessage> {
  const fullMessage: RealtimeMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    sender_id: message.sender_id,
    receiver_id: message.receiver_id,
    room_id: roomId,
    text: message.text,
    sender_name: message.sender_name,
    created_at: new Date().toISOString(),
  };

  // 1. Broadcast immediately for instant UI delivery
  try {
    const channel = supabase.channel(`room:${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: fullMessage,
    });
  } catch (err) {
    console.warn('Broadcast send error:', err);
  }

  // 2. Persist to Supabase messages table asynchronously
  try {
    await supabase.from('messages').insert({
      id: fullMessage.id,
      sender_id: fullMessage.sender_id,
      receiver_id: fullMessage.receiver_id || fullMessage.sender_id,
      room_id: roomId,
      text: fullMessage.text,
      created_at: fullMessage.created_at,
    });
  } catch {
    // If table not yet populated, broadcast still succeeded
  }

  return fullMessage;
}

/**
 * Synchronizes presence for Waiting Room and Consultations.
 */
export function joinConsultationRoom(
  roomId: string,
  user: { id: string; name: string; role: 'patient' | 'doctor' },
  onPresenceChange: (presenceUsers: any[]) => void
): RealtimeChannel {
  const channel = supabase.channel(`consultation:${roomId}`, {
    config: {
      presence: {
        key: user.id,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.values(state).flat();
      onPresenceChange(users);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          id: user.id,
          name: user.name,
          role: user.role,
          onlineAt: new Date().toISOString(),
        });
      }
    });

  return channel;
}
