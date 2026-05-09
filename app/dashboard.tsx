import { AppScreen } from '@/components/AppScreen';
import { DashboardButton } from '@/components/DashboardButton';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { TopBar } from '@/components/TopBar';
import { WebDashboard } from '@/components/WebDashboard';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { History, Package, Scale, ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

/**
 * Mobile Dashboard Content
 */
function MobileDashboard() {
  const router = useRouter();
  const { transactions, farmers, refreshData } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Refresh timeout')), 10000)
      );
      await Promise.race([refreshData(), timeoutPromise]);
    } catch (error) {
      console.warn('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    
    // Today's transactions
    const todayTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === now.getFullYear() &&
             tDate.getMonth() === now.getMonth() &&
             tDate.getDate() === now.getDate();
    });
    
    // This week's transactions (Monday to Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= weekStart;
    });
    
    // This month's transactions
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= monthStart;
    });
    
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.finalPayment || 0), 0);
    const weekRevenue = weekTransactions.reduce((sum, t) => sum + (t.finalPayment || 0), 0);
    const monthRevenue = monthTransactions.reduce((sum, t) => sum + (t.finalPayment || 0), 0);
    
    // Calculate total pending debt directly from farmers array
    const totalPendingDebt = farmers.reduce((sum, f) => sum + (f.debt_balance || 0), 0);
    
    return {
      todayRevenue,
      weekRevenue,
      monthRevenue,
      todayCount: todayTransactions.length,
      totalFarmers: farmers.length,
      pendingDebts: totalPendingDebt,
    };
  }, [transactions, farmers]);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Welcome Heading with Logo */}
      <View style={styles.welcomeContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/icons/icon-1024.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Welcome Ka Suki!</Text>
          <Text style={styles.welcomeSubtext}>SukiScale Dashboard</Text>
        </View>
      </View>

      {/* Revenue Overview Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Revenue Overview</Text>
        <View style={styles.statsGrid}>
          <MobileStatCard 
            value={`₱${stats.todayRevenue.toLocaleString()}`}
            label="Today's Revenue"
            icon={TrendingUp}
            color="#10B981"
            bgColor="rgba(16, 185, 129, 0.1)"
          />
          <MobileStatCard 
            value={`₱${stats.weekRevenue.toLocaleString()}`}
            label="Week Revenue"
            icon={TrendingUp}
            color="#059669"
            bgColor="rgba(5, 150, 105, 0.1)"
          />
          <MobileStatCard 
            value={`₱${stats.monthRevenue.toLocaleString()}`}
            label="Month Revenue"
            icon={TrendingUp}
            color="#047857"
            bgColor="rgba(4, 120, 87, 0.1)"
          />
        </View>
      </View>

      {/* Business Metrics Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Business Metrics</Text>
        <View style={styles.statsGrid}>
          <MobileStatCard 
            value={stats.todayCount.toString()}
            label="Today's Txns"
            icon={ShoppingCart}
            color="#1296F3"
            bgColor="rgba(18, 150, 243, 0.1)"
          />
          <MobileStatCard 
            value={stats.totalFarmers.toString()}
            label="Farmers"
            icon={Users}
            color="#8B5CF6"
            bgColor="rgba(139, 92, 246, 0.1)"
          />
          <MobileStatCard 
            value={`₱${stats.pendingDebts.toLocaleString()}`}
            label="Debts"
            icon={Wallet}
            color="#F59E0B"
            bgColor="rgba(245, 158, 11, 0.1)"
          />
        </View>
      </View>

      {/* Dashboard Buttons */}
      <View style={styles.buttonContainer}>
        <DashboardButton
          title="New Transaction"
          icon={Scale}
          color="#1296F3"
          onPress={() => router.push('/transactions/new' as never)}
        />
        <DashboardButton
          title="Farmers"
          icon={Users}
          color="#B72AF2"
          onPress={() => router.push('/farmers' as never)}
        />
        <DashboardButton
          title="History"
          icon={History}
          color="#FFC107"
          onPress={() => router.push('/history' as never)}
        />
        <DashboardButton
          title="Debt Overview"
          icon={Wallet}
          color="#808080"
          onPress={() => router.push('/debts' as never)}
        />
        <DashboardButton
          title="Product & Price Management"
          icon={Package}
          color="#19F20F"
          onPress={() => router.push('/products' as never)}
        />
      </View>
    </ScrollView>
  );
}

/**
 * Dashboard Screen
 * - Desktop: Sidebar + Full width WebDashboard
 * - Mobile: TopBar + Mobile layout
 */
export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;

  // Use responsive layout for desktop, AppScreen for mobile
  if (isDesktop) {
    return (
      <ResponsiveLayout title="Dashboard" scrollable={true}>
        <WebDashboard />
      </ResponsiveLayout>
    );
  }

  return (
    <AppScreen scrollable={true}>
      <TopBar title="Dashboard" showHamburger />
      <MobileDashboard />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    backgroundColor: '#F8F9FA',
  },
  welcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.12)',
    } as any),
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  buttonContainer: {
    flex: 1,
    paddingTop: 8,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 0,
  },
});

// Mobile Stat Card Component
interface MobileStatCardProps {
  value: string;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  bgColor: string;
}

function MobileStatCard({ value, label, icon: Icon, color, bgColor }: MobileStatCardProps) {
  return (
    <View style={[mobileStyles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[mobileStyles.iconContainer, { backgroundColor: bgColor }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={[mobileStyles.statValue, { color }]}>{value}</Text>
      <Text style={mobileStyles.statLabel}>{label}</Text>
    </View>
  );
}

const mobileStyles = StyleSheet.create({
  statCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    marginBottom: 4,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    } as any),
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
});
