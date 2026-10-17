import Constants from 'expo-constants';
import { auth } from './firebase';

// Same host-detection trick as quranApi.ts and hadithApi.ts — see there for why.
function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } }).manifest2?.extra
      ?.expoClient?.hostUri;

  const host = hostUri?.split(':')[0];
  if (host && host !== '') return `http://${host}:3000`;

  return 'http://localhost:3000';
}

const API_URL = resolveApiUrl();

export type ChatTurn = { role: 'user' | 'assistant'; text: string };

export async function askAi(message: string, history: ChatTurn[] = []): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to use the AI.');
  if (!__DEV__ && !API_URL.startsWith('https://')) {
    throw new Error('A secure AI connection is not configured.');
  }

  // Firebase refreshes expired tokens automatically; never persist a separate token copy.
  const token = await user.getIdToken();
  const response = await fetch(`${API_URL}/api/ai/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message, history }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? 'Could not get a response from the AI right now');
  }

  if (typeof data?.reply !== 'string') {
    throw new Error('AI response was empty');
  }

  return data.reply;
}
