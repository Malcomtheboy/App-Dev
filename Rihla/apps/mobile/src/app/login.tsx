import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/services/firebase';
import { useTheme } from '@/theme/theme-context';

export default function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Enter your details', 'Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/home');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const message = code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')
        ? 'Your email or password is incorrect.'
        : code.includes('invalid-email')
          ? 'Enter a valid email address.'
          : code.includes('network-request-failed')
            ? 'Check your internet connection and try again.'
            : 'We could not log you in. Please try again.';
      Alert.alert('Log in failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Log in</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome back</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          autoComplete="email"
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

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() =>
            Alert.alert('Not available yet', 'Password reset needs a real backend, which is still being built.')
          }
        >
          <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={isSubmitting}
          onPress={handleLogin}
          style={[styles.primaryButton, { backgroundColor: colors.accent }, isSubmitting && styles.disabledButton]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.accentOn }]}>{isSubmitting ? 'Logging in…' : 'Log in'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <TouchableOpacity
          style={[styles.googleButton, { borderColor: colors.border }]}
          onPress={() =>
            Alert.alert('Not available yet', 'Google sign-in needs a real backend, which is still being built.')
          }
        >
          <Text style={styles.googleMark}>G</Text>
          <Text style={[styles.googleText, { color: colors.textPrimary }]}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/register')} style={styles.footerButton}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don&apos;t have an account? <Text style={{ color: colors.accent, fontWeight: '700' }}>Sign up</Text>
          </Text>
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
  disabledButton: { opacity: 0.6 },
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
