import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react-native';
import { syncQueue, SyncQueueStatus } from '@/services/syncQueue';

interface SyncProgressProps {
  visible?: boolean;
  onDismiss?: () => void;
}

export function SyncProgress({ visible = true, onDismiss }: SyncProgressProps) {
  const [syncStatus, setSyncStatus] = useState<SyncQueueStatus>({
    pending: 0,
    failed: 0,
    total: 0,
    isProcessing: false,
  });
  const [animValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const unsubscribe = syncQueue.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (visible && (syncStatus.total > 0 || syncStatus.isProcessing)) {
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, syncStatus.total, syncStatus.isProcessing, animValue]);

  const handleRetry = () => {
    syncQueue.retryFailedOperations();
  };

  const handleClearQueue = () => {
    syncQueue.clearQueue();
  };

  if (!visible || (syncStatus.total === 0 && !syncStatus.isProcessing)) {
    return null;
  }

  const progressPercentage = syncStatus.total > 0 
    ? ((syncStatus.total - syncStatus.pending - syncStatus.failed) / syncStatus.total) * 100 
    : 0;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity: animValue,
          transform: [{ translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }) }] 
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Sync Status</Text>
          {onDismiss && (
            <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
              <Text style={styles.dismissText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: syncStatus.failed > 0 ? '#ef4444' : '#10b981'
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {syncStatus.total > 0 ? `${Math.round(progressPercentage)}%` : 'Processing...'}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Clock size={16} color="#6b7280" />
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{syncStatus.pending}</Text>
          </View>

          <View style={styles.statItem}>
            <RefreshCw size={16} color="#6b7280" />
            <Text style={styles.statLabel}>Processing</Text>
            <Text style={styles.statValue}>{syncStatus.isProcessing ? '1' : '0'}</Text>
          </View>

          <View style={styles.statItem}>
            <CheckCircle size={16} color="#6b7280" />
            <Text style={styles.statLabel}>Completed</Text>
            <Text style={styles.statValue}>
              {syncStatus.total - syncStatus.pending - syncStatus.failed}
            </Text>
          </View>

          <View style={styles.statItem}>
            <XCircle size={16} color="#6b7280" />
            <Text style={styles.statLabel}>Failed</Text>
            <Text style={[styles.statValue, { color: syncStatus.failed > 0 ? '#ef4444' : '#6b7280' }]}>
              {syncStatus.failed}
            </Text>
          </View>
        </View>

        {syncStatus.failed > 0 && (
          <View style={styles.failedActions}>
            <Text style={styles.failedText}>
              {syncStatus.failed} item{syncStatus.failed > 1 ? 's' : ''} failed to sync
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <RefreshCw size={16} color="white" />
                <Text style={styles.actionButtonText}>Retry</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearQueue}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {syncStatus.isProcessing && (
          <View style={styles.processingContainer}>
            <View style={styles.spinner} />
            <Text style={styles.processingText}>Syncing data...</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 2,
  },
  failedActions: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  failedText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderTopColor: '#3b82f6',
    animation: 'spin 1s linear infinite',
  },
  processingText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
