import { Colors } from '@/constants/theme';
import { usePathname, useRouter } from 'expo-router';
import {
    History,
    LayoutDashboard,
    Package,
    Settings,
    Users,
} from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface NavItemType {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  path: string;
}

const NAV_ITEMS: NavItemType[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Farmers', icon: Users, path: '/farmers' },
  { label: 'History', icon: History, path: '/history' },
  { label: 'Debts', icon: Package, path: '/debts' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

interface BottomNavItemProps {
  item: NavItemType;
  isActive: boolean;
  onPress: () => void;
}

function BottomNavItem({ item, isActive, onPress }: BottomNavItemProps) {
  const IconComponent = item.icon;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.navItem,
        isActive && styles.navItemActive,
      ]}
    >
      <IconComponent
        size={24}
        color={isActive ? Colors.success : '#666'}
      />
      <Text style={[
        styles.navLabel,
        isActive && styles.navLabelActive,
      ]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

/**
 * BottomNavigation - Minimalist bottom navigation for mobile
 * Shows on mobile/tablet, hidden on web desktop
 */
export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
        return (
          <BottomNavItem
            key={item.path}
            item={item}
            isActive={isActive}
            onPress={() => router.push(item.path as never)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingBottom: Platform.OS === 'web' ? 0 : 20, // Safe area for notch
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: '#F0F8F0',
    borderRadius: 12,
  },
  navLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  navLabelActive: {
    color: Colors.success,
    fontWeight: '600',
  },
});
