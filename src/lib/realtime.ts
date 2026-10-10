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

type SocketListener<T> = (value: T) => void;

class SmartCareRealtime {
  private socket: WebSocket | null = null;
  private listeners = new Map<string, Set<SocketListener<any>>>();
  private reconnectTimer: number | null = null;
  private stopped = false;
  private reconnectAttempt = 0;

  private endpoint(): string {
    const configured = import.meta.env.VITE_API_URL || 'https://smartcare-zflo.onrender.com/api/v1';
    const api = configured.replace(/\/$/, '');
    const origin = api.replace(/\/api\/v1$/, '');
    return origin.replace(/^http/, 'ws') + '/ws/realtime';
  }

  private ensureSocket() {
    if (this.stopped || this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const socket = new WebSocket(this.endpoint());
    this.socket = socket;

    socket.onopen = () => {
      this.reconnectAttempt = 0;
      this.emit('connection', { event: 'connected' });
    };

    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data);
        this.emit(event.type || 'unknown', event);
        if (event.type === 'appointment') this.emit('appointment', event.data);
        if (event.type === 'message') this.emit('message', event.data);
        if (event.type === 'presence') this.emit('presence', event);
      } catch {
        // Ignore malformed server frames.
      }
    };

    socket.onclose = () => {
      if (this.socket === socket) this.socket = null;
      this.scheduleReconnect();
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer !== null) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 15000);
    this.reconnectAttempt += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.ensureSocket();
    }, delay);
  }

  private emit(type: string, value: any) {
    for (const listener of this.listeners.get(type) || []) listener(value);
  }

  subscribe<T>(type: string, listener: SocketListener<T>): () => void {
    this.stopped = false;
    const set = this.listeners.get(type) || new Set();
    set.add(listener);
    this.listeners.set(type, set);
    this.ensureSocket();

    return () => {
      set.delete(listener);
      if (!set.size) this.listeners.delete(type);
      if (!this.listeners.size) this.close();
    };
  }

  sendControl(type: 'subscribe_appointments' | 'subscribe_messages' | 'join_presence') {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type }));
    }
  }

  close() {
    this.stopped = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
  }
}

const realtime = new SmartCareRealtime();

export function subscribeToAppointments(
  onInsert?: (apt: RealtimeAppointment) => void,
  onUpdate?: (apt: RealtimeAppointment) => void,
  onDelete?: (oldApt: { id: string }) => void
) {
  const unsubscribe = realtime.subscribe<RealtimeAppointment>('appointment', (apt) => {
    if (apt.status === 'cancelled') onDelete?.({ id: apt.id });
    else onUpdate?.(apt);
  });
  realtime.sendControl('subscribe_appointments');
  return {
    unsubscribe,
  };
}

export function subscribeToMessages(
  roomId: string,
  onMessageReceived: (msg: RealtimeMessage) => void
) {
  const unsubscribe = realtime.subscribe<RealtimeMessage>('message', (msg) => {
    if (!msg.room_id || msg.room_id === roomId) onMessageReceived(msg);
  });
  realtime.sendControl('subscribe_messages');
  return { unsubscribe };
}

export function sendRealtimeMessage(
  _roomId: string,
  _message: {
    sender_id: string;
    text: string;
    sender_name?: string;
    receiver_id?: string;
  }
): Promise<RealtimeMessage> {
  return Promise.reject(
    new Error('Realtime messages must be persisted through the authenticated messaging API.')
  );
}

export function broadcastAppointmentUpdate(_appointment: RealtimeAppointment): Promise<void> {
  return Promise.reject(
    new Error('Appointment mutations must use the authenticated appointments API.')
  );
}

export function joinConsultationRoom(
  roomId: string,
  user: { id: string; name: string; role: 'patient' | 'doctor' },
  onPresenceChange: (presenceUsers: any[]) => void
) {
  const unsubscribe = realtime.subscribe<any>('presence', (event) => {
    if (event.room_id === roomId) onPresenceChange(event.data?.users || []);
  });
  realtime.sendControl('join_presence');
  return {
    unsubscribe,
    roomId,
    user,
  };
}
