import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'expo-router';
import {
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Scale,
  Settings,
  Users,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface NavItemType {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  path: string;
  color: string;
}

const NAV_ITEMS: NavItemType[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', color: '#FFFFFF' },
  { label: 'Farmers', icon: Users, path: '/farmers', color: '#FFFFFF' },
  { label: 'Transaction', icon: Scale, path: '/transactions/new', color: '#FFFFFF' },
  { label: 'History', icon: History, path: '/history', color: '#FFFFFF' },
  { label: 'Debts', icon: Wallet, path: '/debts', color: '#FFFFFF' },
  { label: 'Products', icon: Package, path: '/products', color: '#FFFFFF' },
  { label: 'Settings', icon: Settings, path: '/settings', color: '#FFFFFF' },
];

/**
 * Sidebar - Desktop navigation sidebar
 */
export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Image 
            source={require('../assets/images/icon.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={styles.brandText}>SukiScale</Text>
          <Text style={styles.brandSubtext}>Farm management</Text>
        </View>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <NavItem
              key={item.path}
              item={item}
              isActive={isActive}
              onPress={() => router.push(item.path as never)}
            />
          );
        })}
      </View>

      <View style={styles.footer}>
        {user && (
          <Pressable
            style={styles.logoutButton}
            onPress={async () => {
              await logout();
              router.replace('/login' as never);
            }}
          >
            <LogOut size={18} color="#B42318" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function NavItem({ item, isActive, onPress }: { item: NavItemType; isActive: boolean; onPress: () => void }) {
  const [hovered, setHovered] = useState(false);
  const isWeb = Platform.OS === 'web';
  const Icon = item.icon;

  return (
    <Pressable
      style={[
        styles.navItem,
        isActive && styles.navItemActive,
        hovered && isWeb && styles.navItemHover,
      ]}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
    >
      <View style={styles.iconContainer}>
        <Icon size={18} color={isActive ? '#0F766E' : '#475467'} />
      </View>
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingVertical: 24,
    paddingHorizontal: 18,
    ...(Platform.OS === 'web' && {
      boxShadow: '4px 0 24px rgba(15, 23, 42, 0.06)',
    } as any),
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
    letterSpacing: -0.2,
  },
  brandSubtext: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },
  logo: {
    width: 80,
    height: 80,
  },
  nav: {
    flex: 1,
  },
  iconContainer: {
    width: 28,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  navItemActive: {
    backgroundColor: '#ECFDF3',
  },
  navItemHover: {
    backgroundColor: '#F9FAFB',
  },
  navLabel: {
    fontSize: 14,
    color: '#344054',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#0F766E',
    fontWeight: '600',
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FEE4E2',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B42318',
  },
});
