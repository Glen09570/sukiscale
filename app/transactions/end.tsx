import { AppScreen } from '@/components/AppScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TopBar } from '@/components/TopBar';
import { usePrinter } from '@/context/PrinterContext';
import { useRouter } from 'expo-router';
import { Printer } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * End Transaction Screen
 * - Shows green checkmark
 * - Print and Done buttons
 */
export default function EndTransactionScreen() {
  const router = useRouter();
  const { isConnected } = usePrinter();
  const [printerModalVisible, setPrinterModalVisible] = useState(false);

  const handlePrint = () => {
    if (!isConnected) {
      setPrinterModalVisible(true);
      return;
    }
    // Note: For the end screen, we don't have transaction data to print
    // Users should print from the receipt screen instead
    Alert.alert('Info', 'Please print from the receipt screen for detailed transaction information.');
  };

  const handleConnectPrinter = () => {
    setPrinterModalVisible(false);
    Alert.alert('Connect Printer', 'Please go to Settings to connect your Bluetooth printer.');
  };

  return (
    <AppScreen scrollable={false}>
      <TopBar title="End Transaction" showBack />
      
      <View style={styles.container}>
        {/* Green Checkmark */}
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        {/* Success Message */}
        <Text style={styles.successText}>Transaction Completed!</Text>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <View style={styles.buttonHalf}>
            <PrimaryButton
              title="Print"
              color="#1296F3"
              onPress={handlePrint}
            />
          </View>
          <View style={styles.buttonHalf}>
            <PrimaryButton
              title="Done"
              color="#22B58B"
              onPress={() => router.push('/dashboard' as never)}
            />
          </View>
        </View>
      </View>

      {/* Printer Connection Warning Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={printerModalVisible}
        onRequestClose={() => setPrinterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Printer size={48} color="#1296F3" />
            </View>
            <Text style={styles.modalTitle}>Printer Not Connected</Text>
            <Text style={styles.modalDescription}>
              To print receipts, you need to connect to a receipt printer first.
            </Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonSecondary} onPress={() => setPrinterModalVisible(false)}>
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalButtonPrimary} onPress={handleConnectPrinter}>
                <Text style={styles.modalButtonTextPrimary}>Connect Printer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  checkmarkContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#22B58B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 60,
    fontWeight: 'bold',
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 40,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    paddingHorizontal: 20,
  },
  buttonHalf: {
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#1296F3',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
