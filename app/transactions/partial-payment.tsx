import { AppScreen } from '@/components/AppScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TopBar } from '@/components/TopBar';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Partial Payment Screen
 * - Shows farmer with current debt
 * - Input field for partial payment amount
 * - Proceed button
 */
export default function PartialPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [amount, setAmount] = useState('');

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
  }), [params]);

  const handleProceed = () => {
    const paymentAmount = parseFloat(amount) || 0;
    const debtDeducted = Math.min(paymentAmount, transactionData.farmerDebt);
    const finalAmount = transactionData.totalAmount - debtDeducted;
    const newDebt = Math.max(0, transactionData.farmerDebt - debtDeducted);

    const data = {
      ...transactionData,
      debtDeducted: debtDeducted.toString(),
      finalAmount: finalAmount.toString(),
      newDebt: newDebt.toString(),
    };

    const queryString = Object.entries(data)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    router.push(`/transactions/summary?${queryString}` as never);
  };

  return (
    <AppScreen>
      <TopBar title="Debt Deduction" showBack />
      
      <View style={styles.container}>
        {/* Back Arrow */}
        <Pressable style={styles.backArrow} onPress={() => safeGoBack(router)}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        {/* Heading */}
        <Text style={styles.heading}>Partial Payment</Text>

        {/* Selected Farmer Card with Real Data */}
        <View style={styles.farmerCard}>
          <View style={styles.farmerInfo}>
            <Text style={styles.farmerLabel}>Farmer:</Text>
            <Text style={styles.farmerName}>{transactionData.farmerName || '--'}</Text>
          </View>
          <View style={styles.debtInfo}>
            <Text style={styles.debtLabel}>Current Debt:</Text>
            <Text style={styles.debtValue}>₱{(transactionData.farmerDebt || 0).toLocaleString()}</Text>
          </View>
        </View>

        {/* Input Panel */}
        <View style={styles.inputPanel}>
          <Text style={styles.inputLabel}>Enter payment amount:</Text>
          <View style={styles.inputRow}>
            <Text style={styles.pesoSign}>₱</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Proceed Button */}
        <PrimaryButton
          title="Proceed"
          color="#FFC107"
          onPress={handleProceed}
          disabled={!amount}
        />
      </View>
    </AppScreen>
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
  farmerCard: {
    backgroundColor: '#D9D9D9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  farmerInfo: {
    flex: 1,
  },
  farmerLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },
  debtInfo: {
    alignItems: 'flex-end',
  },
  debtLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  debtValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  inputPanel: {
    backgroundColor: '#8C8C8C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  pesoSign: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111111',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
  },
});
