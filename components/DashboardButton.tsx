import { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface DashboardButtonProps {
  title: string;
  icon: LucideIcon;
  color: string;
  onPress: () => void;
}

/**
 * DashboardButton - Glassmorphism button with enhanced animations
 */
export function DashboardButton({ title, icon: Icon, color, onPress }: DashboardButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      style={[
        styles.button,
        hovered && isWeb && styles.buttonHovered,
        pressed && styles.buttonPressed,
        { backgroundColor: color }
      ]}
      onPress={onPress}
      onHoverIn={() => isWeb && setHovered(true)}
      onHoverOut={() => isWeb && setHovered(false)}
      onPressIn={() => {
        setPressed(true);
        // Immediate feedback for touch
        if (!isWeb) {
          setTimeout(() => setPressed(false), 100);
        }
      }}
      onPressOut={() => setPressed(false)}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon size={24} color="#FFFFFF" style={hovered && isWeb && styles.iconHovered} />
        </View>
        <Text style={styles.text}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginVertical: 6,
    elevation: 4,
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
      cursor: 'pointer',
    } as any),
  },
  buttonHovered: {
    transform: [{ scale: 1.02 }, { translateY: -2 }],
    elevation: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 12px rgba(0, 0, 0, 0.25)',
    } as any),
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    elevation: 2,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } as any),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  iconHovered: {
    transform: [{ scale: 1.1 }],
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
