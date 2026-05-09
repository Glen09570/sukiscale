import { AppScreen } from '@/components/AppScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TopBar } from '@/components/TopBar';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Debt Deduction Screen
 * - Shows farmer with current debt
 * - Three options: Full Payment, Partial, No Deduction
 */
export default function DebtDeductionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  const { farmerName, farmerDebt, totalAmount } = transactionData;

  // Calculate deduction scenarios
  const fullPaymentDebt = Math.min(farmerDebt, totalAmount);
  const remainingAfterFull = totalAmount - fullPaymentDebt;

  // Build query string for navigation
  const buildQueryString = (debtDeducted: number) => {
    const finalAmount = totalAmount - debtDeducted;
    const newDebt = Math.max(0, farmerDebt - debtDeducted);
    const data = {
      ...transactionData,
      debtDeducted: debtDeducted.toString(),
      finalAmount: finalAmount.toString(),
      newDebt: newDebt.toString(),
    };
    return Object.entries(data)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  };

  const handleFullPayment = () => {
    router.push(`/transactions/summary?${buildQueryString(fullPaymentDebt)}` as never);
  };

  const handlePartialPayment = () => {
    router.push(`/transactions/partial-payment?${buildQueryString(0)}` as never);
  };

  const handleNoDeduction = () => {
    router.push(`/transactions/summary?${buildQueryString(0)}` as never);
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
        <Text style={styles.heading}>Debt Deduction</Text>

        {/* Selected Farmer Card */}
        <View style={styles.farmerCard}>
          <View style={styles.farmerInfo}>
            <Text style={styles.farmerLabel}>Farmer:</Text>
            <Text style={styles.farmerName}>{farmerName}</Text>
          </View>
          <View style={styles.debtInfo}>
            <Text style={styles.debtLabel}>Current Debt:</Text>
            <Text style={styles.debtValue}>₱{farmerDebt.toLocaleString()}</Text>
          </View>
        </View>

        {/* Transaction Summary */}
        <View style={styles.transactionSummary}>
          <Text style={styles.summaryLabel}>Transaction Summary:</Text>
          <Text style={styles.summaryText}>{transactionData.weight}kg {transactionData.productName}</Text>
          <Text style={styles.summaryAmount}>₱{totalAmount.toLocaleString()}</Text>
        </View>

        {/* Options Panel */}
        <View style={styles.optionsPanel}>
          <Text style={styles.optionLabel}>Select Option:</Text>

          {farmerDebt > 0 && (
            <PrimaryButton
              title="Full Payment"
              color="#19F20F"
              onPress={handleFullPayment}
            />
          )}

          {farmerDebt > 0 && (
            <PrimaryButton
              title="Partial Payment"
              color="#FF7A2A"
              onPress={handlePartialPayment}
            />
          )}

          <PrimaryButton
            title="No Deduction"
            color="#FF1E1E"
            onPress={handleNoDeduction}
          />
        </View>
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
  optionsPanel: {
    backgroundColor: '#8C8C8C',
    borderRadius: 12,
    padding: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  transactionSummary: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#111111',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111111',
  },
});
