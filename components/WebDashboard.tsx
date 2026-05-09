import { useApp } from '@/context/AppContext';
import { ShoppingCart, TrendingUp, Users, Wallet } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface DashboardCardProps {
  title: string;
  icon: string;
  color: string;
  description: string;
  onPress: () => void;
}

function DashboardCard({ title, icon, color, description, onPress }: DashboardCardProps) {
  const [hovered, setHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      style={[
        styles.card, 
        hovered && isWeb && styles.cardHovered,
        { borderTopColor: color, borderTopWidth: 4 }
      ]}
      onPress={onPress}
      onHoverIn={() => isWeb && setHovered(true)}
      onHoverOut={() => isWeb && setHovered(false)}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.cardTitle, hovered && isWeb && styles.cardTitleHovered]}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </Pressable>
  );
}

/**
 * WebDashboard - Full-width dashboard layout for desktop
 */
export function WebDashboard() {
  const { transactions, farmers } = useApp();

  // Calculate stats
  const todayStats = useMemo(() => {
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
      totalTransactions: transactions.length,
      totalFarmers: farmers.length,
      pendingDebts: totalPendingDebt,
    };
  }, [transactions, farmers]);

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back, Ka Suki! 👋</Text>
          <Text style={styles.subtext}>Here's what's happening today</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</Text>
        </View>
      </View>

      {/* Revenue Stats Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Revenue Overview</Text>
        <View style={styles.statsRow}>
          <StatCard 
            title="Today's Revenue" 
            value={`₱${todayStats.todayRevenue.toLocaleString()}`}
            icon={TrendingUp}
            color="#10B981"
            gradient="rgba(16, 185, 129, 0.15)"
          />
          <StatCard 
            title="Week Revenue" 
            value={`₱${todayStats.weekRevenue.toLocaleString()}`}
            icon={TrendingUp}
            color="#059669"
            gradient="rgba(5, 150, 105, 0.15)"
          />
          <StatCard 
            title="Month Revenue" 
            value={`₱${todayStats.monthRevenue.toLocaleString()}`}
            icon={TrendingUp}
            color="#047857"
            gradient="rgba(4, 120, 87, 0.15)"
          />
        </View>
      </View>

      {/* Business Stats Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Business Metrics</Text>
        <View style={styles.statsRow}>
          <StatCard 
            title="Today's Transactions" 
            value={todayStats.todayCount.toString()}
            icon={ShoppingCart}
            color="#1296F3"
            gradient="rgba(18, 150, 243, 0.15)"
          />
          <StatCard 
            title="Total Farmers" 
            value={todayStats.totalFarmers.toString()}
            icon={Users}
            color="#8B5CF6"
            gradient="rgba(139, 92, 246, 0.15)"
          />
          <StatCard 
            title="Pending Debts" 
            value={`₱${todayStats.pendingDebts.toLocaleString()}`}
            icon={Wallet}
            color="#F59E0B"
            gradient="rgba(245, 158, 11, 0.15)"
          />
        </View>
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityCard}>
        {recentTransactions.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityText}>No recent activity</Text>
            <Text style={styles.emptyActivitySubtext}>Your transactions will appear here</Text>
          </View>
        ) : (
          recentTransactions.map((transaction, index) => (
            <View key={transaction.id}>
              <View style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: '#1296F3' }]} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    Transaction with {transaction.farmerName}
                    {transaction.productName && ` • ${transaction.productName}`}
                  </Text>
                  <Text style={styles.activityTime}>{formatTimeAgo(transaction.date)}</Text>
                </View>
                <Text style={styles.activityAmount}>
                  ₱{transaction.totalAmount.toLocaleString()}
                </Text>
              </View>
              {index < recentTransactions.length - 1 && <View style={styles.activityDivider} />}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// New StatCard Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  color: string;
  gradient: string;
}

function StatCard({ title, value, icon: Icon, color, gradient }: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  const webProps = isWeb ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <View 
      style={[
        styles.statCard,
        hovered && isWeb && styles.statCardHovered,
        { borderLeftColor: color, borderLeftWidth: 4 }
      ]}
      {...webProps}>
      <View style={[styles.statIconContainer, { backgroundColor: gradient }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  dateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 4,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    } as any),
  },
  date: {
    fontSize: 14,
    color: '#444',
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 16,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 8,
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    } as any),
  },
  statCardHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    transform: [{ scale: 1.03 }, { translateY: -4 }],
    elevation: 12,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    } as any),
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 30,
  },
  card: {
    width: '31%',
    minWidth: 280,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 8,
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    } as any),
  },
  cardHovered: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    transform: [{ scale: 1.02 }, { translateY: -4 }],
    elevation: 12,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    } as any),
  },
  cardTitleHovered: {
    color: '#008000',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 8,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    } as any),
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: '#999',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 15,
    color: '#111',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
});
