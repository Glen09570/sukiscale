import { AppScreen } from '@/components/AppScreen';
import { AuthFrame } from '@/components/AuthFrame';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, verifyEmail, resendVerificationCode } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerify = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    const result = await verifyEmail();

    if (result.success) {
      setSuccess('Email verified successfully!');
      setTimeout(() => {
        router.replace('/dashboard' as never);
      }, 1500);
    } else {
      setError(result.error || 'Verification failed');
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    const result = await resendVerificationCode();

    if (result.success) {
      setSuccess('A new verification email has been sent!');
    } else {
      setError(result.error || 'Failed to resend email');
    }

    setIsResending(false);
  };

  return (
    <AppScreen scrollable={false}>
      <AuthFrame
        badge="Email verification"
        title="Check your inbox"
        subtitle="We sent a confirmation link to finish creating your SukiScale account."
        emblem="📨"
        accent="#0F766E"
        accentSoft="#D8F3EE"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.emailLabel}>Verification sent to</Text>
            <Text style={styles.email}>{user?.email || 'your email'}</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>I&apos;ve Verified My Email</Text>
              )}
            </Pressable>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn&apos;t receive the email?</Text>
              <Pressable onPress={handleResend} disabled={isResending}>
                {isResending ? (
                  <ActivityIndicator size="small" color="#0F766E" />
                ) : (
                  <Text style={styles.resendLink}>Resend Email</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>How to verify</Text>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Open your Gmail inbox</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Find the message from Firebase and check spam too</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Tap the verification link inside the email</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>Return here and tap the confirmation button</Text>
            </View>
          </View>
        </View>
      </AuthFrame>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  emailLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748B',
  },
  email: {
    fontSize: 16,
    color: '#0F766E',
    fontWeight: '800',
    marginTop: 4,
  },
  form: {
    gap: 20,
  },
  instructionsBox: {
    backgroundColor: '#F8FBFF',
    padding: 20,
    borderRadius: 22,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#D7E7FB',
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0F766E',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successText: {
    color: '#047857',
    fontSize: 14,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#0F766E',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  resendText: {
    fontSize: 14,
    color: '#64748B',
  },
  resendLink: {
    fontSize: 14,
    color: '#0F766E',
    fontWeight: '800',
  },
});
