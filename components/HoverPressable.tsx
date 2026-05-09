import { useState } from 'react';
import { Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface HoverPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  hoverStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * HoverPressable - Pressable with web hover effects
 * - Scales up slightly on hover (web only)
 * - Works like normal Pressable on mobile
 */
export function HoverPressable({ style, hoverStyle, children, ...props }: HoverPressableProps) {
  const [hovered, setHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      {...props}
      style={[
        style,
        hovered && isWeb && hoverStyle,
      ]}
      onHoverIn={() => isWeb && setHovered(true)}
      onHoverOut={() => isWeb && setHovered(false)}
    >
      {children}
    </Pressable>
  );
}
