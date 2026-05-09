import { usePathname } from 'expo-router';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';

const WEB_DESKTOP_BREAKPOINT = 1024;
const PUBLIC_ROUTES = new Set(['/', '/note', '/register', '/login', '/verify-email']);

interface AppScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: any;
}

/**
 * AppScreen - Lightweight shell for screens that manage their own header.
 * - Public screens: plain safe-area container
 * - Native mobile and web below 1024px: content + BottomNavigation
 * - Web desktop above 1024px: Sidebar + content
 */
export function AppScreen({ children, scrollable = true, style }: AppScreenProps) {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > WEB_DESKTOP_BREAKPOINT;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  const content = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContent, style]}
      style={styles.scrollView}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>{children}</View>
  );

  if (isPublicRoute) {
    return (
      <SafeAreaView style={styles.publicContainer}>
        <View style={styles.publicContent}>{content}</View>
      </SafeAreaView>
    );
  }

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <Sidebar />
        <View style={styles.desktopMain}>
          {content}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileContainer}>
      <View style={styles.mobileContent}>
        {content}
      </View>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  publicContainer: {
    flex: 1,
    backgroundColor: '#F3F7FB',
  },
  publicContent: {
    flex: 1,
  },
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F4F6F8',
  },
  desktopMain: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#F3F7FB',
  },
  mobileContent: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
