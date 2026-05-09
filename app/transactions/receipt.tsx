import { AppScreen } from '@/components/AppScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { usePrinter } from '@/context/PrinterContext';
import { sendTransactionReceipt } from '@/services/emailService';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Printer } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

// Helper component for receipt rows
function ReceiptRow({ 
  label, 
  value, 
  isBold = false,
  valueColor = '#111111'
}: { 
  label: string; 
  value: string; 
  isBold?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={styles.receiptRow}>
      <Text style={[styles.receiptLabel, isBold && styles.boldText]}>{label}</Text>
      <Text style={[styles.receiptValue, isBold && styles.boldText, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

/**
 * Receipt Screen
 * - Shows final receipt with real transaction data
 * - Print and Done buttons
 */
export default function ReceiptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getTransaction, getFarmer } = useApp();
  const { isConnected, printReceipt } = usePrinter();
  const [transaction, setTransaction] = useState<ReturnType<typeof getTransaction>>(undefined);
  const [printerModalVisible, setPrinterModalVisible] = useState(false);

  useEffect(() => {
    if (id) {
      const t = getTransaction(id as string);
      setTransaction(t);
    }
  }, [id, getTransaction]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = async () => {
    if (!transaction) return;

    if (Platform.OS === 'web') {
      // Web: Print directly using browser
      await printReceipt({
        farmerName: transaction.farmerName || 'Unknown',
        productName: transaction.productName || 'N/A',
        weight: transaction.weight || 0,
        pricePerKilo: transaction.pricePerKilo || 0,
        totalAmount: transaction.totalAmount || 0,
        debtDeducted: transaction.debtDeducted || 0,
        finalPayment: transaction.finalPayment || 0,
        date: transaction.date || new Date().toISOString(),
      });
      return;
    }

    // Mobile: Check if printer is connected
    if (!isConnected) {
      setPrinterModalVisible(true);
      return;
    }

    await printReceipt({
      farmerName: transaction.farmerName || 'Unknown',
      productName: transaction.productName || 'N/A',
      weight: transaction.weight || 0,
      pricePerKilo: transaction.pricePerKilo || 0,
      totalAmount: transaction.totalAmount || 0,
      debtDeducted: transaction.debtDeducted || 0,
      finalPayment: transaction.finalPayment || 0,
      date: transaction.date || new Date().toISOString(),
    });
  };

  const handleConnectPrinter = () => {
    setPrinterModalVisible(false);
    Alert.alert('Connect Printer', 'Please go to Settings to connect your Bluetooth printer.');
  };

  const handleDone = async () => {
    if (!transaction) {
      router.push('/dashboard' as never);
      return;
    }

    // Get farmer details to retrieve email
    const farmer = getFarmer(transaction.farmerId);
    
    if (farmer?.email) {
      console.log('Sending transaction receipt to:', farmer.email);
      
      try {
        await sendTransactionReceipt({
          to_email: farmer.email,
          farmer_name: farmer.name,
          product_name: transaction.productName || 'N/A',
          weight: transaction.weight || 0,
          price_per_kg: transaction.pricePerKilo || 0,
          total_amount: transaction.totalAmount || 0,
          debt_deducted: transaction.debtDeducted || 0,
          final_payment: transaction.finalPayment || 0,
          transaction_date: formatDate(transaction.date || new Date().toISOString()),
          receipt_number: transaction.id,
        });
        console.log('Transaction receipt email sent successfully');
      } catch (error) {
        console.error('Failed to send transaction receipt email:', error);
        // Don't block navigation if email fails
      }
    } else {
      console.log('No email available for farmer, skipping receipt email');
    }

    // Navigate to dashboard
    router.push('/dashboard' as never);
  };

  if (!transaction) {
    return (
      <AppScreen>
        <TopBar title="Receipt" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1296F3" />
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <TopBar title="Receipt" showBack />
      
      <View style={styles.container}>
        {/* Back Arrow */}
        <Pressable style={styles.backArrow} onPress={() => safeGoBack(router)}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        {/* Heading */}
        <Text style={styles.heading}>Receipt</Text>

        {/* Receipt Card with Real Data */}
        <View style={styles.receiptCard}>
          {/* Brand */}
          <View style={styles.brandSection}>
            <Text style={styles.brandText}>SukiScale</Text>
            <Text style={styles.brandIcon}>⚖️</Text>
          </View>

          {/* Receipt Details */}
          <View style={styles.detailsSection}>
            <ReceiptRow label="Farmer:" value={transaction.farmerName || '--'} />
            <ReceiptRow label="Product:" value={transaction.productName || 'N/A'} />
            <ReceiptRow label="Weight:" value={`${(transaction.weight || 0).toFixed(2)} kg`} />
            <ReceiptRow label="Price/kg:" value={`₱${(transaction.pricePerKilo || 0).toFixed(2)}`} />
            
            <View style={styles.divider} />
            
            <ReceiptRow 
              label="Total:" 
              value={`₱${(transaction.totalAmount || 0).toLocaleString()}`} 
              isBold 
            />
            {(transaction.debtDeducted || 0) > 0 && (
              <ReceiptRow 
                label="Debt Paid:" 
                value={`₱${(transaction.debtDeducted || 0).toLocaleString()}`} 
                valueColor="#e74c3c" 
              />
            )}
            
            <View style={styles.divider} />
            
            <ReceiptRow 
              label="Final Payment:" 
              value={`₱${(transaction.finalPayment || 0).toLocaleString()}`} 
              isBold 
              valueColor="#008000" 
            />
            <ReceiptRow label="Date:" value={formatDate(transaction.date)} />
          </View>
        </View>

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
              onPress={handleDone}
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  backArrow: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 28,
    color: '#111111',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 20,
  },
  receiptCard: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008000',
  },
  brandIcon: {
    fontSize: 32,
    marginTop: 4,
  },
  detailsSection: {
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
  },
  receiptValue: {
    fontSize: 14,
    color: '#111111',
    fontWeight: '600',
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#999',
    marginVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
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
