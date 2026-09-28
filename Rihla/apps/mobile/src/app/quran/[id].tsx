import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useFonts } from 'expo-font';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getQuranChapters, getRecitations, getSurahVerses, getVerseAudio } from '@/services/quranApi';
import { useTheme } from '@/theme/theme-context';

type Mode = 'verse' | 'reading';
type Chapter = { id:number; nameSimple:string; nameArabic:string; versesCount:number; revelationPlace:string; translatedName?:{ name:string } };
type Bookmark = { surahId:number; surahName:string; verseKey:string; ayah:number; arabic:string; translation:string; savedAt:number };
type Reciter = { id:string; name:string };

// Kept outside the component so it reads as a plain module helper, not a render-time call.
function timestamp() { return Date.now(); }

export default function SurahScreen() {
  const { colors } = useTheme();
  const { id, ayah } = useLocalSearchParams<{ id:string; ayah?:string }>();
  const surahId = Number(id), targetAyah = Number(ayah);
  const scrollRef = useRef<ScrollView>(null), didScroll = useRef(false);

  const [fontsLoaded] = useFonts({
    UthmanicHafs:{ uri:'https://verses.quran.foundation/fonts/quran/hafs/uthmanic_hafs/UthmanicHafs1Ver18.ttf' }
  });

  const [chapter,setChapter] = useState<Chapter|null>(null);
  const [verses,setVerses] = useState<any[]>([]);
  const [mode,setMode] = useState<Mode>('verse');
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  const [bookmarks,setBookmarks] = useState<Bookmark[]>([]);
  const [playingIndex,setPlayingIndex] = useState<number|null>(null);
  const [audioLoading,setAudioLoading] = useState(false);
  const [reciters,setReciters] = useState<Reciter[]>([{ id:'7', name:'Mishari Alafasy' }]);
  const [reciter,setReciter] = useState<Reciter>({ id:'7', name:'Mishari Alafasy' });
  const [reciterOpen,setReciterOpen] = useState(false);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const quranFont = fontsLoaded ? 'UthmanicHafs' : undefined;

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true });
  }, []);

  const loadSurah = useCallback(async () => {
    if (!surahId) return;
    setLoading(true); setError('');
    try {
      const data = await getSurahVerses(surahId);
      setVerses(data.verses ?? data);
    } catch {
      setError('Could not load this Surah. Check your connection and try again.');
    } finally { setLoading(false); }

    try {
      const chapters = await getQuranChapters();
      setChapter(chapters.find((c:Chapter) => c.id === surahId) ?? null);
    } catch {}
  },[surahId]);

  const loadBookmarks = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('rihla:bookmarks');
      setBookmarks(saved ? JSON.parse(saved) : []);
    } catch(e) { console.error('Bookmark load error:',e); }
  },[]);

  useEffect(() => {
    const loadReciters = async () => {
      try {
        const data = await getRecitations();
  
        const list:Reciter[] = (data.recitations ?? data).map((r:any) => ({
          id:String(r.id),
          name:r.reciterName ?? r.reciter_name ?? r.name
        }));
  
        if (!list.length) return;
  
        setReciters(list);
  
        const saved = await AsyncStorage.getItem('rihla:reciter');
        const savedReciter = saved ? JSON.parse(saved) : null;
  
        setReciter(
          list.find(r=>r.id===savedReciter?.id) ??
          list.find(r=>r.id==='7') ??
          list[0]
        );
      } catch(e) {
        console.error('Reciters:',e);
      }
    };
  
    loadReciters();
  },[]);

  useEffect(() => {
    didScroll.current = false;
    const id = setTimeout(() => { loadSurah(); loadBookmarks(); }, 0);
    return () => clearTimeout(id);
  },[loadSurah,loadBookmarks,targetAyah]);

  const arabic = (v:any) => v.words?.map((w:any)=>w.textQpcHafs).filter(Boolean).join(' ') ?? '';
  const transliteration = (v:any) => v.words?.map((w:any)=>w.transliteration?.text).filter(Boolean).join(' ') ?? '';
  const translation = (v:any) => v.words?.map((w:any)=>w.translation?.text).filter(Boolean).join(' ').replace(/<[^>]*>/g,'') ?? '';

  const modernTransliteration = (v:any) => {
    const t = transliteration(v)
      .replace(/bi-s['’]?mi/gi,'Bismi').replace(/\bl-lahi\b/gi,'Allahi')
      .replace(/\bl-raḥmāni\b/gi,'ar-Rahmani').replace(/\bl-raḥīmi\b/gi,'ar-Raheemi')
      .replace(/ḥ/g,'h').replace(/ā/g,'a').replace(/ī/g,'ee').replace(/ū/g,'oo')
      .replace(/\s+/g,' ').trim();
    return t ? t.charAt(0).toUpperCase()+t.slice(1) : '';
  };

  const cleanTranslation = (v:any) => translation(v).replace(/\s*\(\d+\)\s*$/,'').trim();
  const revelation = chapter?.revelationPlace === 'makkah' ? 'Makkah' : chapter?.revelationPlace === 'madinah' ? 'Madinah' : '';

  const saveLastRead = async (index:number) => {
    const v = verses[index]; if (!v) return;
    try {
      const updatedAt = timestamp();
      await AsyncStorage.setItem('rihla:lastRead',JSON.stringify({
        surahId, surahName:chapter?.nameSimple ?? `Surah ${surahId}`,
        verseKey:v.verseKey, ayah:index+1, updatedAt
      }));
    } catch(e) { console.error('Last Read error:',e); }
  };

  const isBookmarked = (key:string) => bookmarks.some(b=>b.verseKey===key);

  const toggleBookmark = async (index:number) => {
    const v = verses[index]; if (!v) return;
    try {
      const exists = isBookmarked(v.verseKey);
      const updated = exists
        ? bookmarks.filter(b=>b.verseKey!==v.verseKey)
        : [...bookmarks,{
            surahId, surahName:chapter?.nameSimple ?? `Surah ${surahId}`,
            verseKey:v.verseKey, ayah:index+1, arabic:arabic(v),
            translation:cleanTranslation(v), savedAt:timestamp()
          }];
      setBookmarks(updated);
      await AsyncStorage.setItem('rihla:bookmarks',JSON.stringify(updated));
    } catch(e) { console.error('Bookmark error:',e); }
  };

  const playAyah = useCallback(async (index:number, reciterId = reciter.id) => {
    const v = verses[index]; if (!v) return;

    try {
      setAudioLoading(true);

      const url = await getVerseAudio(v.verseKey, reciterId);
      console.log('RECITER:', reciterId, 'URL:', url);

      if (!url) return;

      player.pause();
      player.replace(url);
      setPlayingIndex(index);

      setTimeout(() => player.play(), 100);

      await AsyncStorage.setItem('rihla:lastRead', JSON.stringify({
        surahId,
        surahName: chapter?.nameSimple ?? `Surah ${surahId}`,
        verseKey: v.verseKey,
        ayah: index + 1,
        updatedAt: timestamp()
      }));
    } catch(e) {
      console.error('Audio error:', e);
    } finally {
      setAudioLoading(false);
    }
  }, [player, verses, surahId, chapter, reciter.id]);

  useEffect(() => {
    if (!status.didJustFinish || playingIndex===null) return;
    const next = playingIndex+1;
    const id = setTimeout(() => {
      if (next<verses.length) playAyah(next);
      else setPlayingIndex(null);
    }, 0);
    return () => clearTimeout(id);
  },[status.didJustFinish,playingIndex,verses.length,playAyah]);

  const toggleAudio = () => {
    if (playingIndex===null) return playAyah(0);
    if (status.playing) player.pause();
    else player.play();
  };

  const nextAyah = () => {
    const next = playingIndex===null ? 0 : playingIndex+1;
    if (next<verses.length) playAyah(next);
  };

  const previousAyah = () => {
    if (playingIndex===null) return playAyah(0);
    if (playingIndex>0) playAyah(playingIndex-1);
  };

  const handleVersePlay = (i:number) => {
    saveLastRead(i);
    if (playingIndex !== i) { playAyah(i); return; }
    if (status.playing) player.pause();
    else player.play();
  };

  const selectReciter = async (r:Reciter) => {
    setReciter(r);
    setReciterOpen(false);
  
    await AsyncStorage.setItem('rihla:reciter',JSON.stringify(r));
  
    if (playingIndex!==null)
      playAyah(playingIndex,r.id);
  };

  const handleVerseLayout = (index:number,y:number) => {
    if (!targetAyah || targetAyah!==index+1 || didScroll.current) return;
    didScroll.current = true;
    requestAnimationFrame(()=>scrollRef.current?.scrollTo({ y:Math.max(0,y-20), animated:false }));
  };

  if (loading) return (
    <SafeAreaView style={[s.center,{backgroundColor:colors.background}]}>
      <ActivityIndicator size="large" color={colors.accent}/>
      <Text style={[s.loading,{color:colors.textSecondary}]}>Loading Surah...</Text>
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={[s.center,{backgroundColor:colors.background}]}>
      <Ionicons name="cloud-offline-outline" size={38} color={colors.textSecondary}/>
      <Text style={[s.errorTitle,{color:colors.textPrimary}]}>Could not load Surah</Text>
      <Text style={[s.errorText,{color:colors.textSecondary}]}>{error}</Text>
      <TouchableOpacity onPress={loadSurah} style={[s.retry,{backgroundColor:colors.accent}]}>
        <Text style={s.retryText}>Try again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[s.safe,{backgroundColor:colors.background}]} edges={['top','bottom']}>
      <ScrollView ref={scrollRef} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.card,{backgroundColor:colors.surface,borderColor:colors.border}]}>
          <View style={s.headerTop}>
            <View style={{flex:1}}>
              <Text style={[s.title,{color:colors.textPrimary}]}>{chapter?.nameSimple ?? `Surah ${surahId}`}</Text>
              {!!chapter?.translatedName?.name && <Text style={[s.meaning,{color:colors.textSecondary}]}>{chapter.translatedName.name}</Text>}
            </View>

            {!!chapter?.nameArabic && (
              <Text style={[s.headerArabic,{color:colors.textPrimary,fontFamily:quranFont}]}>
                {chapter.nameArabic}
              </Text>
            )}
          </View>

          <View style={s.metaRow}>
            <Meta icon="book-outline" value={`${surahId}`} label="Surah" colors={colors}/>
            <Meta icon="layers-outline" value={`${chapter?.versesCount ?? verses.length}`} label="Verses" colors={colors}/>
            {!!revelation && <Meta icon="location-outline" value={revelation} label="Revelation" colors={colors}/>}
          </View>

          <View style={[s.modeBar,{backgroundColor:colors.background,borderColor:colors.border}]}>
            <ModeButton label="Verse by verse" icon="list-outline" active={mode==='verse'} onPress={()=>setMode('verse')} colors={colors}/>
            <ModeButton label="Reading" icon="book-outline" active={mode==='reading'} onPress={()=>setMode('reading')} colors={colors}/>
          </View>
        </View>

        <View style={[s.toolbar,{backgroundColor:colors.surface,borderColor:colors.border}]}>
          <View style={s.row}>
            <Ionicons name="globe-outline" size={17} color={colors.accent}/>
            <Text style={{color:colors.textPrimary}}>English</Text>
          </View>

          <View style={s.row}>
            <TouchableOpacity onPress={()=>playAyah(0)}>
              <View style={s.row}>
                <Ionicons name="play-circle-outline" size={21} color={colors.accent}/>
                <Text style={{color:colors.textPrimary}}>Play all</Text>
              </View>
            </TouchableOpacity>
            <Ionicons name="bookmark-outline" size={20} color={colors.textSecondary}/>
          </View>
        </View>

        {surahId!==1 && surahId!==9 && (
          <View style={[s.bismillah,{backgroundColor:colors.surface,borderColor:colors.border}]}>
            <Text style={[s.bismillahArabic,{color:colors.textPrimary,fontFamily:quranFont}]}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Text>
            <Text style={[s.bismillahTrans,{color:colors.accent}]}>Bismi Allahi ar-Rahmani ar-Raheemi</Text>
            <Text style={[s.bismillahEnglish,{color:colors.textSecondary}]}>
              In the Name of Allah—the Most Compassionate, Most Merciful
            </Text>
          </View>
        )}

        {mode==='verse' ? verses.map((verse,index)=>{
          const active=playingIndex===index, bookmarked=isBookmarked(verse.verseKey);

          return (
            <View
              key={verse.id ?? index}
              onLayout={e=>handleVerseLayout(index,e.nativeEvent.layout.y)}
              onTouchStart={()=>saveLastRead(index)}
              style={[
                s.verseCard,
                {backgroundColor:active?colors.accentTint:colors.surface,borderColor:active?colors.accent:colors.border},
                active && s.activeVerse
              ]}
            >
              <View style={s.verseTop}>
                <View style={[s.badge,{backgroundColor:colors.accentTint,borderColor:colors.accent}]}>
                  <Text style={{color:colors.accent,fontWeight:'700'}}>{verse.verseKey}</Text>
                </View>

                <View style={s.row}>
                  <TouchableOpacity onPress={()=>handleVersePlay(index)}>
                    <Ionicons name={active&&status.playing?'pause':'play'} size={17} color={colors.accent}/>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={()=>toggleBookmark(index)}>
                    <Ionicons
                      name={bookmarked?'bookmark':'bookmark-outline'}
                      size={18}
                      color={bookmarked?colors.accent:colors.textSecondary}
                    />
                  </TouchableOpacity>

                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary}/>
                </View>
              </View>

              <Text style={[s.arabic,{color:colors.textPrimary,fontFamily:quranFont}]}>{arabic(verse)}</Text>

              {!!transliteration(verse) && (
                <View style={s.textSection}>
                  <Text style={[s.transliteration,{color:colors.accent}]}>{modernTransliteration(verse)}</Text>
                  <Text style={[s.textLabel,{color:colors.textTertiary}]}>TRANSLITERATION</Text>
                </View>
              )}

              {!!translation(verse) && (
                <View style={s.textSection}>
                  <Text style={[s.translation,{color:colors.textPrimary}]}>{cleanTranslation(verse)}</Text>
                  <Text style={[s.textLabel,{color:colors.textTertiary}]}>ENGLISH MEANING</Text>
                </View>
              )}
            </View>
          );
        }) : (
          <View style={[s.readingCard,{backgroundColor:colors.surface,borderColor:colors.border}]}>
            {surahId!==1 && surahId!==9 && (
              <Text style={[s.readingBismillah,{color:colors.textPrimary,fontFamily:quranFont}]}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </Text>
            )}

            <Text style={[s.readingArabic,{color:colors.textPrimary,fontFamily:quranFont}]}>
              {verses.map((verse,index)=>(
                <Text
                  key={verse.id ?? index}
                  onPress={()=>{ saveLastRead(index); handleVersePlay(index); }}
                  style={{
                    backgroundColor:playingIndex===index?colors.accentTint:'transparent',
                    color:playingIndex===index?colors.accent:colors.textPrimary
                  }}
                >
                  {arabic(verse)}{' '}
                </Text>
              ))}
            </Text>
          </View>
        )}
      </ScrollView>

      {reciterOpen && playingIndex!==null && (
        <View style={[s.reciterMenu,{backgroundColor:colors.surface,borderColor:colors.border}]}>
          <Text style={[s.reciterLabel,{color:colors.textTertiary}]}>RECITER</Text>

          {reciters.map(r=>(
            <TouchableOpacity
              key={r.id}
              onPress={()=>selectReciter(r)}
              style={[
                s.reciterOption,
                r.id===reciter.id && {backgroundColor:colors.accentTint}
              ]}
            >
              <Text style={[
                s.reciterOptionText,
                {color:r.id===reciter.id?colors.accent:colors.textPrimary}
              ]}>
                {r.name}
              </Text>

              {r.id===reciter.id && (
                <Ionicons name="checkmark" size={17} color={colors.accent}/>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {playingIndex!==null && (
        <View style={[s.player,{backgroundColor:colors.surface,borderColor:colors.border}]}>
          <View style={s.playerInfo}>
            <Text style={[s.playerAyah,{color:colors.accent}]}>
              Ayah {verses[playingIndex]?.verseKey}
            </Text>

            <TouchableOpacity
              onPress={()=>setReciterOpen(v=>!v)}
              style={s.reciterPicker}
            >
              <Text numberOfLines={1} style={[s.playerName,{color:colors.textPrimary}]}>
                {reciter.name}
              </Text>

              <Ionicons
                name={reciterOpen?'chevron-up':'chevron-down'}
                size={13}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={s.playerControls}>
            <TouchableOpacity onPress={previousAyah}>
              <Ionicons name="play-skip-back" size={21} color={colors.textPrimary}/>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleAudio} style={[s.mainPlay,{backgroundColor:colors.accent}]}>
              {audioLoading
                ? <ActivityIndicator size="small" color="#FFF"/>
                : <Ionicons name={status.playing?'pause':'play'} size={24} color="#FFF"/>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={nextAyah}>
              <Ionicons name="play-skip-forward" size={21} color={colors.textPrimary}/>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Meta({icon,value,label,colors}:any){
  return (
    <View style={[s.meta,{backgroundColor:colors.background}]}>
      <Ionicons name={icon} size={15} color={colors.accent}/>
      <View>
        <Text style={[s.metaValue,{color:colors.textPrimary}]}>{value}</Text>
        <Text style={[s.metaLabel,{color:colors.textSecondary}]}>{label}</Text>
      </View>
    </View>
  );
}

function ModeButton({label,icon,active,onPress,colors}:any){
  return (
    <TouchableOpacity onPress={onPress} style={[s.modeButton,active&&{backgroundColor:colors.accent}]}>
      <Ionicons name={icon} size={16} color={active?'#FFF':colors.textSecondary}/>
      <Text style={[s.modeText,{color:active?'#FFF':colors.textSecondary}]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s=StyleSheet.create({
  safe:{flex:1},
  content:{paddingHorizontal:18,paddingBottom:140,paddingTop:8},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:28},
  loading:{marginTop:12,fontSize:14},
  errorTitle:{fontSize:20,fontWeight:'700',marginTop:14},
  errorText:{fontSize:14,textAlign:'center',marginTop:8,lineHeight:21},
  retry:{paddingHorizontal:22,paddingVertical:11,borderRadius:12,marginTop:18},
  retryText:{color:'#FFF',fontWeight:'700'},

  card:{borderWidth:1,borderRadius:22,padding:18,marginBottom:12},
  headerTop:{flexDirection:'row',justifyContent:'space-between',gap:16},
  title:{fontSize:25,fontWeight:'700'},
  meaning:{fontSize:13,marginTop:4},
  headerArabic:{fontSize:30,textAlign:'right',writingDirection:'rtl'},

  metaRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:16},
  meta:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:11,paddingVertical:8,borderRadius:13},
  metaValue:{fontSize:12,fontWeight:'700'},
  metaLabel:{fontSize:9},

  modeBar:{flexDirection:'row',borderWidth:1,borderRadius:14,padding:4,marginTop:16},
  modeButton:{flex:1,height:40,borderRadius:10,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
  modeText:{fontSize:12,fontWeight:'700'},

  toolbar:{borderWidth:1,borderRadius:16,padding:13,flexDirection:'row',justifyContent:'space-between',marginBottom:12},
  row:{flexDirection:'row',alignItems:'center',gap:10},

  bismillah:{borderWidth:1,borderRadius:18,padding:20,alignItems:'center',marginBottom:12},
  bismillahArabic:{fontSize:30,lineHeight:48,writingDirection:'rtl'},
  bismillahTrans:{fontSize:14,lineHeight:22,fontStyle:'italic',fontWeight:'500',marginTop:7},
  bismillahEnglish:{fontSize:12,textAlign:'center',marginTop:5},

  verseCard:{borderWidth:1,borderRadius:18,padding:18,marginBottom:12},
  activeVerse:{borderWidth:1.5,transform:[{scale:1.005}]},
  verseTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  badge:{minWidth:44,height:44,paddingHorizontal:8,borderWidth:1,borderRadius:22,alignItems:'center',justifyContent:'center'},
  arabic:{fontSize:34,lineHeight:60,textAlign:'right',writingDirection:'rtl',marginTop:18},

  textSection:{marginTop:14},
  transliteration:{fontSize:15,lineHeight:23,fontStyle:'italic',fontWeight:'500'},
  translation:{fontSize:15,lineHeight:24,fontWeight:'400'},
  textLabel:{fontSize:9,fontWeight:'700',letterSpacing:1.1,marginTop:5},

  readingCard:{borderWidth:1,borderRadius:18,padding:22},
  readingBismillah:{fontSize:29,lineHeight:48,textAlign:'center',writingDirection:'rtl',marginBottom:20},
  readingArabic:{fontSize:32,lineHeight:60,textAlign:'right',writingDirection:'rtl'},

  reciterMenu:{
    position:'absolute',bottom:94,left:18,width:215,
    borderWidth:1,borderRadius:16,padding:7,
    shadowColor:'#000',shadowOpacity:.12,shadowRadius:12,
    shadowOffset:{width:0,height:5},elevation:9
  },
  reciterLabel:{fontSize:9,fontWeight:'700',letterSpacing:1,paddingHorizontal:10,paddingVertical:6},
  reciterOption:{height:40,borderRadius:11,paddingHorizontal:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  reciterOptionText:{fontSize:12,fontWeight:'600'},

  player:{
    position:'absolute',bottom:14,left:18,right:18,minHeight:72,
    borderWidth:1,borderRadius:22,paddingHorizontal:18,paddingVertical:11,
    flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    shadowColor:'#000',shadowOpacity:.12,shadowRadius:12,
    shadowOffset:{width:0,height:5},elevation:8
  },
  playerInfo:{flex:1,paddingRight:12},
  playerAyah:{fontSize:11,fontWeight:'700'},
  reciterPicker:{flexDirection:'row',alignItems:'center',gap:5,marginTop:3,alignSelf:'flex-start'},
  playerName:{fontSize:13,fontWeight:'600',maxWidth:220},
  playerControls:{flexDirection:'row',alignItems:'center',gap:18},
  mainPlay:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center'},
});
