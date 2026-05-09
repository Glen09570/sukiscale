import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, type PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'glass';
  size?: 'small' | 'medium' | 'large';
}

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  disabled,
  ...pressableProps
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: '#008000', text: '#fff' };
      case 'secondary':
        return { bg: 'rgba(255, 255, 255, 0.9)', text: '#333' };
      case 'danger':
        return { bg: '#DC2626', text: '#fff' };
      case 'glass':
        return { bg: 'rgba(255, 255, 255, 0.2)', text: '#fff' };
      default:
        return { bg: Colors.light.tint, text: '#fff' };
    }
  };

  const colors = getColors();

  const paddingVertical = {
    small: 10,
    medium: 14,
    large: 18,
  }[size];

  const fontSize = {
    small: 14,
    medium: 16,
    large: 18,
  }[size];

  return (
    <Pressable
      style={[
        styles.button,
        { backgroundColor: colors.bg, paddingVertical },
        variant === 'glass' && styles.glass,
        isWeb && hovered && styles.hover,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => isWeb && setHovered(true)}
      onHoverOut={() => isWeb && setHovered(false)}
      {...pressableProps}>
      <ThemedText style={[styles.text, { fontSize, color: colors.text }]}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    elevation: 6,
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out'
    } as any),
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    } as any),
  },
  hover: {
    transform: [{ scale: 1.05 }],
    elevation: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.25)',
    } as any),
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    elevation: 3,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } as any),
  },
  disabled: {
    opacity: 0.4,
    transform: [{ scale: 1 }],
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
