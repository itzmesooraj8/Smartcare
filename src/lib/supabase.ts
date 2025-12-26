import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
	// Export a stub that throws so missing env is obvious during development
	export function supabaseUnavailable() {
		throw new Error('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not configured');
	}
	export default supabaseUnavailable;
} else {
	const supabase: SupabaseClient = createClient(url, anonKey, {
		auth: { persistSession: false },
	});
	export { supabase };
	export default supabase;
}
