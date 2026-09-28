export type ArabicLetter = {
  id: number;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
  name: string;
  pronunciation: string;
};

// The 28 letters of the Arabic alphabet, in traditional order, with their four
// written forms. A handful (alif, dal, dhal, ra, zay, waw) never connect to the
// letter that follows, so their "initial" and "medial" forms match the isolated
// and final ones.
export const arabicLetters: ArabicLetter[] = [
  { id: 1, isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا', name: 'Alif', pronunciation: 'A long "aa" sound, as in "father".' },
  { id: 2, isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب', name: 'Ba', pronunciation: '"b" as in "ball".' },
  { id: 3, isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت', name: 'Ta', pronunciation: '"t" as in "top".' },
  { id: 4, isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث', name: 'Tha', pronunciation: '"th" as in "think".' },
  { id: 5, isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج', name: 'Jeem', pronunciation: '"j" as in "jam".' },
  { id: 6, isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح', name: 'Ha', pronunciation: 'A breathy "h", stronger than in English, from deep in the throat.' },
  { id: 7, isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ', name: 'Kha', pronunciation: 'Like the "ch" in the Scottish "loch".' },
  { id: 8, isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد', name: 'Dal', pronunciation: '"d" as in "dog".' },
  { id: 9, isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ', name: 'Dhal', pronunciation: '"th" as in "this".' },
  { id: 10, isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر', name: 'Ra', pronunciation: 'A rolled "r".' },
  { id: 11, isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز', name: 'Zay', pronunciation: '"z" as in "zoo".' },
  { id: 12, isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس', name: 'Seen', pronunciation: '"s" as in "sun".' },
  { id: 13, isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش', name: 'Sheen', pronunciation: '"sh" as in "shoe".' },
  { id: 14, isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص', name: 'Sad', pronunciation: 'A heavier, emphatic "s", pronounced further back in the mouth.' },
  { id: 15, isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض', name: 'Dad', pronunciation: 'A heavier, emphatic "d".' },
  { id: 16, isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط', name: 'Ta (emphatic)', pronunciation: 'A heavier, emphatic "t".' },
  { id: 17, isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ', name: 'Za (emphatic)', pronunciation: 'A heavier, emphatic version of the "th" in "this".' },
  { id: 18, isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع', name: 'Ain', pronunciation: 'A tight, throaty sound with no real English equivalent.' },
  { id: 19, isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ', name: 'Ghain', pronunciation: 'A guttural sound, a bit like a French "r".' },
  { id: 20, isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف', name: 'Fa', pronunciation: '"f" as in "fun".' },
  { id: 21, isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق', name: 'Qaf', pronunciation: 'A deep "k" made further back in the throat.' },
  { id: 22, isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك', name: 'Kaf', pronunciation: '"k" as in "kite".' },
  { id: 23, isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل', name: 'Lam', pronunciation: '"l" as in "lamp".' },
  { id: 24, isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم', name: 'Meem', pronunciation: '"m" as in "moon".' },
  { id: 25, isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن', name: 'Noon', pronunciation: '"n" as in "noon".' },
  { id: 26, isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه', name: 'Ha (soft)', pronunciation: '"h" as in "hat".' },
  { id: 27, isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو', name: 'Waw', pronunciation: '"w" as in "wow", or a long "oo" sound.' },
  { id: 28, isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي', name: 'Ya', pronunciation: '"y" as in "yes", or a long "ee" sound.' },
];
