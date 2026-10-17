import Constants from 'expo-constants';

// Same host-detection trick as quranApi.ts — see there for why.
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

export type HadithCollection = { key: string; name: string };
export type HadithSection = { number: number; title: string; hadithCount: number; firstHadith: number; lastHadith: number };
export type HadithItem = { hadithnumber: number; arabicnumber?: number | string; text: string; grades: unknown[]; reference: { book: number; hadith: number } };
export type HadithSectionDetail = { number: number; title: string; hadiths: HadithItem[] };

export type HadithHit = { collection: string; collectionName: string; number: number; section: number; excerpt: string };
export type HadithSearchResult = { query: string; total: number; results: HadithHit[] };

export async function searchHadith(query: string): Promise<HadithSearchResult> {
  const response = await fetch(`${API_URL}/api/hadith/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Could not search Hadith');
  return response.json();
}

export async function getHadithCollections(): Promise<HadithCollection[]> {
  const response = await fetch(`${API_URL}/api/hadith/collections`);
  if (!response.ok) throw new Error('Could not fetch Hadith collections');
  return response.json();
}

export async function getHadithSections(collection: string): Promise<HadithSection[]> {
  const response = await fetch(`${API_URL}/api/hadith/${collection}/sections`);
  if (!response.ok) throw new Error('Could not fetch Hadith sections');
  return response.json();
}

export async function getHadithSection(collection: string, sectionNumber: number): Promise<HadithSectionDetail> {
  const response = await fetch(`${API_URL}/api/hadith/${collection}/sections/${sectionNumber}`);
  if (!response.ok) throw new Error('Could not fetch Hadith section');
  return response.json();
}
