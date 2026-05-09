import { AppScreen } from '@/components/AppScreen';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Farmer {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  location?: string;
  debt_balance: number;
}

export default function FarmerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getFarmer, getFarmerDebt } = useApp();
  const [farmer, setFarmer] = useState<Farmer | null>(null);

  useEffect(() => {
    if (id) {
      const found = getFarmer(id as string);
      if (found) {
        setFarmer(found);
      } else {
        Alert.alert('Error', 'Farmer not found', [
          { text: 'OK', onPress: () => safeGoBack(router) }
        ]);
      }
    }
  }, [id, getFarmer, router]);

  if (!farmer) {
    return (
      <AppScreen scrollable={false}>
        <TopBar title="Farmer Details" showBack onBack={() => router.push('/farmers')} />
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </AppScreen>
    );
  }

  const debt = getFarmerDebt(farmer.id);

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Farmer Details" showBack onBack={() => router.push('/farmers')} />
      
      <ScrollView style={styles.container}>
        {/* Farmer Info Card */}
        <View style={styles.card}>
          <Text style={styles.name}>{farmer.name}</Text>
          
          {farmer.location && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>{farmer.location}</Text>
            </View>
          )}
          
          {farmer.contact && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>{farmer.contact}</Text>
            </View>
          )}
          
          {farmer.email && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{farmer.email}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Debt Balance:</Text>
            <Text style={[styles.value, debt > 0 && styles.debtValue]}>
              ₱{debt.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable 
            style={styles.editButton}
            onPress={() => router.push(`/farmers/edit?id=${farmer.id}` as never)}>
            <Text style={styles.editButtonText}>Edit Farmer</Text>
          </Pressable>
          
          {debt > 0 && (
            <Pressable 
              style={styles.payDebtButton}
              onPress={() => router.push(`/farmers/pay-debt?id=${farmer.id}` as never)}>
              <Text style={styles.payDebtButtonText}>Pay Debt</Text>
            </Pressable>
          )}
          
          <Pressable 
            style={styles.recordDebtButton}
            onPress={() => router.push(`/farmers/record-debt?id=${farmer.id}` as never)}>
            <Text style={styles.recordDebtButtonText}>Record Debt</Text>
          </Pressable>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#DDDDDD',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  debtValue: {
    color: '#FF4444',
  },
  actions: {
    gap: 12,
  },
  editButton: {
    backgroundColor: '#1296F3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  payDebtButton: {
    backgroundColor: '#28A745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payDebtButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recordDebtButton: {
    backgroundColor: '#DC3545',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  recordDebtButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
