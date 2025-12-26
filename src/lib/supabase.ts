import { createClient } from '@supabase/supabase-js';

const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

let _supabase: any = null;
if (url && anonKey) {
	_supabase = createClient(url, anonKey, { auth: { persistSession: false } });
} else {
	// lightweight stub that surfaces a clear error when used in dev without env
	_supabase = {
		storage: {
			from: (_bucket: string) => ({
				async upload() { return { error: new Error('Supabase storage not configured (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY missing)') }; },
				async createSignedUrl() { return { error: new Error('Supabase storage not configured (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY missing)') }; },
			}),
		},
	};
}

export const supabase = _supabase;
export default _supabase;
