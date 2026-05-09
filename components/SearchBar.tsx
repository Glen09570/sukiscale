import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
}

/**
 * SearchBar - Clean search input with focus animations
 */
export function SearchBar({ placeholder = 'Search...', value, onChangeText }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, focused && styles.containerFocused]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 4,
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    } as any),
  },
  containerFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: 'rgba(0, 128, 0, 0.3)',
    elevation: 6,
    transform: [{ scale: 1.01 }],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    } as any),
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});
