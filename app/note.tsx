import { AppScreen } from '@/components/AppScreen';
import { AuthFrame } from '@/components/AuthFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Note Screen - Welcome screen with login/register options
 */
export default function NoteScreen() {
  const router = useRouter();

  return (
    <AppScreen scrollable={false}>
      <AuthFrame
        badge="New account"
        title="Welcome to SukiScale"
        subtitle="Create your account to keep farmer records, debts, and payments in one place. Verification goes to a real Gmail inbox."
        emblem="⚖️"
        accent="#2563EB"
        accentSoft="#DCEBFF"
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Built for daily market work</Text>
              <Text style={styles.infoText}>
                Track what is owed, record partial payments, and keep your store or farm data organized.
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton title="Create Account" color="#2563EB" onPress={() => router.push('/register' as never)} />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Pressable onPress={() => router.push('/login' as never)}>
                <Text style={styles.loginLink}>Login</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </AuthFrame>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  content: {
    gap: 14,
  },
  infoCard: {
    backgroundColor: '#F8FBFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E7FB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  loginText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '800',
  },
});
