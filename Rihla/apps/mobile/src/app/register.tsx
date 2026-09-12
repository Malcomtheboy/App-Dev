import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const palette = {
  light: { background: '#F7FAF8', surface: '#FFFFFF', border: '#D7E5DD', text: '#123B2F', muted: '#668075', accent: '#0C6048', accentSoft: '#E3F2EA', buttonText: '#FFFFFF' },
  dark: { background: '#081C17', surface: '#102A22', border: '#24483B', text: '#F3F8F4', muted: '#A7BBB0', accent: '#83D8B5', accentSoft: '#173C30', buttonText: '#062A20' },
};

export default function RegisterScreen() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const colors = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Opprett konto</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Bli med på reisen</Text>

        {['Navn', 'E-post', 'Passord'].map((placeholder) => (
          <TextInput
            autoCapitalize={placeholder === 'Navn' ? 'words' : 'none'}
            key={placeholder}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            secureTextEntry={placeholder === 'Passord'}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          />
        ))}

        <TouchableOpacity onPress={() => setAcceptedTerms((value) => !value)} style={styles.termsRow}>
          <View style={[styles.checkbox, { borderColor: colors.accent, backgroundColor: acceptedTerms ? colors.accent : 'transparent' }]}>
            {acceptedTerms && <Text style={[styles.check, { color: colors.buttonText }]}>✓</Text>}
          </View>
          <Text style={[styles.termsText, { color: colors.muted }]}>Jeg godtar vilkårene og personvernet.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!acceptedTerms}
          onPress={() => router.replace('/home')}
          style={[styles.primaryButton, { backgroundColor: colors.accent }, !acceptedTerms && styles.disabledButton]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>Registrer deg</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.footerButton}>
          <Text style={[styles.footerText, { color: colors.muted }]}>Har du allerede en konto? <Text style={{ color: colors.accent, fontWeight: '700' }}>Logg inn</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 26 },
  input: { borderWidth: 1, borderRadius: 12, fontSize: 14, height: 52, marginBottom: 12, paddingHorizontal: 14 },
  termsRow: { alignItems: 'center', flexDirection: 'row', marginTop: 4 },
  checkbox: { alignItems: 'center', borderRadius: 4, borderWidth: 1, height: 18, justifyContent: 'center', marginRight: 9, width: 18 },
  check: { fontSize: 12, fontWeight: '800' },
  termsText: { fontSize: 12, flex: 1 },
  primaryButton: { alignItems: 'center', borderRadius: 12, marginTop: 24, paddingVertical: 16 },
  disabledButton: { opacity: 0.4 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  footerButton: { alignSelf: 'center', marginTop: 20 },
  footerText: { fontSize: 12 },
});
