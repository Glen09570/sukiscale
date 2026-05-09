import { AppScreen } from '@/components/AppScreen';
import { ThemedText } from '@/components/themed-text';
import { TopBar } from '@/components/TopBar';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { usePrinter } from '@/context/PrinterContext';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Bluetooth, BluetoothConnected, Building2, ChevronRight, Download, FileJson, FileSpreadsheet, Printer, Trash2, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

interface AppSettings {
  businessName: string;
}

const STORAGE_KEY = 'sukiscale_settings';

export default function SettingsScreen() {
  const { farmers, products, transactions, clearAllData } = useApp();
  const { user } = useAuth();
  const { isConnected, printerInfo, isScanning, availablePrinters, scanForPrinters, connectToPrinter, disconnectPrinter } = usePrinter();
  const router = useRouter();
  
  // Settings state
  const [settings, setSettings] = useState<AppSettings>({
    businessName: 'My Trading Business',
  });
  
  // Modal states
  const [businessModalVisible, setBusinessModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [clearDataModalVisible, setClearDataModalVisible] = useState(false);
  const [printerModalVisible, setPrinterModalVisible] = useState(false);
  const [tempBusinessName, setTempBusinessName] = useState('');

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setSuccessModalVisible(true);
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (Platform.OS === 'web') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } else {
        // For native, we'd use AsyncStorage or SQLite
        // For now, keep defaults
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      setSettings(newSettings);
      if (Platform.OS === 'web') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        window.alert('Success! Settings saved.');
      }
      // For native, save to AsyncStorage
    } catch (error) {
      console.error('Error saving settings:', error);
      if (Platform.OS === 'web') {
        window.alert('Error: Failed to save settings');
      }
    }
  };

  const handleSaveBusinessName = () => {
    if (tempBusinessName.trim()) {
      saveSettings({ ...settings, businessName: tempBusinessName.trim() });
      setBusinessModalVisible(false);
    }
  };

  const openBusinessModal = () => {
    setTempBusinessName(settings.businessName);
    setBusinessModalVisible(true);
  };

  // Request storage permissions for Android
  const requestStoragePermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Storage permission is needed to export files. Please enable it in app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => MediaLibrary.presentPermissionsPickerAsync() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const exportToJSON = async () => {
    const data = {
      exportDate: new Date().toISOString(),
      settings,
      farmers,
      products,
      transactions,
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const filename = `sukiscale_backup_${new Date().toISOString().split('T')[0]}.json`;

    if (Platform.OS === 'web') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('JSON backup downloaded successfully!');
    } else {
      // Mobile: Try to share the file instead of saving
      try {
        const fs = FileSystem as any;
        const dir = fs.cacheDirectory;
        if (!dir) {
          Alert.alert('Error', 'Unable to access file system.');
          return;
        }
        const fileUri = dir + filename;
        await fs.writeAsStringAsync(fileUri, jsonStr);
        
        // Share the file via native share dialog
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export JSON Backup',
          });
          showSuccess('JSON backup shared successfully!');
        } else {
          Alert.alert(
            'Export Successful',
            `Backup saved to app cache as:\n${filename}`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Export error:', error);
        Alert.alert('Error', 'Failed to export file. Please try again.');
      }
    }
  };

  const exportToCSV = async () => {
    const farmersCSV = [
      'ID,Name,Debt Balance,Created At,Updated At',
      ...farmers.map(f => `${f.id},"${f.name}",${f.debt_balance || 0},${f.createdAt},${f.updatedAt}`),
    ].join('\n');

    const productsCSV = [
      'ID,Name,Price,Updated At',
      ...products.map(p => `${p.id},"${p.name}",${p.price},${p.updatedAt}`),
    ].join('\n');

    const transactionsCSV = [
      'ID,Farmer ID,Farmer Name,Product ID,Product Name,Weight,Price/kg,Total Amount,Debt Deducted,Final Payment,Date',
      ...transactions.map(t => 
        `${t.id},${t.farmerId},"${t.farmerName}",${t.productId},"${t.productName}",${t.weight},${t.pricePerKilo},${t.totalAmount},${t.debtDeducted || 0},${t.finalPayment},${t.date}`
      ),
    ].join('\n');

    const fullCSV = `# SukiScale Export - ${new Date().toLocaleDateString()}\n\n## FARMERS ##\n${farmersCSV}\n\n## PRODUCTS ##\n${productsCSV}\n\n## TRANSACTIONS ##\n${transactionsCSV}`;

    const filename = `sukiscale_export_${new Date().toISOString().split('T')[0]}.csv`;

    if (Platform.OS === 'web') {
      const blob = new Blob([fullCSV], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('CSV spreadsheet downloaded successfully!');
    } else {
      // Mobile: Try to share the file instead of saving
      try {
        const fs = FileSystem as any;
        const dir = fs.cacheDirectory;
        if (!dir) {
          Alert.alert('Error', 'Unable to access file system.');
          return;
        }
        const fileUri = dir + filename;
        await fs.writeAsStringAsync(fileUri, fullCSV);
        
        // Share the file via native share dialog
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export CSV Spreadsheet',
          });
          showSuccess('CSV spreadsheet shared successfully!');
        } else {
          Alert.alert(
            'Export Successful',
            `CSV saved to app cache as:\n${filename}`,
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Export error:', error);
        Alert.alert('Error', 'Failed to export file. Please try again.');
      }
    }
  };

  const handleExport = () => {
    setExportModalVisible(true);
  };

  const handleExportJSON = () => {
    setExportModalVisible(false);
    exportToJSON();
  };

  const handleExportCSV = () => {
    setExportModalVisible(false);
    exportToCSV();
  };

  const handleClearAllData = () => {
    setClearDataModalVisible(true);
  };

  const confirmClearData = async () => {
    try {
      setClearDataModalVisible(false);
      
      // Use AppContext clearAllData - clears Firebase, local DB, and UI state
      await clearAllData();
      
      // Show success and navigate to dashboard
      setSuccessMessage('All data has been cleared.');
      setSuccessModalVisible(true);
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    } catch (error) {
      console.error('Clear data error:', error);
      setClearDataModalVisible(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSuccessMessage(`Error: Failed to clear data - ${errorMessage}`);
      setSuccessModalVisible(true);
    }
  };

  return (
    <AppScreen scrollable={false}>
      <TopBar title="Settings" showBack={true} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Business Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Settings</Text>
          <Pressable style={styles.settingCard} onPress={openBusinessModal}>
            <View style={styles.iconContainer}>
              <Building2 size={22} color="#008000" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Business Name</Text>
              <Text style={styles.settingValue}>{settings.businessName}</Text>
            </View>
            <ChevronRight size={20} color="#CCC" />
          </Pressable>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <Pressable style={styles.settingCard} onPress={handleExport}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Download size={22} color="#1296F3" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Export Data</Text>
              <Text style={styles.hint}>Download backup (JSON/CSV)</Text>
            </View>
            <ChevronRight size={20} color="#CCC" />
          </Pressable>
          
          <Pressable style={[styles.settingCard, styles.dangerCard]} onPress={handleClearAllData}>
            <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Trash2 size={22} color="#DC2626" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, styles.dangerText]}>Clear All Data</Text>
              <Text style={styles.hint}>Delete all records permanently</Text>
            </View>
            <ChevronRight size={20} color="#DC2626" />
          </Pressable>
        </View>

        {/* Printer Section */}
        {Platform.OS === 'web' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Printer</Text>
            <View style={styles.settingCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Printer size={22} color="#1296F3" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Browser Printing</Text>
                <Text style={styles.settingValue}>Uses browser&apos;s native print dialog</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Printer</Text>
            <Pressable style={styles.settingCard} onPress={() => setPrinterModalVisible(true)}>
              <View style={[styles.iconContainer, { backgroundColor: isConnected ? '#E8F5E9' : '#FEE2E2' }]}>
                {isConnected ? (
                  <BluetoothConnected size={22} color="#008000" />
                ) : (
                  <Bluetooth size={22} color="#DC2626" />
                )}
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>
                  {isConnected ? 'Printer Connected' : 'Connect Printer'}
                </Text>
                <Text style={styles.settingValue}>
                  {isConnected ? printerInfo?.name : 'No printer connected'}
                </Text>
              </View>
              <ChevronRight size={20} color="#CCC" />
            </Pressable>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {user && (
            <View style={styles.settingCard}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                <User size={22} color="#9333EA" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Logged in as</Text>
                <Text style={styles.settingValue}>{user.email}</Text>
              </View>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Business Name Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={businessModalVisible}
        onRequestClose={() => setBusinessModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle">Edit Business Name</ThemedText>
            <TextInput
              style={styles.modalInput}
              value={tempBusinessName}
              onChangeText={setTempBusinessName}
              placeholder="Enter business name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable style={styles.modalButtonSecondary} onPress={() => setBusinessModalVisible(false)}>
                <ThemedText style={styles.modalButtonTextSecondary}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={styles.modalButtonPrimary} onPress={handleSaveBusinessName}>
                <ThemedText style={styles.modalButtonTextPrimary}>Save</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={exportModalVisible}
        onRequestClose={() => setExportModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText type="subtitle" style={styles.exportTitle}>Export Data</ThemedText>
            <ThemedText style={styles.exportDescription}>
              Choose your preferred export format:
            </ThemedText>
            
            <View style={styles.exportOptions}>
              <Pressable style={styles.exportOptionBtn} onPress={handleExportJSON}>
                <View style={[styles.exportIconBox, { backgroundColor: '#FFF3E0' }]}>
                  <FileJson size={28} color="#F57C00" />
                </View>
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>JSON Backup</Text>
                  <Text style={styles.exportOptionDesc}>Complete data backup for restoring later</Text>
                </View>
              </Pressable>
              
              <Pressable style={styles.exportOptionBtn} onPress={handleExportCSV}>
                <View style={[styles.exportIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <FileSpreadsheet size={28} color="#2E7D32" />
                </View>
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>CSV Spreadsheet</Text>
                  <Text style={styles.exportOptionDesc}>Open in Excel or Google Sheets</Text>
                </View>
              </Pressable>
            </View>
            
            <Pressable style={styles.exportCancelBtn} onPress={() => setExportModalVisible(false)}>
              <ThemedText style={styles.exportCancelText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.successModalContent]}>
            <View style={styles.successIconBox}>
              <ThemedText style={styles.successIcon}>✓</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.successTitle}>Success</ThemedText>
            <ThemedText style={styles.successMessage}>{successMessage}</ThemedText>
            <Pressable style={styles.successOkBtn} onPress={() => setSuccessModalVisible(false)}>
              <ThemedText style={styles.successOkText}>OK</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Clear Data Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={clearDataModalVisible}
        onRequestClose={() => setClearDataModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.dangerModalContent]}>
            <View style={styles.dangerIconBox}>
              <ThemedText style={styles.dangerIcon}>⚠</ThemedText>
            </View>
            <ThemedText type="subtitle" style={styles.dangerTitle}>Clear All Data</ThemedText>
            <ThemedText style={styles.dangerMessage}>
              This will permanently delete ALL farmers, products, and transactions. This action cannot be undone!
            </ThemedText>
            <View style={styles.dangerButtons}>
              <Pressable style={styles.dangerCancelBtn} onPress={() => setClearDataModalVisible(false)}>
                <ThemedText style={styles.dangerCancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable style={styles.dangerConfirmBtn} onPress={confirmClearData}>
                <ThemedText style={styles.dangerConfirmText}>Delete Everything</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Printer Connection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={printerModalVisible}
        onRequestClose={() => setPrinterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Printer Connection</Text>
              <Pressable onPress={() => setPrinterModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            {isConnected ? (
              <View style={styles.connectedView}>
                <View style={styles.connectedIcon}>
                  <BluetoothConnected size={48} color="#008000" />
                </View>
                <Text style={styles.connectedText}>Connected to:</Text>
                <Text style={styles.printerName}>{printerInfo?.name}</Text>
                <Text style={styles.printerAddress}>{printerInfo?.address}</Text>
                <Pressable style={styles.disconnectButton} onPress={disconnectPrinter}>
                  <Text style={styles.disconnectButtonText}>Disconnect</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.disconnectedView}>
                <View style={styles.disconnectedIcon}>
                  <Bluetooth size={48} color="#DC2626" />
                </View>
                <Text style={styles.disconnectedText}>No Printer Connected</Text>
                <Text style={styles.disconnectedSubtext}>Connect to a Bluetooth printer to print receipts</Text>
                
                <Pressable 
                  style={styles.scanButton} 
                  onPress={scanForPrinters}
                  disabled={isScanning}>
                  {isScanning ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.scanButtonText}>Scan for Printers</Text>
                  )}
                </Pressable>

                {availablePrinters.length > 0 && (
                  <View style={styles.printersList}>
                    <Text style={styles.printersListTitle}>Available Printers:</Text>
                    {availablePrinters.map((printer) => (
                      <Pressable
                        key={printer.id}
                        style={styles.printerItem}
                        onPress={() => connectToPrinter(printer)}>
                        <Printer size={20} color="#666" />
                        <View style={styles.printerItemInfo}>
                          <Text style={styles.printerItemName}>{printer.name}</Text>
                          <Text style={styles.printerItemAddress}>{printer.address}</Text>
                        </View>
                        <ChevronRight size={16} color="#CCC" />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#F8F9FA',
  },
  description: {
    marginTop: 8,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#008000',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // New Card-based Setting Items
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dangerCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  // Legacy styles (kept for modals)
  settingItem: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111',
  },
  settingValue: {
    color: '#666',
    marginTop: 4,
    fontSize: 14,
  },
  hint: {
    color: '#888',
    marginTop: 2,
    fontSize: 13,
  },
  dangerItem: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerText: {
    color: '#DC2626',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    elevation: 5,
  },
  modalInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#008000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonTextSecondary: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Export Modal Styles
  exportTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  exportDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    fontSize: 14,
  },
  exportOptions: {
    gap: 12,
    marginBottom: 24,
  },
  exportOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  exportIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exportIcon: {
    fontSize: 24,
  },
  exportOptionText: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  exportOptionDesc: {
    fontSize: 13,
    color: '#666',
  },
  exportCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  exportCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  // Success Modal Styles
  successModalContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    marginBottom: 8,
    color: '#111827',
  },
  successMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  successOkBtn: {
    backgroundColor: '#008000',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  successOkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Danger Modal Styles
  dangerModalContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  dangerIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dangerIcon: {
    fontSize: 32,
  },
  dangerTitle: {
    marginBottom: 8,
    color: '#92400E',
  },
  dangerMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  dangerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dangerCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dangerCancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  dangerConfirmBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  dangerConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Printer modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  modalClose: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  connectedView: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  connectedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectedText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  printerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  printerAddress: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  disconnectButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectedView: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  disconnectedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  disconnectedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  disconnectedSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    backgroundColor: '#1296F3',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  printersList: {
    width: '100%',
    marginTop: 16,
  },
  printersListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  printerItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  printerItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  printerItemAddress: {
    fontSize: 12,
    color: '#888',
  },
});
