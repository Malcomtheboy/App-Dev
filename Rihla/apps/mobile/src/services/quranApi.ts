import Constants from 'expo-constants';

// Auto-detects the API host so this works out of the box on web, on a
// simulator, and on a physical device connected through Expo Go / a dev
// build — without anyone having to hardcode their machine's LAN IP.
//
// Priority:
// 1. EXPO_PUBLIC_API_URL, if set (e.g. for a deployed backend)
// 2. The host Metro is actually being served from (Constants.expoConfig.hostUri)
//    — this is already the correct LAN IP when testing on a physical device,
//    since that's how the phone reached the JS bundle in the first place.
// 3. localhost, as a safe fallback for web/simulator.
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

export async function getQuranChapters() {
  const response = await fetch(`${API_URL}/api/quran/chapters`);

  if (!response.ok) {
    throw new Error('Could not fetch Quran chapters');
  }

  return response.json();
}

export async function getSurahVerses(id: number) {
  const response = await fetch(`${API_URL}/api/quran/chapters/${id}/verses`);

  if (!response.ok) {
    throw new Error('Could not fetch Surah verses');
  }

  return response.json();
}

export async function getVerseAudio(verseKey: string, reciterId = '7') {
  const response = await fetch(`${API_URL}/api/quran/verses/${verseKey}/audio?reciter=${reciterId}`);

  if (!response.ok) throw new Error('Could not fetch verse audio');

  const data = await response.json();
  const audio = data.audioFiles?.[0];

  if (!audio) return undefined;

  if (audio.url?.startsWith('//')) return `https:${audio.url}`;

  return audio.audioUrl ?? audio.url;
}

export async function getRecitations() {
  const response = await fetch(`${API_URL}/api/quran/recitations`);

  if (!response.ok) throw new Error('Could not fetch reciters');

  return response.json();
}
