import { AppScreen } from '@/components/AppScreen';
import { AuthFrame } from '@/components/AuthFrame';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);
    console.log('🔐 Attempting login with:', email.trim());

    const result = await login(email.trim(), password);

    if (result.success) {
      console.log('✅ Login successful');
      router.replace('/dashboard' as never);
    } else if (result.requiresVerification) {
      console.log('⚠️ Email not verified');
      router.push('/verify-email' as never);
    } else {
      console.log('❌ Login failed:', result.error);
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  const goToSignup = () => {
    router.push('/register' as never);
  };

  return (
    <AppScreen scrollable={false}>
      <AuthFrame
        badge="Secure sign in"
        title="Welcome back"
        subtitle="Use the email address and password tied to your SukiScale account."
        emblem="🔐"
        accent="#0F766E"
        accentSoft="#D8F3EE"
        footer={
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Pressable onPress={goToSignup}>
              <Text style={styles.signupLink}>Create one</Text>
            </Pressable>
          </View>
        }
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardArea}
        >
          <View style={styles.form}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#64748B" />
                  ) : (
                    <Eye size={20} color="#64748B" />
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </AuthFrame>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  keyboardArea: {
    width: '100%',
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },
  field: {
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5DFEA',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FBFD',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5DFEA',
    borderRadius: 16,
    backgroundColor: '#F8FBFD',
    paddingRight: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 13,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeIcon: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  loginButton: {
    backgroundColor: '#0F766E',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  signupLink: {
    fontSize: 14,
    color: '#0F766E',
    fontWeight: '800',
  },
});
