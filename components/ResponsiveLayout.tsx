import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BottomNavigation } from './BottomNavigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface ActionButton {
  icon?: React.ComponentType<{ size?: number; color?: string }>;
  onPress: () => void;
  label: string;
}

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  title?: string;
  showBack?: boolean;
  action?: ActionButton;
}

const WEB_DESKTOP_BREAKPOINT = 1024;

/**
 * ResponsiveLayout - Shared authenticated shell for app screens.
 * - Native mobile and web below 1024px: TopBar + content + BottomNavigation
 * - Web desktop above 1024px: Sidebar + content
 */
export function ResponsiveLayout({
  children,
  scrollable = true,
  title,
  showBack = false,
  action,
}: ResponsiveLayoutProps) {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width > WEB_DESKTOP_BREAKPOINT;

  const content = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scrollView}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  if (isDesktop) {
    const ActionIcon = action?.icon;
    return (
      <View style={styles.desktopContainer}>
        <Sidebar />
        <View style={styles.desktopMain}>
          {title && (
            <View style={styles.desktopHeader}>
              <Text style={styles.desktopTitle}>{title}</Text>
              {action && (
                <Pressable style={styles.actionButton} onPress={action.onPress}>
                  {ActionIcon && <ActionIcon size={20} color="#FFFFFF" />}
                  <Text style={styles.actionButtonText}>{action.label}</Text>
                </Pressable>
              )}
            </View>
          )}
          <View style={styles.desktopContent}>
            {content}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileContainer}>
      <TopBar title={title || ''} showBack={showBack} showHamburger={!showBack} />
      <View style={styles.mobileContent}>
        {content}
      </View>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F4F6F8',
  },
  desktopMain: {
    flex: 1,
    flexDirection: 'column',
    padding: 24,
    gap: 16,
  },
  desktopContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  desktopHeader: {
    paddingHorizontal: 4,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  desktopTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mobileContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
