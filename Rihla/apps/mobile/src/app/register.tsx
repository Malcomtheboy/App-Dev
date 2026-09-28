import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sheet } from '@/components/sheet';
import { useTheme } from '@/theme/theme-context';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const canSubmit = acceptedTerms && name.trim().length > 0 && email.trim().length > 0 && password.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Create account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join the journey</Text>

        <TextInput
          autoCapitalize="words"
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          value={name}
        />
        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          value={email}
        />
        <TextInput
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          value={password}
        />

        <View style={styles.termsRow}>
          <TouchableOpacity onPress={() => setAcceptedTerms((value) => !value)} style={styles.checkboxRow}>
            <View style={[styles.checkbox, { borderColor: colors.accent, backgroundColor: acceptedTerms ? colors.accent : 'transparent' }]}>
              {acceptedTerms && <Text style={[styles.check, { color: colors.accentOn }]}>✓</Text>}
            </View>
          </TouchableOpacity>
          <Text style={[styles.termsText, { color: colors.textSecondary }]}>
            I agree to the{' '}
            <Text style={{ color: colors.accent, fontWeight: '700' }} onPress={() => setTermsOpen(true)}>
              terms and privacy policy
            </Text>
            .
          </Text>
        </View>

        <TouchableOpacity
          disabled={!canSubmit}
          onPress={() => router.replace('/home')}
          style={[styles.primaryButton, { backgroundColor: colors.accent }, !canSubmit && styles.disabledButton]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.accentOn }]}>Sign up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/login')} style={styles.footerButton}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account? <Text style={{ color: colors.accent, fontWeight: '700' }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Sheet visible={termsOpen} onClose={() => setTermsOpen(false)} title="Terms & privacy">
        <Text style={[styles.sheetText, { color: colors.textSecondary }]}>
          Rihla&apos;s full terms of service and privacy policy will be published before launch, once accounts and
          data storage are in place. For now, no account data leaves your device.
        </Text>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 26 },
  input: { borderWidth: 1, borderRadius: 12, fontSize: 14, height: 52, marginBottom: 12, paddingHorizontal: 14 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, gap: 9 },
  checkboxRow: { paddingTop: 1 },
  checkbox: { alignItems: 'center', borderRadius: 4, borderWidth: 1, height: 18, justifyContent: 'center', width: 18 },
  check: { fontSize: 12, fontWeight: '800' },
  termsText: { fontSize: 12, flex: 1, lineHeight: 17 },
  primaryButton: { alignItems: 'center', borderRadius: 12, marginTop: 24, paddingVertical: 16 },
  disabledButton: { opacity: 0.4 },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  footerButton: { alignSelf: 'center', marginTop: 20 },
  footerText: { fontSize: 12 },
  sheetText: { fontSize: 13, lineHeight: 20 },
});
