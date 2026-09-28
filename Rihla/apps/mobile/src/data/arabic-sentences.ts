export type ArabicSentence = {
  id: number;
  sentence: string;
  // Broken into its two pieces (demonstrative + noun) for reading practice.
  parts: string[];
  transliteration: string;
  meaning: string;
};

// The classic first sentence pattern in almost every Arabic primer: "this is
// a ___", using the 12 nouns from the Words level. هَذَا (hādhā) is used for
// masculine nouns and هَذِهِ (hādhihi) for feminine ones — شَمْس and يَد are
// feminine even though they don't look it, so those two get the different
// pronoun on purpose, not by mistake.
export const arabicSentences: ArabicSentence[] = [
  { id: 1, sentence: 'هَذَا بَيْت', parts: ['هَذَا', 'بَيْت'], transliteration: 'hādhā bayt', meaning: 'This is a house' },
  { id: 2, sentence: 'هَذَا قَلَم', parts: ['هَذَا', 'قَلَم'], transliteration: 'hādhā qalam', meaning: 'This is a pen' },
  { id: 3, sentence: 'هَذَا كَلْب', parts: ['هَذَا', 'كَلْب'], transliteration: 'hādhā kalb', meaning: 'This is a dog' },
  { id: 4, sentence: 'هَذِهِ شَمْس', parts: ['هَذِهِ', 'شَمْس'], transliteration: 'hādhihi shams', meaning: 'This is the sun' },
  { id: 5, sentence: 'هَذَا نَجْم', parts: ['هَذَا', 'نَجْم'], transliteration: 'hādhā najm', meaning: 'This is a star' },
  { id: 6, sentence: 'هَذَا جَبَل', parts: ['هَذَا', 'جَبَل'], transliteration: 'hādhā jabal', meaning: 'This is a mountain' },
  { id: 7, sentence: 'هَذَا قَمَر', parts: ['هَذَا', 'قَمَر'], transliteration: 'hādhā qamar', meaning: 'This is the moon' },
  { id: 8, sentence: 'هَذَا سَمَك', parts: ['هَذَا', 'سَمَك'], transliteration: 'hādhā samak', meaning: 'This is a fish' },
  { id: 9, sentence: 'هَذَا عِلْم', parts: ['هَذَا', 'عِلْم'], transliteration: 'hādhā ilm', meaning: 'This is knowledge' },
  { id: 10, sentence: 'هَذَا رَجُل', parts: ['هَذَا', 'رَجُل'], transliteration: 'hādhā rajul', meaning: 'This is a man' },
  { id: 11, sentence: 'هَذَا وَجْه', parts: ['هَذَا', 'وَجْه'], transliteration: 'hādhā wajh', meaning: 'This is a face' },
  { id: 12, sentence: 'هَذِهِ يَد', parts: ['هَذِهِ', 'يَد'], transliteration: 'hādhihi yad', meaning: 'This is a hand' },
];
