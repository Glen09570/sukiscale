import { AppScreen } from '@/components/AppScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Pay Debt Screen
 * - Shows farmer with current debt
 * - Input field for payment amount
 * - Record payment button
 */
export default function PayDebtScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getFarmer, getFarmerDebt, recordDebtPayment } = useApp();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [currentDebt, setCurrentDebt] = useState(0);

  useEffect(() => {
    if (id) {
      const farmer = getFarmer(id as string);
      if (farmer) {
        setFarmerName(farmer.name);
        setCurrentDebt(getFarmerDebt(farmer.id));
      } else {
        Alert.alert('Error', 'Farmer not found', [
          { text: 'OK', onPress: () => safeGoBack(router) }
        ]);
      }
    }
  }, [id, getFarmer, getFarmerDebt, router]);

  const handlePayDebt = async () => {
    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }
    if (paymentAmount > currentDebt) {
      Alert.alert('Error', 'Payment amount cannot exceed the current debt');
      return;
    }

    setLoading(true);
    try {
      // Record debt payment (negative amount reduces debt)
      await recordDebtPayment(id as string, -paymentAmount, note.trim() || undefined);
      Alert.alert(
        'Payment Recorded',
        `₱${paymentAmount.toLocaleString()} has been recorded as debt payment.`,
        [{ text: 'OK', onPress: () => safeGoBack(router) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Pay Debt" showBack />
      
      <ScrollView style={styles.container}>
        {/* Farmer Info Card */}
        <View style={styles.farmerCard}>
          <Text style={styles.farmerName}>{farmerName}</Text>
          <Text style={styles.currentDebtLabel}>Current Debt</Text>
          <Text style={styles.currentDebtValue}>₱{currentDebt.toLocaleString()}</Text>
        </View>

        {/* Payment Form */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Payment Amount (₱)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Note (Optional)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={note}
            onChangeText={setNote}
            placeholder="e.g., Cash payment, Bank transfer..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={2}
          />

          {/* Remaining Debt Preview */}
          {amount ? (
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Remaining Debt After Payment:</Text>
              <Text style={styles.previewValue}>
                ₱{Math.max(0, currentDebt - parseFloat(amount) || 0).toLocaleString()}
              </Text>
            </View>
          ) : null}

          <PrimaryButton
            title={loading ? "Processing..." : "Record Payment"}
            color="#008000"
            onPress={handlePayDebt}
            disabled={loading || !amount || parseFloat(amount) <= 0}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  farmerCard: {
    backgroundColor: '#242424',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  farmerName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  currentDebtLabel: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 4,
  },
  currentDebtValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  noteInput: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  previewBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#008000',
  },
});
