import { ChevronRight, Trash2, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface FarmerCardProps {
  name: string;
  debt: number;
  onPress: () => void;
  onDelete?: () => void;
}

/**
 * FarmerCard - Glassmorphism design with enhanced animations
 */
export function FarmerCard({ name, debt, onPress, onDelete }: FarmerCardProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      style={[
        styles.card,
        hovered && isWeb && styles.cardHovered,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      onHoverIn={() => isWeb && setHovered(true)}
      onHoverOut={() => isWeb && setHovered(false)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}>
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, hovered && isWeb && styles.iconHovered]}>
          <User size={24} color={hovered && isWeb ? '#008000' : '#666'} />
        </View>
        <View>
          <Text style={[styles.name, hovered && isWeb && styles.nameHovered]}>{name}</Text>
          <Text style={[styles.debtLabel, hovered && isWeb && styles.debtHovered]}>
            Debt: ₱{(debt || 0).toLocaleString()}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        {onDelete && (
          <Pressable 
            style={[
              styles.deleteButton,
              deleteHovered && isWeb && styles.deleteButtonHovered,
            ]}
            onPress={onDelete}
            onHoverIn={() => isWeb && setDeleteHovered(true)}
            onHoverOut={() => isWeb && setDeleteHovered(false)}>
            <Trash2 size={18} color="#FFFFFF" />
          </Pressable>
        )}
        <ChevronRight 
          size={24} 
          color={hovered && isWeb ? '#008000' : '#666'} 
          style={[styles.chevron, hovered && isWeb && styles.chevronHovered]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && { 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    } as any),
  },
  cardHovered: {
    backgroundColor: '#F9FAFB',
    transform: [{ scale: 1.01 }],
    elevation: 6,
    borderColor: '#D1D5DB',
    ...(Platform.OS === 'web' && { 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    } as any),
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    elevation: 2,
    ...(Platform.OS === 'web' && { 
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
    } as any),
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && { transition: 'all 0.3s ease' } as any),
  },
  iconHovered: {
    backgroundColor: 'rgba(0, 128, 0, 0.15)',
    transform: [{ scale: 1.05 }],
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    ...(Platform.OS === 'web' && { transition: 'color 0.3s ease' } as any),
  },
  nameHovered: {
    color: '#008000',
  },
  debtLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
    ...(Platform.OS === 'web' && { transition: 'color 0.3s ease' } as any),
  },
  debtHovered: {
    color: '#444',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    padding: 10,
    borderRadius: 10,
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && { transition: 'all 0.2s ease' } as any),
  },
  deleteButtonHovered: {
    backgroundColor: '#B91C1C',
    transform: [{ scale: 1.1 }],
  },
  chevron: {
    transform: [{ translateX: 0 }],
    ...(Platform.OS === 'web' && { transition: 'all 0.3s ease' } as any),
  },
  chevronHovered: {
    transform: [{ translateX: 4 }],
  },
});
