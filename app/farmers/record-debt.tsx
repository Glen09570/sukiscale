import { AppScreen } from '@/components/AppScreen';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RecordDebtScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getFarmer, getFarmerDebt, recordDebt } = useApp();
  
  const [farmerName, setFarmerName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [currentDebt, setCurrentDebt] = useState(0);
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    const debtAmount = parseFloat(amount);
    if (isNaN(debtAmount) || debtAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    setSaving(true);
    await recordDebt(id as string, debtAmount, note.trim() || undefined);
    safeGoBack(router);
  };

  const newBalance = currentDebt + (parseFloat(amount) || 0);

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Record Debt" showBack />
      
      <ScrollView style={styles.container}>
        {/* Farmer Info */}
        <View style={styles.farmerCard}>
          <Text style={styles.farmerName}>{farmerName}</Text>
          <Text style={styles.currentDebt}>Current Debt: ₱{currentDebt.toLocaleString()}</Text>
        </View>

        {/* Debt Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Debt Amount (₱)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter debt amount"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Enter note or reason for debt"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* New Balance Preview */}
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>New Balance After Recording:</Text>
              <Text style={styles.previewValue}>₱{newBalance.toLocaleString()}</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable style={styles.cancelButton} onPress={() => safeGoBack(router)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving}>
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Record Debt'}
              </Text>
            </Pressable>
          </View>
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
    backgroundColor: '#8C8C8C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  farmerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  currentDebt: {
    fontSize: 14,
    color: '#DDDDDD',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111',
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC3545',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#DC3545',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
