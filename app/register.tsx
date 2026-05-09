import { AppScreen } from '@/components/AppScreen';
import { AuthFrame } from '@/components/AuthFrame';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Owner Registration Screen
 * - White background
 * - Form fields for owner details
 * - Finish button
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    contactNumber: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSignup = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await signup({
      fullName: form.fullName.trim(),
      contactNumber: form.contactNumber.trim(),
      address: form.address.trim(),
      email: form.email.trim(),
      password: form.password,
    });

    if (result.success) {
      console.log('✅ Signup successful, redirecting to verification');
      router.push('/verify-email' as never);
    } else {
      console.log('❌ Signup failed:', result.error);
      setError(result.error || 'Signup failed');
    }

    setIsLoading(false);
  };

  const goToLogin = () => {
    router.push('/login' as never);
  };

  return (
    <AppScreen>
      <AuthFrame
        badge="Create account"
        title="Set up your owner profile"
        subtitle="Add your business details now so the rest of the app can stay personalized."
        emblem="🧾"
        accent="#2563EB"
        accentSoft="#DCEBFF"
        footer={
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Pressable onPress={goToLogin}>
              <Text style={styles.loginLink}>Login</Text>
            </Pressable>
          </View>
        }
      >
        <View style={styles.container}>
          <View style={styles.helperCard}>
            <Text style={styles.helperTitle}>Use accurate details</Text>
            <Text style={styles.helperText}>
              The email address will receive verification before you can start using the account.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={form.fullName}
                onChangeText={(text) => updateField('fullName', text)}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={styles.input}
                value={form.contactNumber}
                onChangeText={(text) => updateField('contactNumber', text)}
                placeholder="Enter contact number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={(text) => updateField('address', text)}
                placeholder="Enter your address"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email address *</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={form.password}
                  onChangeText={(text) => updateField('password', text)}
                  placeholder="Create a password (min 6 characters)"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                />
                <Pressable style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                </Pressable>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={form.confirmPassword}
                  onChangeText={(text) => updateField('confirmPassword', text)}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                />
                <Pressable
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} color="#64748B" /> : <Eye size={20} color="#64748B" />}
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupButtonText}>Create Account</Text>}
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
    gap: 16,
  },
  helperCard: {
    borderRadius: 22,
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#D7E7FB',
    padding: 16,
  },
  helperTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: '#475569',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  input: {
    backgroundColor: '#F8FBFD',
    borderWidth: 1,
    borderColor: '#D5DFEA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
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
  buttonContainer: {
    paddingTop: 6,
  },
  signupButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 6,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '800',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FBFD',
    borderWidth: 1,
    borderColor: '#D5DFEA',
    borderRadius: 16,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 4,
  },
});
