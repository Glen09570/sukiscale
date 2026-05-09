import { AppScreen } from '@/components/AppScreen';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { FarmerCard } from '@/components/FarmerCard';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { SearchBar } from '@/components/SearchBar';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/**
 * Farmers List Screen
 * - Top bar with title
 * - Search bar
 * - List of farmer cards with debt
 * - Plus button at bottom right
 */
export default function FarmersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { farmers, getFarmerDebt, searchFarmers, deleteFarmer, refreshData, isLoading } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [farmerToDelete, setFarmerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh on mount to load latest Firebase data
  useEffect(() => {
    refreshData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDeletePress = (id: string, name: string) => {
    setFarmerToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (farmerToDelete) {
      await deleteFarmer(farmerToDelete.id);
      setDeleteModalVisible(false);
      setFarmerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setFarmerToDelete(null);
  };

  const displayedFarmers = searchQuery.trim()
    ? searchFarmers(searchQuery)
    : farmers;

  const renderFarmer = ({ item }: { item: { id: string; name: string } }) => (
    <FarmerCard
      name={item.name}
      debt={getFarmerDebt(item.id)}
      onPress={() => router.push(`/farmers/${item.id}` as never)}
      onDelete={() => handleDeletePress(item.id, item.name)}
    />
  );

  const content = (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        placeholder="Search farmers..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Heading */}
      <Text style={styles.heading}>List of Farmers (Suki)</Text>

      {/* Farmers List */}
      {displayedFarmers.length > 0 ? (
        <FlatList
          data={displayedFarmers}
          renderItem={renderFarmer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.panel}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No farmers match your search' : 'No farmers registered yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'Try a different search term' : "Tap + to add your first farmer"}
          </Text>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Farmer"
        message={farmerToDelete ? `Are you sure you want to delete "${farmerToDelete.name}"? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        destructive
      />
    </View>
  );

  if (isDesktop) {
    return (
      <ResponsiveLayout
        title="Farmers"
        scrollable={true}
        action={{
          icon: Plus,
          onPress: () => router.push('/farmers/add' as never),
          label: 'Add Farmer',
        }}>
        {content}
      </ResponsiveLayout>
    );
  }

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Farmers" showHamburger={false} showBack={true} />
      <View style={styles.mobileWrapper}>
        {content}
        <Pressable style={styles.fab} onPress={() => router.push('/farmers/add' as never)}>
          <Plus size={28} color="#FFFFFF" />
        </Pressable>
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
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 12,
    marginTop: 8,
  },
  panel: {
    backgroundColor: '#8C8C8C',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#DDDDDD',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#008000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
