import { useEffect, useState } from 'react';
import { Platform, NetInfo } from 'react-native';

export interface NetworkStatus {
  isConnected: boolean | null;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  lastChecked: Date | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: null,
    connectionType: null,
    isInternetReachable: null,
    lastChecked: null,
  });

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const checkConnection = async () => {
      try {
        if (Platform.OS === 'web') {
          // Web implementation using navigator API
          const isOnline = navigator.onLine;
          setNetworkStatus(prev => ({
            ...prev,
            isConnected: isOnline,
            connectionType: isOnline ? 'web' : 'none',
            isInternetReachable: isOnline,
            lastChecked: new Date(),
          }));
        } else {
          // React Native implementation
          const NetInfo = require('@react-native-community/netinfo').default;
          unsubscribe = NetInfo.addEventListener(state => {
            setNetworkStatus({
              isConnected: state.isConnected,
              connectionType: state.type,
              isInternetReachable: state.isInternetReachable,
              lastChecked: new Date(),
            });
          });
        }
      } catch (error) {
        console.warn('Network status check failed:', error);
        // Fallback to assuming online if detection fails
        setNetworkStatus(prev => ({
          ...prev,
          isConnected: true,
          connectionType: 'unknown',
          isInternetReachable: true,
          lastChecked: new Date(),
        }));
      }
    };

    // Initial check
    checkConnection();

    // Set up periodic checks (every 30 seconds)
    const interval = setInterval(checkConnection, 30000);

    // Web event listeners for online/offline
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setNetworkStatus(prev => ({
          ...prev,
          isConnected: true,
          connectionType: 'web',
          isInternetReachable: true,
          lastChecked: new Date(),
        }));
      };

      const handleOffline = () => {
        setNetworkStatus(prev => ({
          ...prev,
          isConnected: false,
          connectionType: 'none',
          isInternetReachable: false,
          lastChecked: new Date(),
        }));
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        clearInterval(interval);
        if (unsubscribe) unsubscribe();
      };
    }

    return () => {
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return networkStatus;
}
