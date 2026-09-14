const API_URL = 'http://10.0.0.77:3000';

export async function getQuranChapters() {
  const response = await fetch(`${API_URL}/api/quran/chapters`);

  if (!response.ok) {
    throw new Error('Could not fetch Quran chapters');
  }

  return response.json();
}

export async function getSurahVerses(id:number) {
  const response = await fetch(
    `${API_URL}/api/quran/chapters/${id}/verses`
  );

  if (!response.ok) {
    throw new Error('Could not fetch Surah verses');
  }

  return response.json();
}

export async function getVerseAudio(verseKey:string,reciterId='7') {
  const response = await fetch(
    `${API_URL}/api/quran/verses/${verseKey}/audio?reciter=${reciterId}`
  );

  if (!response.ok)
    throw new Error('Could not fetch verse audio');

  const data = await response.json();
  const audio = data.audioFiles?.[0];

  if (!audio) return undefined;

  if (audio.url?.startsWith('//'))
    return `https:${audio.url}`;

  return audio.audioUrl ?? audio.url;
}

export async function getRecitations() {
  const response = await fetch(`${API_URL}/api/quran/recitations`);

  if (!response.ok)
    throw new Error('Could not fetch reciters');

  return response.json();
}