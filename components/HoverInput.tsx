import React, { useState } from 'react';
import { Platform, TextInput, TextInputProps, View, ViewStyle, StyleProp } from 'react-native';

interface HoverInputProps extends TextInputProps {
  containerStyle?: StyleProp<ViewStyle>;
  hoverContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * HoverInput - TextInput with container hover effects
 * - Adds border/shadow on hover (web only)
 * - Works like normal TextInput on mobile
 */
export function HoverInput({ containerStyle, hoverContainerStyle, style, ...props }: HoverInputProps) {
  const [hovered, setHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <View
      style={[
        containerStyle,
        hovered && isWeb && hoverContainerStyle,
      ]}
      // @ts-ignore - web-only props
      onMouseEnter={() => isWeb && setHovered(true)}
      onMouseLeave={() => isWeb && setHovered(false)}
    >
      <TextInput
        {...props}
        style={[
          { flex: 1, outline: 'none' as any },
          style,
        ]}
      />
    </View>
  );
}
