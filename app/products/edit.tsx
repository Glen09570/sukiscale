import { AppScreen } from '@/components/AppScreen';
import { PrimaryButton } from '@/components/PrimaryButton';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { safeGoBack } from '@/utils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Edit Product Screen
 * - Form to edit existing product
 * - Same fields as Add Product
 * - Save button
 */
export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getProduct, updateProduct } = useApp();
  const [form, setForm] = useState({
    name: '',
    price: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const product = getProduct(id as string);
    if (product) {
      setForm({
        name: product.name,
        price: product.price.toString(),
        notes: product.notes || '',
      });
    }
    setLoading(false);
  }, [id, getProduct]);

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
    try {
      const productId = String(id || '');
      if (!productId) {
        throw new Error('Invalid product ID');
      }
      await updateProduct(productId, {
        name: form.name.trim(),
        price: parseFloat(form.price),
        notes: form.notes.trim() || undefined,
      });
      router.replace('/products' as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
      console.error('Update product error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppScreen>
        <TopBar title="Product Management" showBack />
        <View style={styles.container}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <TopBar title="Product Management" showBack />
      
      <View style={styles.container}>
        {/* Back Arrow */}
        <Pressable style={styles.backArrow} onPress={() => safeGoBack(router)}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        {/* Heading */}
        <Text style={styles.heading}>Edit Product</Text>

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
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});
