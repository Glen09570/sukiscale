import { AppScreen } from '@/components/AppScreen';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function EditFarmerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getFarmer, updateFarmer } = useApp();
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const farmer = getFarmer(id as string);
      if (farmer) {
        setName(farmer.name);
        setLocation(farmer.location || '');
        setContact(farmer.contact || '');
        setEmail(farmer.email || '');
      } else {
        Alert.alert('Error', 'Farmer not found', [
          { text: 'OK', onPress: () => safeGoBack(router) }
        ]);
      }
    }
  }, [id, getFarmer, router]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter the farmer\'s name');
      return;
    }

    setSaving(true);
    try {
      await updateFarmer(id as string, {
        name: name.trim(),
        location: location.trim() || undefined,
        contact: contact.trim() || undefined,
        email: email.trim() || undefined,
      });
      safeGoBack(router);
    } catch (error) {
      Alert.alert('Error', 'Failed to update farmer');
      console.error('Update farmer error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Edit Farmer" showBack />
      
      <ScrollView style={styles.container}>
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter farmer's full name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location / Barangay</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location or barangay"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={contact}
              onChangeText={setContact}
              placeholder="Enter contact number (optional)"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email for debt notifications (optional)"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttons}>
            <Pressable style={styles.cancelButton} onPress={() => safeGoBack(router)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={saving}>
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save Changes'}
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
    backgroundColor: '#1296F3',
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
