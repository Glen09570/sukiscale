import { AppScreen } from '@/components/AppScreen';
import { HoverPressable } from '@/components/HoverPressable';
import { ThemedText } from '@/components/themed-text';
import { TopBar } from '@/components/TopBar';
import { Colors } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { safeGoBack } from '@/utils';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AddFarmerScreen() {
  const router = useRouter();
  const { addFarmer } = useApp();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter the farmer\'s name');
      return;
    }

    setSaving(true);
    await addFarmer({
      name: name.trim(),
      location: location.trim() || undefined,
      contact: contact.trim() || undefined,
      email: email.trim() || undefined,
    });
    safeGoBack(router);
  };

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Add Farmer" showBack />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
      <View style={styles.header}>
        <Text style={styles.title}>Add Farmer</Text>
        <Text style={styles.description}>
          Add a new farmer to your records
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Full Name</ThemedText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter farmer's full name"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Location / Barangay</ThemedText>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location or barangay"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Contact Number</ThemedText>
          <TextInput
            style={styles.input}
            value={contact}
            onChangeText={setContact}
            placeholder="Enter contact number (optional)"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Email Address</ThemedText>
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

        <View style={styles.buttonGroup}>
          <HoverPressable
            style={styles.cancelButton}
            hoverStyle={styles.cancelButtonHover}
            onPress={() => safeGoBack(router)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </HoverPressable>
          <HoverPressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            hoverStyle={styles.saveButtonHover}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Farmer'}
            </Text>
          </HoverPressable>
        </View>
      </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
  },
  description: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#111',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#374151',
  },
  // Hover effects (web only)
  saveButtonHover: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonHover: {
    transform: [{ scale: 1.02 }],
    backgroundColor: '#bbb',
  },
});
