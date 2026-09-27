import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback to active project credentials if Vite env variables are not yet injected
const DEFAULT_SUPABASE_URL = 'https://zgluklhdnnqsnnnylkxw.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnbHVrbGhkbm5xc25ubnlsa3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0ODc1MTEsImV4cCI6MjEwNjA2MzUxMX0.dChOAfOXT5VvpNaIpQaaztQIbmDwZ0I-xD-W6-7N_WU';

const url = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
