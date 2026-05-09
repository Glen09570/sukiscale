import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { ChevronLeft, LogOut, Menu, Settings, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

const isWeb = Platform.OS === 'web';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showHamburger?: boolean;
  showLogout?: boolean;
}

export function TopBar({ title, showBack = false, onBack, showHamburger = false, showLogout = true }: TopBarProps) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    router.replace('/login' as never);
  };

  const handleSettings = () => {
    setMenuOpen(false);
    router.push('/settings' as never);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack && (
          <Pressable 
            onPress={handleBack} 
            style={styles.iconButton}>
            <ChevronLeft size={20} color="#1F2937" />
          </Pressable>
        )}
        {showHamburger && !showBack && (
          <Pressable 
            style={styles.iconButton}
            onPress={() => setMenuOpen(true)}>
            <Menu size={20} color="#1F2937" />
          </Pressable>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.rightSection} />

      <Modal
        visible={menuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <Pressable style={styles.closeButton} onPress={() => setMenuOpen(false)}>
                <X size={18} color="#344054" />
              </Pressable>
            </View>
            
            {user && (
              <View style={styles.userInfo}>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            )}

            <Pressable 
              style={[styles.menuItem, styles.settingsItem]}
              onPress={handleSettings}>
              <Settings size={18} color="#344054" />
              <Text style={styles.settingsMenuText}>Settings</Text>
            </Pressable>

            {showLogout && user && (
              <Pressable 
                style={[styles.menuItem, styles.logoutItem]}
                onPress={handleLogout}>
                <LogOut size={18} color="#B42318" />
                <Text style={styles.logoutMenuText}>Logout</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: isWeb ? 72 : 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    ...(isWeb && {
      boxShadow: '0 1px 0 rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)',
    } as any),
  },
  leftSection: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 44,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  title: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: isWeb ? 72 : 68,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAECF0',
    ...(isWeb && {
      boxShadow: '0 20px 40px rgba(15, 23, 42, 0.14)',
    } as any),
    ...(!isWeb && {
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    }),
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAECF0',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
  },
  userInfo: {
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  userEmail: {
    fontSize: 14,
    color: '#475467',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  settingsItem: {
    backgroundColor: '#F9FAFB',
  },
  settingsMenuText: {
    fontSize: 16,
    color: '#344054',
    fontWeight: '600',
  },
  logoutItem: {
    backgroundColor: '#FEF3F2',
    borderColor: '#FEE4E2',
  },
  logoutMenuText: {
    fontSize: 16,
    color: '#B42318',
    fontWeight: '600',
  },
});
