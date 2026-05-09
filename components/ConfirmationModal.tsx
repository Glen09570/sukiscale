import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmationModalProps) {
  const [cancelHovered, setCancelHovered] = useState(false);
  const [confirmHovered, setConfirmHovered] = useState(false);
  const isWeb = Platform.OS === 'web';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.buttonRow}>
              <Pressable 
                style={[styles.cancelButton, cancelHovered && isWeb && styles.cancelButtonHovered]} 
                onPress={onCancel}
                onHoverIn={() => isWeb && setCancelHovered(true)}
                onHoverOut={() => isWeb && setCancelHovered(false)}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmButton,
                  destructive && styles.destructiveButton,
                  confirmHovered && isWeb && styles.confirmButtonHovered,
                ]}
                onPress={onConfirm}
                onHoverIn={() => isWeb && setConfirmHovered(true)}
                onHoverOut={() => isWeb && setConfirmHovered(false)}>
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    padding: 32,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    } as any),
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    color: '#666',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    transform: [{ scale: 1 }],
    ...(Platform.OS === 'web' && { transition: 'all 0.2s ease' } as any),
  },
  cancelButtonHovered: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    transform: [{ scale: 1.02 }],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1296F3',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    transform: [{ scale: 1 }],
    elevation: 4,
    ...(Platform.OS === 'web' && { 
      boxShadow: '0 4px 8px rgba(18, 150, 243, 0.3)',
      transition: 'all 0.2s ease' 
    } as any),
  },
  confirmButtonHovered: {
    transform: [{ scale: 1.05 }],
    elevation: 6,
    ...(Platform.OS === 'web' && { 
      boxShadow: '0 8px 12px rgba(18, 150, 243, 0.4)',
    } as any),
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
    elevation: 4,
    ...(Platform.OS === 'web' && { 
      boxShadow: '0 4px 8px rgba(220, 38, 38, 0.3)',
    } as any),
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
