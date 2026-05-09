import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

interface PrimaryButtonProps {
  title: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

/**
 * PrimaryButton - Glassmorphism button with refined animations
 */
export function PrimaryButton({ title, color = '#1296F3', onPress, disabled = false }: PrimaryButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: color },
        hovered && isWeb && styles.buttonHover,
        pressed && styles.buttonPressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      onHoverIn={() => isWeb && setHovered(true)}
      onHoverOut={() => isWeb && setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    minHeight: 54,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    elevation: 8,
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 12px 18px rgba(15, 23, 42, 0.16)',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    } as any),
  },
  disabled: {
    opacity: 0.5,
    transform: [{ scale: 1 }],
  },
  buttonHover: {
    transform: [{ scale: 1.03 }],
    elevation: 11,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    } as any),
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    elevation: 2,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 4px rgba(0,0,0,0.1)',
    } as any),
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
