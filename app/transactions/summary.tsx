import { AppScreen } from '@/components/AppScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TopBar } from '@/components/TopBar';
import { AppTransaction, useApp } from '@/context/AppContext';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Transaction Summary Screen
 * - Shows complete transaction breakdown
 * - Cancel and Confirm buttons
 * - Actually saves transaction to database
 */
export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addTransaction } = useApp();
  const [saving, setSaving] = useState(false);

  // Extract transaction data from query params
  const transactionData = useMemo(() => ({
    farmerId: params.farmerId as string,
    farmerName: params.farmerName as string,
    farmerDebt: parseFloat(params.farmerDebt as string) || 0,
    productId: params.productId as string,
    productName: params.productName as string,
    pricePerKilo: parseFloat(params.pricePerKilo as string) || 0,
    weight: parseFloat(params.weight as string) || 0,
    totalAmount: parseFloat(params.totalAmount as string) || 0,
    debtDeducted: parseFloat(params.debtDeducted as string) || 0,
    finalAmount: parseFloat(params.finalAmount as string) || 0,
  }), [params]);

  const handleConfirm = async () => {
    if (!transactionData.farmerId) {
      Alert.alert('Error', 'Missing farmer information');
      return;
    }
    
    setSaving(true);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<AppTransaction>((_, reject) => {
        setTimeout(() => reject(new Error('Transaction save timeout')), 10000);
      });

      // Save transaction to database with timeout
      const savedTransaction = await Promise.race([
        addTransaction({
          farmerId: transactionData.farmerId,
          farmerName: transactionData.farmerName,
          productId: transactionData.productId,
          productName: transactionData.productName,
          pricePerKilo: transactionData.pricePerKilo,
          weight: transactionData.weight,
          totalAmount: transactionData.totalAmount,
          debtDeducted: transactionData.debtDeducted,
          finalPayment: transactionData.finalAmount,
          weights: [transactionData.weight],
        }),
        timeoutPromise
      ]);

      setSaving(false);
      
      if (savedTransaction && savedTransaction.id) {
        // Navigate to receipt with saved transaction ID
        router.push(`/transactions/receipt?id=${savedTransaction.id}` as never);
      } else {
        throw new Error('Invalid transaction response');
      }
    } catch (error) {
      setSaving(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save transaction';
      console.error('Transaction save error:', error);
      
      if (errorMessage.includes('timeout')) {
        Alert.alert('Timeout', 'Transaction is taking too long. Please check your connection and try again.');
      } else {
        Alert.alert('Error', 'Failed to save transaction. Please try again.');
      }
    }
  };

  const handleCancel = () => {
    router.push('/dashboard' as never);
  };

  return (
    <AppScreen>
      <TopBar title="Transaction Summary" showBack />
      
      <View style={styles.container}>
        {/* Back Arrow */}
        <Pressable style={styles.backArrow} onPress={() => safeGoBack(router)}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        {/* Heading */}
        <Text style={styles.heading}>Transaction Summary</Text>

        {/* Summary Card with Real Data */}
        <View style={styles.summaryCard}>
          <SummaryRow label="Farmer:" value={transactionData.farmerName || '--'} />
          <SummaryRow label="Product:" value={transactionData.productName || 'N/A'} />
          <SummaryRow label="Weight:" value={`${(transactionData.weight || 0).toFixed(2)} kg`} />
          <SummaryRow label="Price/kg:" value={`₱${(transactionData.pricePerKilo || 0).toFixed(2)}`} />
          
          <View style={styles.divider} />
          
          <SummaryRow label="Total:" value={`₱${(transactionData.totalAmount || 0).toLocaleString()}`} isBold />
          <SummaryRow 
            label="Debt Deducted:" 
            value={`₱${(transactionData.debtDeducted || 0).toLocaleString()}`} 
            valueColor="#e74c3c" 
          />
          
          <View style={styles.divider} />
          
          <SummaryRow 
            label="Final Payment:" 
            value={`₱${(transactionData.finalAmount || 0).toLocaleString()}`} 
            isBold 
            valueColor="#008000" 
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <View style={styles.buttonHalf}>
            <PrimaryButton
              title="Cancel"
              color="#FF1E1E"
              onPress={handleCancel}
              disabled={saving}
            />
          </View>
          <View style={styles.buttonHalf}>
            {saving ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : (
              <PrimaryButton
                title="Confirm"
                color="#008000"
                onPress={handleConfirm}
              />
            )}
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

// Helper component for summary rows
function SummaryRow({ 
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
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isBold && styles.boldText]}>{label}</Text>
      <Text style={[styles.summaryValue, isBold && styles.boldText, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
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
  summaryCard: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
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
  loadingButton: {
    backgroundColor: '#008000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.7,
  },
});
