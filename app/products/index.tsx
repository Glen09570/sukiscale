import { AppScreen } from '@/components/AppScreen';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ProductCard } from '@/components/ProductCard';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { Package, Plus, Search, TrendingUp } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

/**
 * Product Management Screen
 * - List of products with prices
 * - Edit buttons
 * - Add product button
 */
export default function ProductsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { products, searchProducts, deleteProduct, refreshData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleBack = () => {
    router.push('/dashboard');
  };

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
    setProductToDelete({ id, name });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      setDeleteModalVisible(false);
      setProductToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setProductToDelete(null);
  };

  const displayedProducts = searchQuery.trim()
    ? searchProducts(searchQuery)
    : products;

  // Stats calculations
  const stats = useMemo(() => {
    if (products.length === 0) return { total: 0, avgPrice: 0 };
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    return {
      total: products.length,
      avgPrice: Math.round(avgPrice),
    };
  }, [products]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderProduct = ({ item }: { item: { id: string; name: string; price: number; updatedAt: string } }) => (
    <ProductCard
      name={item.name}
      price={item.price}
      lastUpdated={formatDate(item.updatedAt)}
      onEdit={() => router.push(`/products/edit?id=${item.id}` as never)}
      onDelete={() => handleDeletePress(item.id, item.name)}
    />
  );

  const content = (
    <View style={styles.container}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Package size={20} color="#008000" />
          </View>
          <View>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, styles.statIconSecondary]}>
            <TrendingUp size={20} color="#1296F3" />
          </View>
          <View>
            <Text style={styles.statValue}>₱{stats.avgPrice.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Avg. Price</Text>
          </View>
        </View>
      </View>

      {/* Search Bar with Icon */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.heading}>Product List</Text>
        <Text style={styles.subheading}>{displayedProducts.length} item{displayedProducts.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Products List */}
      {displayedProducts.length > 0 ? (
        <FlatList
          data={displayedProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Package size={48} color="#CCC" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No matches found' : 'No products yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery ? 'Try a different search term' : "Add your first product to get started"}
          </Text>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Product"
        message={productToDelete ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.` : ''}
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
        title="Product Management"
        scrollable={true}
        action={{
          onPress: () => router.push('/products/add' as never),
          label: 'Add Product',
        }}>
        {content}
      </ResponsiveLayout>
    );
  }

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Product Management" showBack onBack={handleBack} />

      <View style={styles.mobileWrapper}>
        <View style={styles.mobileContent}>
          {content}
        </View>
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/products/add' as never)}>
          <Plus size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  mobileWrapper: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  mobileContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statIconSecondary: {
    backgroundColor: '#E3F2FD',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // Search Section
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
  },
  subheading: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  // List
  list: {
    paddingBottom: 100,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  // FAB
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
