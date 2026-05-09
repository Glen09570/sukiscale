import { AppScreen } from '@/components/AppScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Add Product Screen
 * - Form to add new product
 * - Product name, price, notes fields
 * - Save button
 */
export default function AddProductScreen() {
  const router = useRouter();
  const { addProduct } = useApp();
  const [form, setForm] = useState({
    name: '',
    price: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Please enter a product name');
      return;
    }
    if (!form.price.trim() || isNaN(parseFloat(form.price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setSaving(true);
    await addProduct({
      name: form.name.trim(),
      price: parseFloat(form.price),
      notes: form.notes.trim() || undefined,
    });
    router.replace('/products');
  };

  return (
    <AppScreen>
      <TopBar title="Product Management" showBack />
      
      <View style={styles.container}>
        {/* Heading */}
        <Text style={styles.heading}>Add Product</Text>

        {/* Form Panel */}
        <View style={styles.formPanel}>
          {/* Product Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Enter product name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Price per Kilogram */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Price per Kilogram</Text>
            <TextInput
              style={styles.input}
              value={form.price}
              onChangeText={(text) => updateField('price', text)}
              placeholder="Enter price"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Notes (optional) */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={form.notes}
              onChangeText={(text) => updateField('notes', text)}
              placeholder="Enter notes"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Save Button */}
        <PrimaryButton
          title={saving ? 'Saving...' : 'Save'}
          color="#19F20F"
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 20,
  },
  formPanel: {
    backgroundColor: '#8C8C8C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111111',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
});
