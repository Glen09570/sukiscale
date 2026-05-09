import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';
import { Platform, StyleSheet, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'outlined' | 'filled' | 'glass';
  hoverable?: boolean;
}

export function Card({ children, variant = 'default', hoverable = false, style, ...viewProps }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  const webProps = isWeb && hoverable ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <ThemedView
      style={[
        styles.card,
        variant === 'outlined' && styles.outlined,
        variant === 'filled' && styles.filled,
        variant === 'glass' && styles.glass,
        hoverable && isWeb && hovered && styles.cardHover,
        style,
      ]}
      {...viewProps}
      {...webProps}>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    backgroundColor: '#ffffff',
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease'
    } as any),
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filled: {
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    elevation: 10,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      transition: 'all 0.3s ease',
    } as any),
  },
  cardHover: {
    transform: [{ scale: 1.02 }],
    elevation: 12,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
      transition: 'all 0.3s ease'
    } as any),
  },
});
