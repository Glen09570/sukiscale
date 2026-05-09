import { Edit3, Package, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface ProductCardProps {
  name: string;
  price: number;
  lastUpdated: string;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * ProductCard - Glassmorphism design with enhanced animations
 */
export function ProductCard({ name, price, lastUpdated, onEdit, onDelete }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [editHovered, setEditHovered] = useState(false);
  const [deleteHovered, setDeleteHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  const cardWebProps = isWeb ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <View 
      style={[styles.card, hovered && isWeb && styles.cardHovered]}
      {...cardWebProps}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Package size={24} color="#008000" />
      </View>
      
      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, hovered && isWeb && styles.nameHovered]}>{name}</Text>
        <Text style={[styles.price, hovered && isWeb && styles.priceHovered]}>
          ₱{price.toLocaleString()}/kg
        </Text>
        <Text style={styles.updated}>Updated {lastUpdated}</Text>
      </View>
      
      {/* Actions */}
      <View style={styles.buttons}>
        <Pressable 
          style={[styles.actionButton, styles.editButton, editHovered && isWeb && styles.editButtonHovered]}
          onPress={onEdit}
          onHoverIn={() => isWeb && setEditHovered(true)}
          onHoverOut={() => isWeb && setEditHovered(false)}>
          <Edit3 size={18} color={editHovered && isWeb ? '#FFFFFF' : '#1296F3'} />
        </Pressable>
        <Pressable 
          style={[styles.actionButton, styles.deleteButton, deleteHovered && isWeb && styles.deleteButtonHovered]}
          onPress={onDelete}
          onHoverIn={() => isWeb && setDeleteHovered(true)}
          onHoverOut={() => isWeb && setDeleteHovered(false)}>
          <Trash2 size={18} color={deleteHovered && isWeb ? '#FFFFFF' : '#DC2626'} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && { 
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    } as any),
  },
  cardHovered: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.01 }, { translateY: -2 }],
    elevation: 6,
    borderColor: 'rgba(0, 128, 0, 0.2)',
    ...(Platform.OS === 'web' && { 
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    } as any),
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
    ...(Platform.OS === 'web' && { transition: 'color 0.3s ease' } as any),
  },
  nameHovered: {
    color: '#008000',
  },
  price: {
    fontSize: 15,
    color: '#008000',
    fontWeight: '700',
    marginTop: 4,
    ...(Platform.OS === 'web' && { transition: 'transform 0.3s ease' } as any),
  },
  priceHovered: {
    transform: [{ scale: 1.02 }],
  },
  updated: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && { transition: 'all 0.2s ease' } as any),
  },
  editButton: {
    backgroundColor: '#E3F2FD',
  },
  editButtonHovered: {
    backgroundColor: '#1296F3',
    transform: [{ scale: 1.08 }],
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  deleteButtonHovered: {
    backgroundColor: '#DC2626',
    transform: [{ scale: 1.08 }],
  },
});
