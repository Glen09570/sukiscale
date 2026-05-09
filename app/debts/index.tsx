import { AppScreen } from '@/components/AppScreen';
import { FarmerCard } from '@/components/FarmerCard';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { SearchBar } from '@/components/SearchBar';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { AlertCircle, Briefcase, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/**
 * Debt Overview Screen
 * - Three summary cards
 * - Search bar
 * - List of farmers with debt
 */
export default function DebtsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { farmers, getFarmerDebt, searchFarmers, refreshData } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh on mount
  useEffect(() => {
    refreshData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Calculate debt statistics
  const { totalDebt, farmersWithDebt } = useMemo(() => {
    let total = 0;
    let count = 0;
    farmers.forEach((farmer) => {
      const debt = getFarmerDebt(farmer.id);
      if (debt > 0) {
        total += debt;
        count++;
      }
    });
    return { totalDebt: total, farmersWithDebt: count };
  }, [farmers, getFarmerDebt]);

  // Get farmers with debt (searchable)
  const farmersWithDebtList = useMemo(() => {
    const farmersWithDebt = farmers.filter((f) => getFarmerDebt(f.id) > 0);
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      return farmersWithDebt.filter(
        (f) =>
          f.name.toLowerCase().includes(lowerQuery) ||
          f.location?.toLowerCase().includes(lowerQuery)
      );
    }
    return farmersWithDebt;
  }, [farmers, getFarmerDebt, searchQuery]);

  const renderFarmer = ({ item }: { item: { id: string; name: string } }) => (
    <FarmerCard
      name={item.name}
      debt={getFarmerDebt(item.id)}
      onPress={() => router.push(`/farmers/${item.id}` as never)}
    />
  );

  const content = (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar
        placeholder="Search/filter..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Summary Cards Row */}
      <View style={styles.summaryRow}>
        {/* Total Outstanding Debt */}
        <View style={[styles.summaryCard, { backgroundColor: '#1296F3' }]}>
          <Briefcase size={24} color="#FFFFFF" />
          <Text style={styles.cardValue}>₱{totalDebt.toLocaleString()}</Text>
          <Text style={styles.cardLabel}>Total Outstanding Debt</Text>
        </View>

        {/* Farmers with Debt */}
        <View style={[styles.summaryCard, { backgroundColor: '#B72AF2' }]}>
          <Users size={24} color="#FFFFFF" />
          <Text style={styles.cardValue}>{farmersWithDebt}</Text>
          <Text style={styles.cardLabel}>Farmers with Debt</Text>
        </View>

        {/* Overdue Payments */}
        <View style={[styles.summaryCard, { backgroundColor: '#FFC107' }]}>
          <AlertCircle size={24} color="#FFFFFF" />
          <Text style={styles.cardValue}>--</Text>
          <Text style={styles.cardLabel}>Overdue Payments</Text>
        </View>
      </View>

      {/* Farmers with Debt List */}
      <Text style={styles.sectionTitle}>Farmers with Debt</Text>
      {farmersWithDebtList.length > 0 ? (
        <FlatList
          data={farmersWithDebtList}
          renderItem={renderFarmer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.emptyPanel}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No farmers match your search' : 'No farmers with debt'}
          </Text>
        </View>
      )}
    </View>
  );

  if (isDesktop) {
    return (
      <ResponsiveLayout title="Debt Overview" scrollable={true}>
        {content}
      </ResponsiveLayout>
    );
  }

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Debt Overview" showHamburger={false} showBack={true} />
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
  backArrow: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 28,
    color: '#111111',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
    marginTop: 20,
    marginBottom: 12,
  },
  list: {
    paddingBottom: 100,
  },
  emptyPanel: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
