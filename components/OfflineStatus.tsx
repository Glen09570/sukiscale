import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncQueue, SyncQueueStatus } from '@/services/syncQueue';

interface OfflineStatusProps {
  style?: any;
}

export function OfflineStatus({ style }: OfflineStatusProps) {
  const networkStatus = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<SyncQueueStatus>({
    pending: 0,
    failed: 0,
    total: 0,
    isProcessing: false,
  });
  const [showDetails, setShowDetails] = useState(false);
  const slideAnim = new Animated.Value(networkStatus.isConnected ? -100 : 0);

  useEffect(() => {
    const unsubscribe = syncQueue.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: networkStatus.isConnected ? -100 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [networkStatus.isConnected, slideAnim]);

  const handleRetrySync = () => {
    syncQueue.retryFailedOperations();
  };

  const getStatusColor = () => {
    if (networkStatus.isConnected === false) return '#ef4444'; // red
    if (syncStatus.failed > 0) return '#f59e0b'; // amber
    if (syncStatus.pending > 0 || syncStatus.isProcessing) return '#3b82f6'; // blue
    return '#10b981'; // green
  };

  const getStatusText = () => {
    if (networkStatus.isConnected === false) return 'Offline';
    if (syncStatus.failed > 0) return `${syncStatus.failed} Failed`;
    if (syncStatus.pending > 0) return `${syncStatus.pending} Pending`;
    if (syncStatus.isProcessing) return 'Syncing...';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (networkStatus.isConnected === false) return WifiOff;
    if (syncStatus.failed > 0) return AlertCircle;
    if (syncStatus.pending > 0 || syncStatus.isProcessing) return RefreshCw;
    return Wifi;
  };

  const Icon = getStatusIcon();

  return (
    <>
      <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }, style]}>
        <View style={[styles.statusBar, { backgroundColor: getStatusColor() }]}>
          <View style={styles.statusContent}>
            <Icon size={16} color="white" />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
          
          {(syncStatus.total > 0 || networkStatus.isConnected === false) && (
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={styles.detailsText}>Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {showDetails && (
        <View style={styles.detailsPanel}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Connection:</Text>
            <Text style={styles.detailValue}>
              {networkStatus.isConnected === false ? 'Offline' : 'Online'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{networkStatus.connectionType || 'Unknown'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pending Sync:</Text>
            <Text style={styles.detailValue}>{syncStatus.pending}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Failed:</Text>
            <Text style={styles.detailValue}>{syncStatus.failed}</Text>
          </View>
          {syncStatus.lastSync && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Activity:</Text>
              <Text style={styles.detailValue}>
                {syncStatus.lastSync.toLocaleTimeString()}
              </Text>
            </View>
          )}
          
          {syncStatus.failed > 0 && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRetrySync}>
              <RefreshCw size={16} color="white" />
              <Text style={styles.retryButtonText}>Retry Failed</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  detailsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  detailsPanel: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    color: '#9ca3af',
    fontSize: 14,
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
