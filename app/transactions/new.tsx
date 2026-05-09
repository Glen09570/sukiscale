import { AppScreen } from '@/components/AppScreen';
import { HoverPressable } from '@/components/HoverPressable';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { safeGoBack } from '@/utils';
import { useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

/**
 * New Transaction Screen
 * - Shows selected farmer with current debt
 * - Product type selection
 * - Price per kilo display
 * - Weight input
 * - Computation box
 * - Proceed button
 */
export default function NewTransactionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  const { farmers, products, getFarmerDebt } = useApp();

  // Form state
  const [selectedFarmer, setSelectedFarmer] = useState<{ id: string; name: string } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; price: number } | null>(null);
  const [pricePerKilo, setPricePerKilo] = useState('');
  const [weights, setWeights] = useState<string[]>(['']); // Array of weight entries
  const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Get farmer's debt
  const farmerDebt = selectedFarmer ? getFarmerDebt(selectedFarmer.id) : 0;

  // Filtered lists
  const filteredFarmers = useMemo(() => {
    if (!farmerSearch.trim()) return farmers;
    const query = farmerSearch.toLowerCase();
    return farmers.filter(f => f.name.toLowerCase().includes(query));
  }, [farmers, farmerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const query = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(query));
  }, [products, productSearch]);

  // Calculate total weight and total amount
  const { totalWeight, total } = useMemo(() => {
    const sum = weights.reduce((acc, w) => acc + (parseFloat(w) || 0), 0);
    const amount = sum * (parseFloat(pricePerKilo) || 0);
    return { totalWeight: sum, total: amount };
  }, [weights, pricePerKilo]);

  // Weight entry handlers
  const updateWeight = (index: number, value: string) => {
    const newWeights = [...weights];
    newWeights[index] = value;
    setWeights(newWeights);
  };

  const addWeightEntry = () => {
    setWeights([...weights, '']);
  };

  const removeWeightEntry = (index: number) => {
    if (weights.length > 1) {
      const newWeights = weights.filter((_, i) => i !== index);
      setWeights(newWeights);
    }
  };

  // Handle product selection
  const handleSelectProduct = (product: { id: string; name: string; price: number }) => {
    setSelectedProduct(product);
    setPricePerKilo(product.price.toString());
    setShowProductDropdown(false);
  };

  // Handle farmer selection
  const handleSelectFarmer = (farmer: { id: string; name: string }) => {
    setSelectedFarmer(farmer);
    setShowFarmerDropdown(false);
  };

  // Handle proceed
  const handleProceed = () => {
    if (!selectedFarmer) {
      Alert.alert('Error', 'Please select a farmer');
      return;
    }
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a product');
      return;
    }
    if (totalWeight <= 0) {
      Alert.alert('Error', 'Please enter at least one valid weight');
      return;
    }
    if (!pricePerKilo || parseFloat(pricePerKilo) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Navigate to debt deduction with transaction data
    const transactionData = {
      farmerId: selectedFarmer.id,
      farmerName: selectedFarmer.name,
      farmerDebt: farmerDebt.toString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      pricePerKilo: pricePerKilo,
      weight: totalWeight.toString(),
      totalAmount: total.toString(),
    };

    const queryString = Object.entries(transactionData)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    router.push(`/transactions/debt-deduction?${queryString}` as never);
  };

  const content = (
    <View style={styles.container}>
      {/* Back Arrow - only on mobile */}
      {!isDesktop && (
        <HoverPressable style={styles.backArrow} hoverStyle={styles.backArrowHover} onPress={() => safeGoBack(router)}>
          <ArrowLeft size={28} color="#111111" />
        </HoverPressable>
      )}

      {/* Farmer Selection - Inline Dropdown */}
      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Select Farmer:</Text>
        {selectedFarmer ? (
          <View style={styles.selectedFarmerCard}>
            <View style={styles.farmerInfo}>
              <Text style={styles.selectedName}>{selectedFarmer.name}</Text>
              <Text style={styles.selectedSubtext}>Current Debt: ₱{farmerDebt.toLocaleString()}</Text>
            </View>
            <HoverPressable onPress={() => setShowFarmerDropdown(!showFarmerDropdown)} hoverStyle={styles.changeTextHover}>
              {showFarmerDropdown ? <ChevronUp size={20} color="#1296F3" /> : <ChevronDown size={20} color="#1296F3" />}
            </HoverPressable>
          </View>
        ) : (
          <HoverPressable style={styles.selectButton} hoverStyle={styles.selectButtonHover} onPress={() => setShowFarmerDropdown(!showFarmerDropdown)}>
            <Text style={styles.selectButtonText}>Choose a farmer...</Text>
            {showFarmerDropdown ? <ChevronUp size={16} color="#666" /> : <ChevronDown size={16} color="#666" />}
          </HoverPressable>
        )}
        
        {/* Farmer Dropdown Panel */}
        {showFarmerDropdown && (
          <View style={styles.inlineDropdown}>
            <TextInput
              style={[styles.inlineSearch, styles.inputHover]}
              placeholder="Search farmers..."
              value={farmerSearch}
              onChangeText={setFarmerSearch}
            />
            <ScrollView style={styles.inlineList} nestedScrollEnabled>
              {filteredFarmers.map((item) => (
                <HoverPressable
                  key={item.id}
                  style={styles.dropdownItem}
                  hoverStyle={styles.dropdownItemHover}
                  onPress={() => handleSelectFarmer(item)}>
                  <Text style={styles.dropdownItemText}>{item.name}</Text>
                  <Text style={styles.dropdownItemSubtext}>Debt: ₱{getFarmerDebt(item.id).toLocaleString()}</Text>
                </HoverPressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Product Selection - Inline Dropdown */}
      <View style={styles.panel}>
        <Text style={styles.panelLabel}>Product Type:</Text>
        {selectedProduct ? (
          <View style={styles.selectedProductRow}>
            <View>
              <Text style={styles.selectedName}>{selectedProduct.name}</Text>
              <Text style={styles.selectedSubtext}>₱{selectedProduct.price}/kg</Text>
            </View>
            <HoverPressable onPress={() => setShowProductDropdown(!showProductDropdown)} hoverStyle={styles.changeTextHover}>
              {showProductDropdown ? <ChevronUp size={20} color="#1296F3" /> : <ChevronDown size={20} color="#1296F3" />}
            </HoverPressable>
          </View>
        ) : (
          <HoverPressable style={styles.selectButton} hoverStyle={styles.selectButtonHover} onPress={() => setShowProductDropdown(!showProductDropdown)}>
            <Text style={styles.selectButtonText}>Select product...</Text>
            {showProductDropdown ? <ChevronUp size={16} color="#666" /> : <ChevronDown size={16} color="#666" />}
          </HoverPressable>
        )}
        
        {/* Product Dropdown Panel */}
        {showProductDropdown && (
          <View style={styles.inlineDropdown}>
            <TextInput
              style={styles.inlineSearch}
              placeholder="Search products..."
              value={productSearch}
              onChangeText={setProductSearch}
            />
            <ScrollView style={styles.inlineList} nestedScrollEnabled>
              {filteredProducts.map((item) => (
                <HoverPressable
                  key={item.id}
                  style={styles.dropdownItem}
                  hoverStyle={styles.dropdownItemHover}
                  onPress={() => handleSelectProduct(item)}>
                  <Text style={styles.dropdownItemText}>{item.name}</Text>
                  <Text style={styles.dropdownItemSubtext}>₱{item.price}/kg</Text>
                </HoverPressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Weight Entries */}
        <View style={styles.weightHeader}>
          <Text style={styles.panelLabel}>Weight Entries (kg):</Text>
          <Text style={styles.totalWeightLabel}>Total: {totalWeight.toFixed(2)} kg</Text>
        </View>
        
        {weights.map((weight, index) => (
          <View key={index} style={styles.weightRow}>
            <Text style={styles.weightIndex}>#{index + 1}</Text>
            <TextInput
              style={styles.weightInputSmall}
              value={weight}
              onChangeText={(value) => updateWeight(index, value)}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
            <Text style={styles.weightUnit}>kg</Text>
            {weights.length > 1 && (
              <HoverPressable style={styles.removeBtn} hoverStyle={styles.removeBtnHover} onPress={() => removeWeightEntry(index)}>
                <X size={18} color="#FF4444" />
              </HoverPressable>
            )}
          </View>
        ))}
        
        <HoverPressable style={styles.addWeightBtn} hoverStyle={styles.addWeightBtnHover} onPress={addWeightEntry}>
          <View style={styles.addWeightContent}>
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addWeightBtnText}>Add Another Weight Entry</Text>
          </View>
        </HoverPressable>
      </View>

      {/* Price and Computation Box */}
      {selectedProduct && (
        <View style={styles.priceDisplayBox}>
          <Text style={styles.priceDisplayLabel}>Price per Kilo:</Text>
          <Text style={styles.priceDisplayValue}>₱{selectedProduct.price}/kg</Text>
        </View>
      )}
      <View style={styles.computationBox}>
        <Text style={styles.computationLabel}>Total Amount:</Text>
        <Text style={styles.computationValue}>
          ₱{total > 0 ? total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
        </Text>
      </View>

      {/* Proceed Button */}
      <PrimaryButton
        title="Proceed"
        color="#FFC107"
        onPress={handleProceed}
        disabled={!selectedFarmer || !selectedProduct || totalWeight <= 0 || !pricePerKilo}
      />
    </View>
  );

  if (isDesktop) {
    return (
      <ResponsiveLayout title="New Transaction" scrollable={true}>
        {content}
      </ResponsiveLayout>
    );
  }

  return (
    <AppScreen scrollable={false}>
      <TopBar title="New Transaction" showBack />
      <ScrollView style={styles.mobileScroll} contentContainerStyle={styles.mobileContent}>
        {content}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  mobileScroll: {
    flex: 1,
  },
  mobileContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
  },
  backArrow: {
    marginBottom: 16,
  },
  backArrowHover: {
    opacity: 0.7,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 24,
  },
  // Card Styles - White cards with shadow
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    elevation: 3,
  },
  panelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // Selection Button Styles
  selectButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  selectButtonHover: {
    backgroundColor: '#F0F0F0',
    borderColor: '#008000',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  // Selected Item Styles
  selectedFarmerCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedProductRow: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  farmerInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 4,
  },
  selectedSubtext: {
    fontSize: 14,
    color: '#008000',
    fontWeight: '500',
  },
  changeTextHover: {
    opacity: 0.7,
  },
  // Dropdown Styles
  inlineDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    elevation: 5,
  },
  inlineSearch: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111',
    margin: 12,
  },
  inlineList: {
    maxHeight: 200,
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listItemHover: {
    backgroundColor: '#F8F9FA',
  },
  listItemText: {
    fontSize: 15,
    color: '#111',
    fontWeight: '500',
  },
  listItemSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  // Weight Entry Styles
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  totalWeightLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008000',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  weightIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 30,
  },
  weightInputSmall: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  removeWeightBtn: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  removeWeightBtnHover: {
    backgroundColor: '#FECACA',
  },
  addWeightBtn: {
    backgroundColor: '#008000',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  addWeightBtnHover: {
    backgroundColor: '#006400',
  },
  addWeightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addWeightBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Price Display
  priceDisplayBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  priceDisplayLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceDisplayValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008000',
  },
  // Total Amount Box
  computationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#008000',
    boxShadow: '0 4px 12px rgba(0,128,0,0.15)',
    elevation: 4,
  },
  computationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  computationValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#008000',
  },
  // Deprecated styles kept for compatibility
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#111111',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  priceBox: {
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  priceText: {
    fontSize: 14,
    color: '#111111',
  },
  weightInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111111',
  },
  compRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compLabel: {
    fontSize: 14,
    color: '#666',
  },
  compValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111111',
  },
  dropdownItemHover: {
    backgroundColor: '#E8F4FD',
    transform: [{ scale: 1.01 }],
  },
  // JSX compatibility styles
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inputHover: {
    // Applied as default style for visual feedback
  },
  weightUnit: {
    fontSize: 14,
    color: '#666',
    width: 30,
  },
  removeBtn: {
    padding: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  removeBtnHover: {
    backgroundColor: '#FECACA',
    transform: [{ scale: 1.1 }],
  },
});
