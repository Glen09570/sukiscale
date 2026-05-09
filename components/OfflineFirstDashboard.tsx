import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  Cloud, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Sync,
  Settings,
  Info
} from 'lucide-react-native';
import { useEnhancedApp } from '@/context/EnhancedAppContext';
import { OfflineStatus } from './OfflineStatus';
import { SyncProgress } from './SyncProgress';

interface OfflineFirstDashboardProps {
  onSettingsPress?: () => void;
}

export function OfflineFirstDashboard({ onSettingsPress }: OfflineFirstDashboardProps) {
  const { 
    networkStatus, 
    syncStatus, 
    conflicts, 
    getCacheStats, 
    forceSync,
    clearCache,
    refreshData 
  } = useEnhancedApp();

  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    setCacheStats(getCacheStats());
  }, [getCacheStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      setCacheStats(getCacheStats());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleForceSync = async () => {
    await forceSync();
    setCacheStats(getCacheStats());
  };

  const handleClearCache = async () => {
    await clearCache();
    setCacheStats(getCacheStats());
  };

  const getConnectionStatus = () => {
    if (networkStatus.isConnected === false) {
      return { status: 'Offline', color: '#ef4444', icon: WifiOff };
    }
    if (networkStatus.isConnected === true) {
      return { status: 'Online', color: '#10b981', icon: Wifi };
    }
    return { status: 'Checking...', color: '#f59e0b', icon: Wifi };
  };

  const getSyncStatus = () => {
    if (syncStatus.isProcessing) {
      return { status: 'Syncing...', color: '#3b82f6', icon: Sync };
    }
    if (syncStatus.failed > 0) {
      return { status: `${syncStatus.failed} Failed`, color: '#ef4444', icon: AlertTriangle };
    }
    if (syncStatus.pending > 0) {
      return { status: `${syncStatus.pending} Pending`, color: '#f59e0b', icon: Clock };
    }
    return { status: 'Synced', color: '#10b981', icon: CheckCircle };
  };

  const connectionStatus = getConnectionStatus();
  const syncStatusInfo = getSyncStatus();
  const ConnectionIcon = connectionStatus.icon;
  const SyncIcon = syncStatusInfo.icon;

  return (
    <View style={styles.container}>
      <OfflineStatus />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Main Status Cards */}
        <View style={styles.statusCards}>
          {/* Connection Status */}
          <View style={[styles.statusCard, { borderLeftColor: connectionStatus.color }]}>
            <View style={styles.statusHeader}>
              <ConnectionIcon size={20} color={connectionStatus.color} />
              <Text style={styles.statusTitle}>Connection</Text>
            </View>
            <Text style={[styles.statusValue, { color: connectionStatus.color }]}>
              {connectionStatus.status}
            </Text>
            <Text style={styles.statusDetail}>
              {networkStatus.connectionType || 'Unknown'} • {networkStatus.isInternetReachable !== false ? 'Internet' : 'No Internet'}
            </Text>
          </View>

          {/* Sync Status */}
          <View style={[styles.statusCard, { borderLeftColor: syncStatusInfo.color }]}>
            <View style={styles.statusHeader}>
              <SyncIcon size={20} color={syncStatusInfo.color} />
              <Text style={styles.statusTitle}>Sync</Text>
            </View>
            <Text style={[styles.statusValue, { color: syncStatusInfo.color }]}>
              {syncStatusInfo.status}
            </Text>
            <Text style={styles.statusDetail}>
              {syncStatus.total} total operations
            </Text>
          </View>

          {/* Cache Status */}
          <View style={[styles.statusCard, { borderLeftColor: '#8b5cf6' }]}>
            <View style={styles.statusHeader}>
              <Database size={20} color="#8b5cf6" />
              <Text style={styles.statusTitle}>Cache</Text>
            </View>
            <Text style={[styles.statusValue, { color: '#8b5cf6' }]}>
              {cacheStats?.totalEntries || 0} items
            </Text>
            <Text style={styles.statusDetail}>
              {cacheStats?.hitRate ? `${Math.round(cacheStats.hitRate * 100)}% hit rate` : 'No data'}
            </Text>
          </View>

          {/* Conflicts */}
          <View style={[styles.statusCard, { borderLeftColor: conflicts.length > 0 ? '#ef4444' : '#10b981' }]}>
            <View style={styles.statusHeader}>
              <AlertTriangle size={20} color={conflicts.length > 0 ? '#ef4444' : '#10b981'} />
              <Text style={styles.statusTitle}>Conflicts</Text>
            </View>
            <Text style={[styles.statusValue, { color: conflicts.length > 0 ? '#ef4444' : '#10b981' }]}>
              {conflicts.length} unresolved
            </Text>
            <Text style={styles.statusDetail}>
              {conflicts.length > 0 ? 'Needs attention' : 'All resolved'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
              onPress={handleForceSync}
              disabled={!networkStatus.isConnected || syncStatus.isProcessing}
            >
              <Cloud size={16} color="white" />
              <Text style={styles.actionButtonText}>Force Sync</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#8b5cf6' }]}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Info size={16} color="white" />
              <Text style={styles.actionButtonText}>Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              onPress={handleClearCache}
            >
              <Database size={16} color="white" />
              <Text style={styles.actionButtonText}>Clear Cache</Text>
            </TouchableOpacity>

            {onSettingsPress && (
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                onPress={onSettingsPress}
              >
                <Settings size={16} color="white" />
                <Text style={styles.actionButtonText}>Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Detailed Information */}
        {showDetails && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>System Details</Text>
            
            <View style={styles.detailGroup}>
              <Text style={styles.detailGroupTitle}>Network Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{connectionStatus.status}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{networkStatus.connectionType || 'Unknown'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Internet:</Text>
                <Text style={styles.detailValue}>
                  {networkStatus.isInternetReachable !== false ? 'Available' : 'Unavailable'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Checked:</Text>
                <Text style={styles.detailValue}>
                  {networkStatus.lastChecked?.toLocaleTimeString() || 'Never'}
                </Text>
              </View>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailGroupTitle}>Sync Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pending:</Text>
                <Text style={styles.detailValue}>{syncStatus.pending}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Failed:</Text>
                <Text style={styles.detailValue}>{syncStatus.failed}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Processing:</Text>
                <Text style={styles.detailValue}>{syncStatus.isProcessing ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Sync:</Text>
                <Text style={styles.detailValue}>
                  {syncStatus.lastSync?.toLocaleTimeString() || 'Never'}
                </Text>
              </View>
            </View>

            <View style={styles.detailGroup}>
              <Text style={styles.detailGroupTitle}>Cache Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Entries:</Text>
                <Text style={styles.detailValue}>{cacheStats?.totalEntries || 0}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Size:</Text>
                <Text style={styles.detailValue}>
                  {cacheStats?.totalSize ? `${Math.round(cacheStats.totalSize / 1024)} KB` : '0 KB'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hit Rate:</Text>
                <Text style={styles.detailValue}>
                  {cacheStats?.hitRate ? `${Math.round(cacheStats.hitRate * 100)}%` : 'N/A'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Cleanup:</Text>
                <Text style={styles.detailValue}>
                  {cacheStats?.lastCleanup?.toLocaleTimeString() || 'Never'}
                </Text>
              </View>
            </View>

            {conflicts.length > 0 && (
              <View style={styles.detailGroup}>
                <Text style={styles.detailGroupTitle}>Conflicts</Text>
                {conflicts.slice(0, 3).map((conflict, index) => (
                  <View key={conflict.id} style={styles.conflictItem}>
                    <Text style={styles.conflictType}>
                      {conflict.entityType} - {conflict.id}
                    </Text>
                    <Text style={styles.conflictTime}>
                      {new Date(conflict.timestamp).toLocaleString()}
                    </Text>
                  </View>
                ))}
                {conflicts.length > 3 && (
                  <Text style={styles.moreConflicts}>
                    ...and {conflicts.length - 3} more conflicts
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <SyncProgress visible={syncStatus.total > 0 || syncStatus.isProcessing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  statusCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDetail: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsSection: {
    padding: 16,
    paddingTop: 0,
  },
  detailGroup: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  conflictItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  conflictType: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  conflictTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  moreConflicts: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});
