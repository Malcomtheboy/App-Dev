import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const palette = {
  light: { background: '#F7FAF8', surface: '#FFFFFF', border: '#D7E5DD', text: '#123B2F', muted: '#668075', accent: '#0C6048', buttonText: '#FFFFFF' },
  dark: { background: '#081C17', surface: '#102A22', border: '#24483B', text: '#F3F8F4', muted: '#A7BBB0', accent: '#83D8B5', buttonText: '#062A20' },
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const colors = palette[useColorScheme() === 'dark' ? 'dark' : 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Logg inn</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Velkommen tilbake</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="E-post eller telefon"
          placeholderTextColor={colors.muted}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={email}
        />
        <TextInput
          onChangeText={setPassword}
          placeholder="Passord"
          placeholderTextColor={colors.muted}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          value={password}
        />

        <TouchableOpacity style={styles.forgotButton}>
          <Text style={[styles.forgotText, { color: colors.accent }]}>Glemt passord?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/home')} style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
          <Text style={[styles.primaryButtonText, { color: colors.buttonText }]}>Logg inn</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.muted }]}>eller</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity style={[styles.googleButton, { borderColor: colors.border }]}>
          <Text style={styles.googleMark}>G</Text>
          <Text style={[styles.googleText, { color: colors.text }]}>Fortsett med Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/register')} style={styles.footerButton}>
          <Text style={[styles.footerText, { color: colors.muted }]}>Har du ikke konto? <Text style={{ color: colors.accent, fontWeight: '700' }}>Registrer deg</Text></Text>
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
  forgotButton: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -4 },
  forgotText: { fontSize: 12, fontWeight: '600' },
  primaryButton: { alignItems: 'center', borderRadius: 12, paddingVertical: 16 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginVertical: 22 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  googleButton: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', paddingVertical: 14 },
  googleMark: { color: '#4285F4', fontSize: 16, fontWeight: '800', marginRight: 10 },
  googleText: { fontSize: 14, fontWeight: '600' },
  footerButton: { alignSelf: 'center', marginTop: 20 },
  footerText: { fontSize: 12 },
});
