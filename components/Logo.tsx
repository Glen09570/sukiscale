import { Image, Platform, StyleSheet, Text, View } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export function Logo({ size = 'medium', showText = false }: LogoProps) {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 24, height: 24, fontSize: 12 };
      case 'medium':
        return { width: 32, height: 32, fontSize: 14 };
      case 'large':
        return { width: 48, height: 48, fontSize: 18 };
      default:
        return { width: 32, height: 32, fontSize: 14 };
    }
  };

  const { width, height, fontSize } = getSize();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={[styles.container, size === 'large' && styles.largeContainer]}>
      <View style={[
        styles.logoWrapper,
        { width, height },
        size === 'large' && styles.largeLogo,
        isWeb && styles.webLogo
      ]}>
        <Image
          source={require('../assets/icons/icon-1024.png')}
          style={[
            styles.logo,
            { width, height }
          ]}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.text, { fontSize }]}>SukiScale</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    borderRadius: Platform.select({
      ios: 6,
      android: 6,
      web: 8,
    }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    borderRadius: Platform.select({
      ios: 4,
      android: 4,
      web: 6,
    }),
  },
  largeLogo: {
    borderRadius: 12,
  },
  webLogo: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  textContainer: {
    marginLeft: 8,
  },
  text: {
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
