import { AppScreen } from '@/components/AppScreen';
import { AuthFrame } from '@/components/AuthFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Splash Screen - Entry point of the app
 * - White background
 * - Centered logo with agricultural symbols
 * - Get Started button
 */
export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard' as never);
      } else if (user && !user.isVerified) {
        router.replace('/verify-email' as never);
      }
    }
  }, [isLoading, isAuthenticated, user]);

  const handleGetStarted = () => {
    router.push('/note' as never);
  };

  if (isLoading) {
    return (
      <AppScreen scrollable={false}>
        <AuthFrame
          badge="Loading"
          title="Preparing your workspace"
          subtitle="Checking your account and restoring the right entry point."
          emblem="⚖️"
          accent="#0F766E"
        >
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <Text style={styles.loadingIcon}>🌴</Text>
              <Text style={styles.loadingText}>Syncing data and account state</Text>
              <ActivityIndicator size="large" color="#0F766E" style={styles.loader} />
            </View>
          </View>
        </AuthFrame>
      </AppScreen>
    );
  }

  return (
    <AppScreen scrollable={false}>
      <AuthFrame
        badge="Welcome"
        title="Trade with less friction"
        subtitle="SukiScale helps you track produce, manage farmers, and keep payments organized in one clear flow."
        emblem="⚖️"
        accent="#0F766E"
        accentSoft="#D8F3EE"
        footer={<Text style={styles.footerText}>Secure account setup powered by Gmail verification.</Text>}
      >
        <View style={styles.container}>
          <View style={styles.featureRow}>
            <View style={styles.featurePill}>
              <Text style={styles.featureText}>Farmer records</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featureText}>Debt tracking</Text>
            </View>
            <View style={styles.featurePill}>
              <Text style={styles.featureText}>Payment history</Text>
            </View>
          </View>

          <Text style={styles.bodyText}>
            Start a new account if you are setting up SukiScale for your business, or jump back in if you already have one.
          </Text>

          <View style={styles.buttonContainer}>
            <PrimaryButton title="Get Started" color="#0F766E" onPress={handleGetStarted} />
          </View>

          <Pressable onPress={() => router.push('/login' as never)}>
            <Text style={styles.linkText}>I already have an account</Text>
          </Pressable>
        </View>
      </AuthFrame>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  featurePill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#EEF7F5',
    borderWidth: 1,
    borderColor: '#CDEBE5',
  },
  featureText: {
    color: '#115E59',
    fontSize: 13,
    fontWeight: '700',
  },
  bodyText: {
    fontSize: 14,
    color: '#41556A',
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 6,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F766E',
    textAlign: 'center',
  },
  footerText: {
    color: '#5E7087',
    fontSize: 13,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingIcon: {
    fontSize: 42,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  loader: {
    marginTop: 30,
  },
});
