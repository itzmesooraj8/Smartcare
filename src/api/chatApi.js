// Compatibility shim: proxy legacy sendMessageToAI to the central apiFetch helper.
import { apiFetch } from '@/lib/api';

export async function sendMessageToAI(message) {
  // Route through central apiFetch which uses withCredentials and HttpOnly cookies.
  const res = await apiFetch({ path: '/chat', method: 'POST', body: { message } });
  return res;
}

// Deprecated fallback to prevent other legacy calls
export function deprecatedChatApi() {
  throw new Error('Deprecated: use src/lib/api.ts apiFetch instead');
}
