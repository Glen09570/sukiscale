import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, DeviceEventEmitter, Platform } from 'react-native';

// Only import Bluetooth library on native platforms
let BluetoothManager: any = null;
let BluetoothEscposPrinter: any = null;
let BluetoothTscPrinter: any = null;

if (Platform.OS !== 'web') {
  try {
    const printerLib = require('react-native-bluetooth-escpos-printer');
    BluetoothManager = printerLib.BluetoothManager;
    BluetoothEscposPrinter = printerLib.BluetoothEscposPrinter;
    BluetoothTscPrinter = printerLib.BluetoothTscPrinter;
  } catch (error) {
    console.warn('Bluetooth printer library not available:', error);
  }
}

interface PrinterInfo {
  id: string;
  name: string;
  address: string;
}

interface PrinterContextType {
  isConnected: boolean;
  printerInfo: PrinterInfo | null;
  isScanning: boolean;
  availablePrinters: PrinterInfo[];
  scanForPrinters: () => Promise<void>;
  connectToPrinter: (printer: PrinterInfo) => Promise<void>;
  disconnectPrinter: () => void;
  printReceipt: (receiptData: ReceiptData) => Promise<void>;
}

interface ReceiptData {
  farmerName: string;
  productName: string;
  weight: number;
  pricePerKilo: number;
  totalAmount: number;
  debtDeducted: number;
  finalPayment: number;
  date: string;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export function PrinterProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [printerInfo, setPrinterInfo] = useState<PrinterInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterInfo[]>([]);

  // Set up event listeners for Bluetooth events
  useEffect(() => {
    if (Platform.OS === 'android' && BluetoothManager) {
      const deviceFoundListener = DeviceEventEmitter.addListener(
        BluetoothManager.EVENT_DEVICE_FOUND,
        (rsp: any) => {
          try {
            const device = JSON.parse(rsp);
            setAvailablePrinters((prev) => {
              const exists = prev.some((p) => p.address === device.address);
              if (!exists) {
                return [...prev, {
                  id: device.address,
                  name: device.name || 'Unknown Device',
                  address: device.address,
                }];
              }
              return prev;
            });
          } catch (e) {
            console.error('Error parsing device data:', e);
          }
        }
      );

      const devicePairedListener = DeviceEventEmitter.addListener(
        BluetoothManager.EVENT_DEVICE_ALREADY_PAIRED,
        (rsp: any) => {
          try {
            const devices = JSON.parse(rsp).devices || [];
            const parsedDevices = devices.map((d: any) => ({
              id: d.address,
              name: d.name || 'Unknown Device',
              address: d.address,
            }));
            setAvailablePrinters((prev) => {
              const newDevices = parsedDevices.filter(
                (d: PrinterInfo) => !prev.some((p) => p.address === d.address)
              );
              return [...prev, ...newDevices];
            });
          } catch (e) {
            console.error('Error parsing paired devices:', e);
          }
        }
      );

      return () => {
        deviceFoundListener.remove();
        devicePairedListener.remove();
      };
    }
  }, []);

  // Scan for available Bluetooth printers
  const scanForPrinters = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Supported', 'Bluetooth printing is not supported on web');
      return;
    }

    if (!BluetoothManager) {
      Alert.alert('Not Available', 'Bluetooth printer library is not available');
      return;
    }

    setIsScanning(true);
    setAvailablePrinters([]);
    
    try {
      // Check if Bluetooth is enabled
      const enabled = await BluetoothManager.isBluetoothEnabled();
      if (!enabled) {
        Alert.alert('Bluetooth Disabled', 'Please enable Bluetooth to scan for printers');
        setIsScanning(false);
        return;
      }

      // Scan for devices
      await BluetoothManager.scanDevices();
      
      // Stop scanning after 10 seconds
      setTimeout(() => {
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error('Error scanning for printers:', error);
      Alert.alert('Error', 'Failed to scan for printers. Please make sure Bluetooth is enabled.');
      setIsScanning(false);
    }
  }, []);

  // Connect to a specific printer
  const connectToPrinter = useCallback(async (printer: PrinterInfo) => {
    if (!BluetoothManager) {
      Alert.alert('Not Available', 'Bluetooth printer library is not available');
      return;
    }

    try {
      setIsScanning(true);
      
      await BluetoothManager.connect(printer.address);
      
      setPrinterInfo(printer);
      setIsConnected(true);
      setIsScanning(false);
      Alert.alert('Success', `Connected to ${printer.name}`);
    } catch (error) {
      console.error('Error connecting to printer:', error);
      setIsScanning(false);
      Alert.alert('Error', 'Failed to connect to printer. Please try again.');
    }
  }, []);

  // Disconnect from printer
  const disconnectPrinter = useCallback(() => {
    if (printerInfo && BluetoothManager) {
      BluetoothManager.unpair(printerInfo.address).catch((err: any) => {
        console.error('Error disconnecting:', err);
      });
    }
    setPrinterInfo(null);
    setIsConnected(false);
    Alert.alert('Disconnected', 'Printer disconnected successfully');
  }, [printerInfo]);

  // Print receipt
  const printReceipt = useCallback(async (receiptData: ReceiptData) => {
    if (Platform.OS === 'web') {
      // Web: Use browser's native printing
      try {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          Alert.alert('Error', 'Please allow popups to print receipts');
          return;
        }

        const receiptHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Receipt - SukiScale</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 20px;
                text-align: center;
              }
              .receipt {
                max-width: 300px;
                margin: 0 auto;
                text-align: left;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              .divider {
                border-top: 1px dashed #000;
                margin: 10px 0;
              }
              .row {
                display: flex;
                justify-content: space-between;
                margin: 5px 0;
              }
              .total {
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
              }
              @media print {
                body { padding: 0; }
                .receipt { max-width: 100%; }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>================================</h2>
                <h2>           SUKISCALE</h2>
                <h2>================================</h2>
              </div>
              
              <div class="row"><span>Farmer:</span><span>${receiptData.farmerName}</span></div>
              <div class="row"><span>Product:</span><span>${receiptData.productName}</span></div>
              <div class="row"><span>Weight:</span><span>${receiptData.weight.toFixed(2)} kg</span></div>
              <div class="row"><span>Price/kg:</span><span>₱${receiptData.pricePerKilo.toFixed(2)}</span></div>
              
              <div class="divider"></div>
              
              <div class="row total"><span>Total:</span><span>₱${receiptData.totalAmount.toLocaleString()}</span></div>
              ${receiptData.debtDeducted > 0 ? `<div class="row"><span>Debt Paid:</span><span>₱${receiptData.debtDeducted.toLocaleString()}</span></div>` : ''}
              
              <div class="divider"></div>
              
              <div class="row total"><span>Final Payment:</span><span>₱${receiptData.finalPayment.toLocaleString()}</span></div>
              <div class="row"><span>Date:</span><span>${new Date(receiptData.date).toLocaleString()}</span></div>
              
              <div class="footer">
                <h2>================================</h2>
                <h2>           Thank You!</h2>
                <h2>================================</h2>
              </div>
            </div>
          </body>
          </html>
        `;

        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        
        Alert.alert('Success', 'Receipt sent to printer');
      } catch (error) {
        console.error('Error printing receipt:', error);
        Alert.alert('Error', 'Failed to print receipt');
      }
      return;
    }

    // Mobile: Use Bluetooth printer
    if (!isConnected || !printerInfo) {
      Alert.alert('Error', 'No printer connected');
      return;
    }

    if (!BluetoothEscposPrinter) {
      Alert.alert('Not Available', 'Bluetooth printer library is not available');
      return;
    }

    try {
      // Initialize printer
      BluetoothEscposPrinter.printerInit();
      
      // Set alignment to center for header
      BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      
      // Print header
      BluetoothEscposPrinter.printText('================================\n', {});
      BluetoothEscposPrinter.printText('           SUKISCALE\n', { encoding: 'GBK' });
      BluetoothEscposPrinter.printText('================================\n', {});
      
      // Set alignment to left for details
      BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      
      // Print receipt details
      BluetoothEscposPrinter.printText(`Farmer: ${receiptData.farmerName}\n`, {});
      BluetoothEscposPrinter.printText(`Product: ${receiptData.productName}\n`, {});
      BluetoothEscposPrinter.printText(`Weight: ${receiptData.weight.toFixed(2)} kg\n`, {});
      BluetoothEscposPrinter.printText(`Price/kg: ₱${receiptData.pricePerKilo.toFixed(2)}\n`, {});
      
      BluetoothEscposPrinter.printText('--------------------------------\n', {});
      
      BluetoothEscposPrinter.printText(`Total: ₱${receiptData.totalAmount.toLocaleString()}\n`, {});
      if (receiptData.debtDeducted > 0) {
        BluetoothEscposPrinter.printText(`Debt Paid: ₱${receiptData.debtDeducted.toLocaleString()}\n`, {});
      }
      
      BluetoothEscposPrinter.printText('--------------------------------\n', {});
      
      BluetoothEscposPrinter.printText(`Final Payment: ₱${receiptData.finalPayment.toLocaleString()}\n`, {});
      BluetoothEscposPrinter.printText(`Date: ${new Date(receiptData.date).toLocaleString()}\n`, {});
      
      // Set alignment to center for footer
      BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      BluetoothEscposPrinter.printText('================================\n', {});
      BluetoothEscposPrinter.printText('           Thank You!\n', {});
      BluetoothEscposPrinter.printText('================================\n', {});
      
      // Print and feed
      BluetoothEscposPrinter.printAndFeed(3);
      
      Alert.alert('Success', 'Receipt printed successfully');
    } catch (error) {
      console.error('Error printing receipt:', error);
      Alert.alert('Error', 'Failed to print receipt. Please check printer connection.');
    }
  }, [isConnected, printerInfo]);

  return (
    <PrinterContext.Provider
      value={{
        isConnected,
        printerInfo,
        isScanning,
        availablePrinters,
        scanForPrinters,
        connectToPrinter,
        disconnectPrinter,
        printReceipt,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error('usePrinter must be used within a PrinterProvider');
  }
  return context;
}
