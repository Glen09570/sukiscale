import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Suppress harmless keep-awake and other warnings
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'Unable to activate keep awake',
  ' expo-keep-awake',
  'AsyncStorage has been extracted',
  'Call to function.*keepAwake',
  'NativeEventEmitter',
  'Node cannot be found in current page',
  'ResponderTouchHistoryStore',
  'touch end',
]);

// Suppress specific error patterns globally
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const errorMessage = args[0]?.toString?.() || '';
  if (
    errorMessage.includes('keep awake') ||
    errorMessage.includes('KeepAwake') ||
    errorMessage.includes('Unable to activate')
  ) {
    return; // Silently ignore keep-awake errors
  }
  originalConsoleError.apply(console, args);
};

import { AppProvider } from '@/context/AppContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PrinterProvider } from '@/context/PrinterContext';
import { ToastProvider } from '@/context/ToastContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

function ProtectedRouteWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const publicRoutes = ['index', 'note', 'register', 'login', 'verify-email'];
  const currentRoute = segments[0] || 'index';
  const isPublicRoute = publicRoutes.includes(currentRoute);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login' as never);
    } else if (isAuthenticated && user && !user.isVerified && currentRoute !== 'verify-email') {
      router.replace('/verify-email' as never);
    } else if (isAuthenticated && isPublicRoute && currentRoute.toString() !== 'index') {
      router.replace('/dashboard' as never);
    }
  }, [isAuthenticated, isLoading, segments, user]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ProtectedRouteWrapper>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="note" />
          <Stack.Screen name="register" />
          <Stack.Screen name="login" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="transactions/new" />
          <Stack.Screen name="transactions/debt-deduction" />
          <Stack.Screen name="transactions/partial-payment" />
          <Stack.Screen name="transactions/summary" />
          <Stack.Screen name="transactions/receipt" />
          <Stack.Screen name="transactions/end" />
          <Stack.Screen name="farmers/index" />
          <Stack.Screen name="history/index" />
          <Stack.Screen name="debts/index" />
          <Stack.Screen name="products/index" />
          <Stack.Screen name="settings/index" />
        </Stack>
      </ProtectedRouteWrapper>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppProvider>
          <EnhancedAppProvider>
            <PrinterProvider>
              <RootLayoutNav />
            </PrinterProvider>
          </EnhancedAppProvider>
        </AppProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
