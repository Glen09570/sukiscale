import { AppScreen } from '@/components/AppScreen';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { SearchBar } from '@/components/SearchBar';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { CheckSquare2, ClipboardList, Square, Trash2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/**
 * History Screen
 * - Shows transaction history
 * - Search/filter functionality
 */
export default function HistoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { transactions, searchTransactions, refreshData, deleteTransactions } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Delete mode states
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Auto-refresh on mount
  useEffect(() => {
    refreshData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedIds(new Set()); // Clear selections when toggling
  };

  // Toggle selection of a transaction
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all transactions
  const selectAll = () => {
    if (selectedIds.size === displayedTransactions.length) {
      setSelectedIds(new Set()); // Deselect all
    } else {
      setSelectedIds(new Set(displayedTransactions.map(t => t.id)));
    }
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    console.log('=== HANDLE DELETE ===');
    console.log('Selected IDs:', Array.from(selectedIds));
    
    if (selectedIds.size === 0) {
      console.log('No transactions selected, returning');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${selectedIds.size} transaction(s)?`;
    
    // Use window.confirm for web platform (more reliable than Alert.alert on web)
    if (isWeb) {
      console.log('Using web confirm dialog');
      if (window.confirm(confirmMessage)) {
        console.log('Web delete confirmed');
        performDelete();
      } else {
        console.log('Web delete cancelled');
      }
      return;
    }
    
    // Use React Native Alert for mobile
    Alert.alert(
      'Delete Transactions',
      confirmMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: performDelete
        }
      ]
    );
  };
  
  const performDelete = async () => {
    console.log('Delete confirmed, calling deleteTransactions...');
    try {
      const idsToDelete = Array.from(selectedIds);
      console.log('IDs to delete:', idsToDelete);
      await deleteTransactions(idsToDelete);
      console.log('deleteTransactions completed successfully');
      setSelectedIds(new Set());
      setDeleteMode(false);
      console.log('UI state reset after delete');
    } catch (error) {
      console.error('Delete error caught in handler:', error);
      Alert.alert('Error', 'Failed to delete transactions');
    }
  };

  const displayedTransactions = searchQuery.trim()
    ? searchTransactions(searchQuery)
    : transactions;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderTransaction = ({ item }: { item: { id: string; farmerName: string; date: string; finalPayment: number; weight: number } }) => {
    const isSelected = selectedIds.has(item.id);
    
    return (
      <Pressable
        style={[styles.transactionCard, isSelected && styles.selectedCard]}
        onPress={() => {
          if (deleteMode) {
            toggleSelection(item.id);
          } else {
            router.push(`/transactions/receipt?id=${item.id}` as never);
          }
        }}>
        <View style={styles.transactionRow}>
          {deleteMode && (
            <Pressable 
              style={styles.checkbox}
              onPress={() => toggleSelection(item.id)}>
              {isSelected ? (
                <CheckSquare2 size={24} color="#1296F3" />
              ) : (
                <Square size={24} color="#666" />
              )}
            </Pressable>
          )}
          <View style={styles.transactionContent}>
            <View style={styles.transactionHeader}>
              <Text style={styles.farmerName}>{item.farmerName}</Text>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.weight}>{(item.weight || 0).toFixed(2)} kg</Text>
              <Text style={styles.amount}>₱{(item.finalPayment || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const content = (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        placeholder="Search transactions..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Header with Delete Mode Toggle */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Transaction History</Text>
        {displayedTransactions.length > 0 && (
          <Pressable 
            style={[styles.deleteToggle, deleteMode && styles.deleteToggleActive]}
            onPress={toggleDeleteMode}>
            {deleteMode ? (
              <X size={20} color="#fff" />
            ) : (
              <Trash2 size={20} color="#fff" />
            )}
            <Text style={styles.deleteToggleText}>
              {deleteMode ? 'Cancel' : 'Delete'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Delete Mode Toolbar */}
      {deleteMode && displayedTransactions.length > 0 && (
        <View style={styles.deleteToolbar}>
          <Pressable style={styles.selectAllButton} onPress={selectAll}>
            {selectedIds.size === displayedTransactions.length ? (
              <CheckSquare2 size={20} color="#1296F3" />
            ) : (
              <Square size={20} color="#666" />
            )}
            <Text style={styles.selectAllText}>
              {selectedIds.size === displayedTransactions.length ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
          <Text style={styles.selectedCount}>
            {selectedIds.size} selected
          </Text>
          {selectedIds.size > 0 && (
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 size={20} color="#fff" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Summary Stats */}
      {displayedTransactions.length > 0 && (
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{displayedTransactions.length}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              ₱{displayedTransactions.reduce((sum, t) => sum + (t.finalPayment || 0), 0).toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Total Amount</Text>
          </View>
        </View>
      )}

      {/* Transactions List */}
      {displayedTransactions.length > 0 ? (
        <FlatList
          data={displayedTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <ClipboardList size={48} color="#666" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No transactions match your search' : 'No transaction history yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : 'Your completed transactions will appear here'}
          </Text>
        </View>
      )}
    </View>
  );

  if (isDesktop) {
    return (
      <ResponsiveLayout title="History" scrollable={true}>
        {content}
      </ResponsiveLayout>
    );
  }

  return (
    <AppScreen scrollable={false}>
      <TopBar title="History" showHamburger={false} showBack={true} />
      <View style={styles.mobileWrapper}>
        {content}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  mobileWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  list: {
    paddingBottom: 100,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1296F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
  },
  // Header Row
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  deleteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  deleteToggleActive: {
    backgroundColor: '#666',
  },
  deleteToggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Delete Toolbar
  deleteToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectAllText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Transaction Card with Checkbox
  transactionCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#1296F3',
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    padding: 4,
  },
  transactionContent: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weight: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#008000',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  backArrow: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 28,
    color: '#111111',
  },
  emptyPanel: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    padding: 60,
    alignItems: 'center',
    marginTop: 20,
  },
});
