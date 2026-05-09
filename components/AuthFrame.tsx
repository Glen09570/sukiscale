import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Logo } from './Logo';

interface AuthFrameProps {
  badge: string;
  title: string;
  subtitle: string;
  emblem: string;
  accent: string;
  accentSoft?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthFrame({
  badge,
  title,
  subtitle,
  emblem,
  accent,
  accentSoft = '#D8F3EE',
  children,
  footer,
}: AuthFrameProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(580, Math.max(320, width - 32));

  return (
    <View style={styles.shell}>
      <View style={[styles.blob, styles.blobTop, { backgroundColor: '#DCEEFF' }]} />
      <View style={[styles.blob, styles.blobBottom, { backgroundColor: accentSoft }]} />

      <View style={styles.stage}>
        <View style={[styles.brandBadge, { backgroundColor: `${accent}14` }]}>
          <Logo size="medium" showText={true} />
        </View>

        <View style={[styles.card, { width: cardWidth }]}>
          <View style={styles.headerRow}>
            <View style={[styles.emblem, { backgroundColor: accentSoft }]}>
              <Text style={styles.emblemText}>{emblem}</Text>
            </View>
            <View style={styles.headerText}>
              <View style={[styles.badgePill, { backgroundColor: `${accent}14` }]}>
                <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
              </View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.body}>{children}</View>
        </View>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F3F7FB',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.95,
  },
  blobTop: {
    width: 260,
    height: 260,
    top: -90,
    right: -90,
  },
  blobBottom: {
    width: 240,
    height: 240,
    bottom: -120,
    left: -100,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  brandBadge: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    } as any),
  },
  logoIconText: {
    fontSize: 18,
  },
  brandBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE6F2',
    paddingHorizontal: 24,
    paddingVertical: 24,
    elevation: 10,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 18px 30px rgba(15, 23, 42, 0.12)',
    } as any),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 24,
  },
  emblem: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(15, 118, 110, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  emblemText: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  badgePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 14.5,
    lineHeight: 21,
    color: '#4B5B73',
  },
  body: {
    gap: 16,
  },
  footer: {
    marginTop: 18,
    alignItems: 'center',
  },
});