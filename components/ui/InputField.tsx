import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function InputField({ label, error, style, ...textInputProps }: InputFieldProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#999"
        {...textInputProps}
      />
      {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
  },
});
