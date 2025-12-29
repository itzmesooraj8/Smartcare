// Compatibility shim: proxy legacy sendMessageToAI to the central apiFetch helper.
import { apiFetch } from '@/lib/api';

export async function sendMessageToAI(messageOrMessages) {
  // Accept either a single message string or an array of messages for context.
  const body = Array.isArray(messageOrMessages) ? { messages: messageOrMessages } : { messages: [ { role: 'user', content: messageOrMessages } ] };
  const res = await apiFetch({ path: '/chat', method: 'POST', body });
  return res;
}

// Deprecated fallback to prevent other legacy calls
export function deprecatedChatApi() {
  throw new Error('Deprecated: use src/lib/api.ts apiFetch instead');
}
