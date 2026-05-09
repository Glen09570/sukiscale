import { useAuth } from '@/context/AuthContext';
import * as Database from '@/services/database';
import { sendDebtNotification, sendPaymentNotification } from '@/services/emailService';
import * as FirebaseDB from '@/services/firebaseDatabase';
import { seedDatabaseIfEmpty } from '@/services/seedData';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useToast } from './ToastContext';

// Helper to convert Firebase string IDs to consistent numbers
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) + 1000000;
}

// Types matching the SQLite schema
interface AppFarmer {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  location?: string;
  debt_balance: number;
  createdAt: string;
  updatedAt: string;
}

interface AppProduct {
  id: string;
  name: string;
  price: number;
  notes?: string;
  is_active: number;
  updatedAt: string;
}

export interface AppTransaction {
  id: string;
  farmerId: string;
  farmerName: string;
  productId?: string;
  productName?: string;
  pricePerKilo?: number;
  weight: number;
  totalAmount: number;
  debtDeducted: number;
  finalPayment: number;
  date: string;
  weights: number[];
}

function toNumber(value: unknown, fallback = 0): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toIsoDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate().toISOString();
  }
  return new Date().toISOString();
}

function mapFirebaseTransaction(t: any): AppTransaction {
  const weight = toNumber(t.totalWeight ?? t.total_weight ?? t.weight ?? t.weight_kg);
  const totalAmount = toNumber(t.totalAmount ?? t.total_amount ?? t.amount);
  const debtDeducted = toNumber(t.debtDeducted ?? t.debt_deducted ?? t.debtDeduction);
  const finalPayment = toNumber(t.finalPayment ?? t.final_payment ?? t.amountPaid, totalAmount);

  return {
    id: t.id || Math.random().toString(36).slice(2),
    farmerId: (t.farmerId ?? t.farmer_id ?? '').toString(),
    farmerName: t.farmerName || t.farmer_name || '',
    productId: t.productId?.toString() || t.product_id?.toString(),
    productName: t.productName || t.product_name,
    pricePerKilo: toNumber(t.pricePerKg ?? t.price_per_kg ?? t.price),
    weight,
    totalAmount,
    debtDeducted,
    finalPayment,
    date: toIsoDate(t.transaction_date ?? t.date ?? t.createdAt),
    weights: Array.isArray(t.weights) ? t.weights.map((w: unknown) => toNumber(w)) : [weight],
  };
}

interface AppContextType {
  // Loading state
  isLoading: boolean;
  
  // Farmers
  farmers: AppFarmer[];
  addFarmer: (farmer: { name: string; contact?: string; email?: string; location?: string }) => Promise<void>;
  getFarmer: (id: string) => AppFarmer | undefined;
  updateFarmer: (id: string, farmer: Partial<AppFarmer>) => Promise<void>;
  deleteFarmer: (id: string) => Promise<void>;

  // Debts
  getFarmerDebt: (farmerId: string) => number;
  updateFarmerDebt: (farmerId: string, newBalance: number) => Promise<void>;
  recordDebt: (farmerId: string, amount: number, note?: string) => Promise<void>;
  recordDebtPayment: (farmerId: string, amount: number, note?: string) => Promise<void>;

  // Products
  products: AppProduct[];
  addProduct: (product: { name: string; price: number; notes?: string }) => Promise<void>;
  updateProduct: (id: string, product: Partial<AppProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProduct: (id: string) => AppProduct | undefined;

  // Transactions
  transactions: AppTransaction[];
  addTransaction: (transaction: {
    farmerId: string;
    farmerName: string;
    productId?: string;
    productName?: string;
    pricePerKilo?: number;
    weight: number;
    totalAmount: number;
    debtDeducted: number;
    finalPayment: number;
    weights: number[];
  }) => Promise<AppTransaction>;
  getTransactionsByFarmer: (farmerId: string) => AppTransaction[];
  getTransaction: (id: string) => AppTransaction | undefined;
  deleteTransactions: (ids: string[]) => Promise<void>;

  // Search
  searchFarmers: (query: string) => AppFarmer[];
  searchProducts: (query: string) => AppProduct[];
  searchTransactions: (query: string) => AppTransaction[];
  
  // Refresh
  refreshData: () => Promise<void>;
  
  // Clear all data
  clearAllData: () => Promise<void>;
  
  // Sync status (Firebase)
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [farmers, setFarmers] = useState<AppFarmer[]>([]);
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);
  // Track recently deleted IDs to filter them from real-time subscription updates
  const recentlyDeletedIdsRef = useRef<Set<string>>(new Set());

  // Sync transactions from Firebase
  const syncTransactionsFromFirebase = useCallback(async (): Promise<void> => {
    if (!user?.uid && !user?.id) {
      console.log('No user ID available, skipping transaction sync');
      return;
    }
    
    const userId = user.uid || user.id;
    
    try {
      await FirebaseDB.initFirestore();
      console.log('🔄 Syncing transactions from Firebase for user:', userId);
      
      const firebaseTransactions = await FirebaseDB.getTransactions(userId, 100);
      console.log('📥 Loaded', firebaseTransactions.length, 'transactions from Firebase');
      
      const appTransactions = firebaseTransactions.map(mapFirebaseTransaction);
      console.log('🔄 Mapped transactions:', appTransactions.map(t => ({ id: t.id, farmerName: t.farmerName })));
      
      console.log('📝 Before sync - Local transactions:', transactions.map(t => ({ id: t.id, farmerName: t.farmerName })));
      setTransactions(appTransactions);
      console.log('✅ Transactions synced:', appTransactions.length);
    } catch (e: any) {
      console.error('❌ Error syncing transactions from Firebase:', e.message || e);
    }
  }, [user?.uid, user?.id]);

  // Sync data from Firebase to local 
  const syncFromFirebase = useCallback(async () => {
    console.log('syncFromFirebase called, Platform:', Platform.OS);
    
    // For web, sync transactions from Firebase
    if (Platform.OS === 'web') {
      console.log('Web platform detected, calling syncTransactionsFromFirebase...');
      await syncTransactionsFromFirebase();
      return;
    }
    
    try {
      setIsSyncing(true);
      console.log('Starting Firebase → SQLite sync...');
      
      // Initialize Firebase first
      await FirebaseDB.initFirestore();
      console.log('Firebase initialized');
      
      // Get farmers from Firebase and sync to SQLite
      console.log('Fetching farmers from Firebase...');
      const userId = user?.uid || user?.id;
      if (!userId) return;

      const fbFarmers = await FirebaseDB.getFarmers(userId);
      console.log(`Found ${fbFarmers.length} farmers in Firebase`);
      
      for (const farmer of fbFarmers) {
        try {
          // Keep original Firebase ID as firebaseId
          const firebaseId = farmer.id || '';
          if (!firebaseId) continue;
          
          // Convert ID - parseInt for numeric, hash for string IDs
          let farmerId = parseInt(firebaseId);
          if (isNaN(farmerId)) {
            farmerId = hashStringToNumber(firebaseId);
          }
          
          console.log('Syncing farmer:', farmer.name, 'ID:', farmerId, 'FirebaseID:', firebaseId);
          await Database.addOrUpdateFarmer({
            id: String(farmerId),
            name: farmer.name,
            contact: farmer.contact || '',
            email: farmer.email || '',
            location: farmer.location || '',
            debt_balance: farmer.debt_balance || 0,
            createdAt: toIsoDate(farmer.createdAt),
            updatedAt: toIsoDate(farmer.updatedAt),
            firebaseId: firebaseId,
            userId: userId || '',
          } as any);
          console.log('Farmer synced to SQLite:', farmer.name);
        } catch (e) {
          console.error('Farmer sync error:', farmer.name, e);
        }
      }
      
      // Get products from Firebase and sync to SQLite
      console.log('Fetching products from Firebase...');
      const fbProducts = await FirebaseDB.getProducts(userId);
      console.log(`Found ${fbProducts.length} products in Firebase`);
      
      for (const product of fbProducts) {
        try {
          // Keep original Firebase ID as firebaseId
          const firebaseId = product.id || '';
          if (!firebaseId) continue;
          
          // Convert ID - parseInt for numeric, hash for string IDs
          let productId = parseInt(firebaseId);
          if (isNaN(productId)) {
            productId = hashStringToNumber(firebaseId);
          }
          
          console.log('Syncing product:', product.name, 'ID:', productId, 'FirebaseID:', firebaseId);
          await Database.addOrUpdateProduct({
            id: String(productId),
            name: product.name,
            price_per_kg: product.price_per_kg || (product as any).price || 0,
            current_stock_kg: 0,
            updatedAt: toIsoDate(product.updatedAt),
            firebaseId: firebaseId,
            userId: userId || '',
          } as any);
          console.log('Product synced to SQLite:', product.name);
        } catch (e) {
          console.error('Product sync error:', product.name, e);
        }
      }
      
      console.log('Firebase → SQLite sync complete (Farmers & Products)');
    } catch (error) {
      console.error('Sync from Firebase error:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [syncTransactionsFromFirebase, user?.uid, user?.id]);

  // Initialize database and load data
  const refreshData = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshTask = (async () => {
    try {
      setIsLoading(true);
      
      // Initialize local SQLite database (for offline-first on mobile)
      await Database.initDatabase();
      
      // Clean up any duplicate data before loading
      try {
        const removedProducts = await Database.removeDuplicateProducts();
        const removedFarmers = await Database.removeDuplicateFarmers();
        if (removedProducts > 0 || removedFarmers > 0) {
          console.log('Cleaned up duplicates:', removedProducts, 'products,', removedFarmers, 'farmers');
        }
      } catch (e) {
        console.log('Duplicate cleanup failed (non-critical):', e);
      }
      
      // Initialize Firebase Firestore (for cloud sync)
      if (user?.uid) {
        try {
          await FirebaseDB.initFirestore();
          setSyncError(null);
        } catch (error) {
          console.error('Firebase init error:', error);
          setSyncError('Firebase sync unavailable');
        }
      }
      
      // Sync from Firebase to SQLite (web → mobile)
      await syncFromFirebase();
      
      // Clean up duplicates again after sync (in case sync added any)
      try {
        const removedProducts = await Database.removeDuplicateProducts();
        const removedFarmers = await Database.removeDuplicateFarmers();
        if (removedProducts > 0 || removedFarmers > 0) {
          console.log('Post-sync cleanup removed duplicates:', removedProducts, 'products,', removedFarmers, 'farmers');
        }
      } catch (e) {
        console.log('Post-sync duplicate cleanup failed (non-critical):', e);
      }
      
      // Seed with mock data if empty
      await seedDatabaseIfEmpty();
      
      // Load farmers (filter by current user)
      const userId = user?.uid || user?.id;
      const dbFarmers = await Database.getAllFarmers(userId);
      setFarmers(dbFarmers.map((f) => ({ 
        id: f.id || '',
        name: f.name,
        contact: f.contact,
        email: f.email,
        location: f.location,
        debt_balance: f.debt_balance || 0,
        createdAt: f.createdAt ? toIsoDate(f.createdAt) : new Date().toISOString(),
        updatedAt: f.updatedAt ? toIsoDate(f.updatedAt) : new Date().toISOString(),
      })));
      
      // Load products (filter by current user)
      const dbProducts = await Database.getAllProducts(userId);
      setProducts(dbProducts.map((p) => ({
        id: p.id || '',
        name: p.name,
        price: p.price_per_kg,
        notes: '',
        is_active: 1,
        updatedAt: p.updatedAt ? toIsoDate(p.updatedAt) : new Date().toISOString(),
      })));
      
      // Load transactions from SQLite (mobile only)
      // Web loads transactions from Firebase via syncFromFirebase
      if (Platform.OS !== 'web') {
        // First, remove duplicate transactions
        try {
          const removedCount = await Database.removeDuplicateTransactions();
          if (removedCount > 0) {
            console.log('Removed', removedCount, 'duplicate transactions from SQLite');
          }
        } catch (e) {
          console.log('Could not remove duplicates:', e);
        }
        
        const dbTransactions = await Database.getAllTransactions(userId);
        setTransactions(dbTransactions.map((t) => ({
          id: t.id || '',
          farmerId: t.farmerId || '',
          farmerName: (t as any).farmer_name || t.farmerName || '',
          productId: t.productId,
          productName: t.productName,
          pricePerKilo: t.pricePerKg,
          weight: t.totalWeight || 0,
          totalAmount: t.totalAmount || 0,
          debtDeducted: t.debtDeducted || 0,
          finalPayment: t.finalPayment || 0,
          date: (t as any).transaction_date || t.createdAt || new Date().toISOString(),
          weights: t.weights || [],
        })));
        
        // Sync transactions from Firebase to mobile (fetch latest)
        if (user?.uid || user?.id) {
          try {
            await FirebaseDB.initFirestore();
            const userId = user.uid || user.id;
            console.log('🔄 Mobile: Syncing transactions from Firebase for user:', userId);
            const firebaseTransactions = await FirebaseDB.getTransactions(userId, 100);
            console.log('📥 Mobile: Loaded', firebaseTransactions.length, 'transactions from Firebase');
            
            // Sync to SQLite (this will use addOrUpdate to prevent duplicates)
            for (const t of firebaseTransactions) {
              const mapped = mapFirebaseTransaction(t);
              await Database.addOrUpdateTransaction({
                id: mapped.id,
                firebaseId: mapped.id,
                farmerId: mapped.farmerId,
                farmerName: mapped.farmerName,
                productId: mapped.productId,
                productName: mapped.productName,
                pricePerKg: mapped.pricePerKilo || 0,
                totalWeight: mapped.weight,
                totalAmount: mapped.totalAmount,
                debtDeducted: mapped.debtDeducted,
                finalPayment: mapped.finalPayment,
                userId: userId || '',
              } as any);
            }
            
            // Reload after sync
            const updatedTransactions = await Database.getAllTransactions();
            setTransactions(updatedTransactions.map((t) => ({
              id: t.id || '',
              farmerId: t.farmerId || '',
              farmerName: (t as any).farmer_name || t.farmerName || '',
              productId: t.productId,
              productName: t.productName,
              pricePerKilo: t.pricePerKg,
              weight: t.totalWeight || 0,
              totalAmount: t.totalAmount || 0,
              debtDeducted: t.debtDeducted || 0,
              finalPayment: t.finalPayment || 0,
              date: (t as any).transaction_date || t.createdAt || new Date().toISOString(),
              weights: t.weights || [],
            })));
          } catch (e: any) {
            console.log('Mobile Firebase sync error:', e.message);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
    })();

    refreshPromiseRef.current = refreshTask;
    try {
      await refreshTask;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [syncFromFirebase, user]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Keep transaction history live across web and mobile.
  useEffect(() => {
    const userId = user?.uid || user?.id;
    if (!userId) {
      setTransactions([]);
      return;
    }

    // Web refreshes were tripping Firestore's listen stream state machine.
    // We already load fresh transactions through `refreshData()`, so keep the
    // web path refresh-driven instead of holding a live snapshot listener.
    if (Platform.OS === 'web') {
      return;
    }

    let isActive = true;

    FirebaseDB.initFirestore()
      .then(() => {
        if (!isActive) return;

        unsubscribeRef.current = FirebaseDB.subscribeToTransactions(
          userId,
          async (firebaseTransactions) => {
            // Filter out recently deleted transactions (Firestore local cache might still have them)
            const recentlyDeleted = recentlyDeletedIdsRef.current;
            const filteredTransactions = firebaseTransactions.filter(t => t.id && !recentlyDeleted.has(t.id));
            
            if (recentlyDeleted.size > 0) {
              console.log('Filtered', firebaseTransactions.length - filteredTransactions.length, 'recently deleted transactions from subscription update');
            }
            
            const appTransactions = filteredTransactions.map(mapFirebaseTransaction);
            setTransactions(appTransactions);
            setLastSyncTime(new Date());
            setSyncError(null);

            if (Platform.OS !== 'web') {
              for (const transaction of filteredTransactions) {
                const mapped = mapFirebaseTransaction(transaction);
                try {
                  await Database.addOrUpdateTransaction({
                    id: mapped.id,
                    firebaseId: mapped.id,
                    farmerId: mapped.farmerId,
                    farmerName: mapped.farmerName,
                    productId: mapped.productId,
                    productName: mapped.productName,
                    pricePerKg: mapped.pricePerKilo || 0,
                    totalWeight: mapped.weight,
                    totalAmount: mapped.totalAmount,
                    debtDeducted: mapped.debtDeducted,
                    finalPayment: mapped.finalPayment,
                    userId: user?.uid || user?.id || '',
                  } as any);
                } catch (error) {
                  console.log('Could not cache synced transaction locally:', error);
                }
              }
            }
          },
          () => setSyncError('Firebase sync unavailable')
        );
      })
      .catch((error) => {
        console.error('Failed to start transaction subscription:', error);
        setSyncError('Firebase sync unavailable');
      });

    return () => {
      isActive = false;
      unsubscribeRef.current?.();
      unsubscribeRef.current = undefined;
    };
  }, [user?.uid, user?.id]);

  // Farmer functions
  const addFarmer = useCallback(async (farmerData: { name: string; contact?: string; email?: string; location?: string }) => {
    // Add to local SQLite first (offline-first)
    const userId = user?.uid || user?.id;
    const localId = await Database.addFarmer({
      name: farmerData.name,
      contact: farmerData.contact,
      email: farmerData.email,
      location: farmerData.location,
      debt_balance: 0,
      userId: userId || '',
    });

    setLastSyncTime(new Date());
    
    // Add to local state
    const newFarmer: AppFarmer = {
      id: localId.toString(),
      name: farmerData.name,
      contact: farmerData.contact,
      email: farmerData.email,
      location: farmerData.location,
      debt_balance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFarmers(prev => [...prev, newFarmer]);
    showToast('Farmer added', `${farmerData.name} was saved successfully.`);
  }, [showToast, user?.uid, user?.id]);

  const getFarmer = useCallback(
    (id: string) => farmers.find((f) => f.id === id),
    [farmers]
  );

  const updateFarmer = useCallback(async (id: string, farmerData: Partial<AppFarmer>) => {
    await Database.updateFarmer(id, {
      name: farmerData.name,
      contact: farmerData.contact,
      email: farmerData.email,
      location: farmerData.location,
      debt_balance: farmerData.debt_balance,
    } as any);
    
    setFarmers(prev =>
      prev.map((f) => (f.id === id ? { ...f, ...farmerData, updatedAt: new Date().toISOString() } : f))
    );
    showToast('Farmer updated', 'Farmer details have been updated.');
  }, [showToast]);

  const deleteFarmer = useCallback(async (id: string) => {
    const farmerName = farmers.find((f) => f.id === id)?.name;
    await Database.deleteFarmer(id);
    setFarmers(prev => prev.filter((f) => f.id !== id));
    showToast('Farmer deleted', farmerName ? `${farmerName} was removed.` : 'Farmer record removed.');
  }, [farmers, showToast]);

  // Debt functions
  const getFarmerDebt = useCallback(
    (farmerId: string) => {
      const farmer = farmers.find((f) => f.id === farmerId);
      return farmer?.debt_balance ?? 0;
    },
    [farmers]
  );

  const updateFarmerDebt = useCallback(async (farmerId: string, newBalance: number) => {
    await Database.updateFarmerDebt(farmerId, newBalance);
    setFarmers(prev =>
      prev.map((f) => (f.id === farmerId ? { ...f, debt_balance: newBalance, updatedAt: new Date().toISOString() } : f))
    );
  }, []);

  // Record new debt for a farmer
  const recordDebt = useCallback(async (farmerId: string, amount: number, note?: string) => {
    const currentDebt = getFarmerDebt(farmerId);
    const newBalance = currentDebt + amount;

    // Update farmer debt balance
    await Database.updateFarmerDebt(farmerId, newBalance);

    // Add debt record
    await Database.addDebtRecord({
      farmerId: farmerId,
      type: 'add',
      amount: amount,
      balanceAfter: newBalance,
      note: note,
      userId: user?.uid || user?.id || '',
    });

    // Update local state
    setFarmers(prev =>
      prev.map((f) => (f.id === farmerId ? { ...f, debt_balance: newBalance, updatedAt: new Date().toISOString() } : f))
    );

    // Send email notification to farmer - fetch from database for reliable email lookup
    try {
      const farmer = await FirebaseDB.getFarmerById(farmerId);
      if (farmer?.email) {
        await sendDebtNotification({
          to_email: farmer.email,
          farmer_name: farmer.name,
          debt_amount: amount,
          new_balance: newBalance,
          note: note,
          date: new Date().toLocaleDateString(),
        });
      }
    } catch (error) {
      console.error('Failed to send debt notification email:', error);
      // Don't throw - we don't want to block the debt recording if email fails
    }
  }, [getFarmerDebt, user?.uid, user?.id]);

  // Record debt payment (negative amount reduces debt)
  const recordDebtPayment = useCallback(async (farmerId: string, amount: number, note?: string) => {
    const currentDebt = getFarmerDebt(farmerId);
    // amount is negative (e.g., -500 means paying 500), so we add it
    const newBalance = Math.max(0, currentDebt + amount);
    const paymentAmount = Math.abs(amount);

    // Update database
    await Database.updateFarmerDebt(farmerId, newBalance);

    // Record the debt payment in history
    await Database.addDebtRecord({
      farmerId: farmerId,
      type: 'payment',
      amount: paymentAmount, // Store as positive for readability
      balanceAfter: newBalance,
      note: note,
      userId: user?.uid || user?.id || '',
    });

    // Update local state
    setFarmers(prev =>
      prev.map((f) => (f.id === farmerId ? { ...f, debt_balance: newBalance, updatedAt: new Date().toISOString() } : f))
    );

    // Send email notification to farmer about payment - fetch from database for reliable email lookup
    try {
      const farmer = await FirebaseDB.getFarmerById(farmerId);
      if (farmer?.email) {
        await sendPaymentNotification({
          to_email: farmer.email,
          farmer_name: farmer.name,
          payment_amount: paymentAmount,
          new_balance: newBalance,
          note: note,
          date: new Date().toLocaleDateString(),
        });
      }
    } catch (error) {
      console.error('Failed to send payment notification email:', error);
      // Don't throw - we don't want to block the payment recording if email fails
    }
  }, [getFarmerDebt, user?.uid, user?.id]);

  // Product functions
  const addProduct = useCallback(async (productData: { name: string; price: number; notes?: string }) => {
    const userId = user?.uid || user?.id;
    const id = await Database.addProduct({
      name: productData.name,
      price_per_kg: productData.price,
      current_stock_kg: 0,
      userId: userId || '',
    });
    
    const newProduct: AppProduct = {
      id: id.toString(),
      name: productData.name,
      price: productData.price,
      notes: productData.notes,
      is_active: 1,
      updatedAt: new Date().toISOString(),
    };
    setProducts(prev => [...prev, newProduct]);
    showToast('Product added', `${productData.name} was saved successfully.`);
  }, [showToast, user?.uid, user?.id]);

  const updateProduct = useCallback(async (id: string, productData: Partial<AppProduct>) => {
    await Database.updateProduct(id, {
      name: productData.name,
      price_per_kg: productData.price,
    } as any);
    
    setProducts(prev =>
      prev.map((p) => (p.id === id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p))
    );
    showToast('Product updated', 'Product details have been updated.');
  }, [showToast]);

  const deleteProduct = useCallback(async (id: string) => {
    const productName = products.find((p) => p.id === id)?.name;
    await Database.deleteProduct(id);
    setProducts(prev => prev.filter((p) => p.id !== id));
    showToast('Product deleted', productName ? `${productName} was removed.` : 'Product removed.');
  }, [products, showToast]);

  const getProduct = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  // Transaction functions
  const addTransaction = useCallback(async (transactionData: {
    farmerId: string;
    farmerName: string;
    productId?: string;
    productName?: string;
    pricePerKilo?: number;
    weight: number;
    totalAmount: number;
    debtDeducted: number;
    finalPayment: number;
    weights: number[];
  }): Promise<AppTransaction> => {
    console.log('=== ADD TRANSACTION START ===');
    // Get user ID for Firebase sync
    const userId = user?.uid || user?.id;
    
    console.log('📤 Calling Database.addTransaction...');
    const id = await Database.addTransaction({
      farmerId: transactionData.farmerId,
      farmerName: transactionData.farmerName,
      productId: transactionData.productId,
      productName: transactionData.productName,
      pricePerKg: transactionData.pricePerKilo,
      totalAmount: transactionData.totalAmount,
      debtDeducted: transactionData.debtDeducted,
      finalPayment: transactionData.finalPayment,
      weights: transactionData.weights,
      userId: userId || '',
    });
    console.log('📥 Database.addTransaction returned ID:', id);
    
    // Update farmer debt
    const currentDebt = getFarmerDebt(transactionData.farmerId);
    const newDebt = Math.max(0, currentDebt - (transactionData.debtDeducted || 0));
    await updateFarmerDebt(transactionData.farmerId, newDebt);
    
    // Add debt record if debt was deducted
    if (transactionData.debtDeducted > 0) {
      await Database.addDebtRecord({
        farmerId: transactionData.farmerId,
        transaction_id: id,
        type: 'deduct',
        amount: transactionData.debtDeducted,
        balanceAfter: newDebt,
        note: `Payment from transaction`,
        userId: userId || '',
      });

      // Send email notification to farmer about debt deduction - fetch from database for reliable email lookup
      try {
        const farmer = await FirebaseDB.getFarmerById(transactionData.farmerId);
        if (farmer?.email) {
          await sendPaymentNotification({
            to_email: farmer.email,
            farmer_name: farmer.name,
            payment_amount: transactionData.debtDeducted,
            new_balance: newDebt,
            note: `Payment deducted from transaction (${transactionData.productName || 'Product'})`,
            date: new Date().toLocaleDateString(),
          });
        }
      } catch (error) {
        console.error('Failed to send transaction debt deduction notification email:', error);
        // Don't throw - we don't want to block the transaction if email fails
      }
    }

    const newTransaction: AppTransaction = {
      id: id.toString(),
      ...transactionData,
      date: new Date().toISOString(),
    };
    console.log('🆕 New transaction created in local state:', { id: newTransaction.id, farmerName: newTransaction.farmerName });
    
    setTransactions(prev => [newTransaction, ...prev]);
    console.log('=== ADD TRANSACTION COMPLETE ===');
    showToast('Transaction added', `${transactionData.farmerName} transaction saved.`);
    return newTransaction;
  }, [getFarmerDebt, showToast, updateFarmerDebt, user?.uid, user?.id]);

  const getTransactionsByFarmer = useCallback(
    (farmerId: string) =>
      transactions
        .filter((t) => t.farmerId === farmerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  const getTransaction = useCallback(
    (id: string) => transactions.find((t) => t.id === id),
    [transactions]
  );

  // Delete transactions (both local and Firebase)
  const deleteTransactions = useCallback(async (ids: string[]): Promise<void> => {
    console.log('=== DELETE TRANSACTIONS START ===');
    console.log('Deleting transaction IDs:', ids);
    console.log('Current transactions in state:', transactions.map(t => ({ id: t.id, farmerName: t.farmerName })));
    
    if (ids.length === 0) {
      console.log('No IDs provided, skipping delete');
      return;
    }
    
    // Verify IDs exist in local state
    const existingIds = new Set(transactions.map(t => t.id));
    const validIds = ids.filter(id => existingIds.has(id));
    const invalidIds = ids.filter(id => !existingIds.has(id));
    
    if (invalidIds.length > 0) {
      console.warn('⚠️ IDs not found in local state:', invalidIds);
    }
    console.log('Valid IDs to delete:', validIds);
    
    // Add to recently deleted set to prevent subscription from re-adding them
    validIds.forEach(id => recentlyDeletedIdsRef.current.add(id));
    console.log('Added to recently deleted set:', validIds);
    
    // Delete from Firebase first, then update local state
    // This prevents the real-time subscription from re-adding deleted items
    const deletePromises = validIds.map(async (id) => {
      console.log('Attempting to delete transaction:', id);
      try {
        await Database.deleteTransaction(id);
        console.log('✅ Successfully deleted transaction from Firebase:', id);
        return { id, success: true };
      } catch (e) {
        console.error('❌ Failed to delete transaction from Firebase:', id, e);
        return { id, success: false, error: e };
      }
    });

    console.log('Waiting for all delete operations...');
    const results = await Promise.all(deletePromises);
    console.log('Delete results:', results);
    
    const failedDeletes = results.filter(r => !r.success);
    const successfulIds = results.filter(r => r.success).map(r => r.id);
    
    if (failedDeletes.length > 0) {
      console.error('Some transactions failed to delete:', failedDeletes);
      console.log('Successful deletes:', successfulIds);
    }

    // Update local state to remove ALL IDs that were requested for deletion
    // (whether Firebase delete succeeded or not - to keep UI in sync with user intent)
    console.log('Updating local state, removing IDs:', validIds);
    setTransactions(prev => {
      const newTransactions = prev.filter(t => !validIds.includes(t.id));
      console.log('Local state updated. Before:', prev.length, 'After:', newTransactions.length);
      return newTransactions;
    });

    console.log('=== DELETE TRANSACTIONS COMPLETE ===');
    
    // Show success message - with offline persistence, Firebase delete may appear to fail
    // but actually succeeds. We always remove from local state to keep UI responsive.
    const message = failedDeletes.length > 0 
      ? `Deleted ${validIds.length - failedDeletes.length} (syncing...)`
      : `${validIds.length} transaction(s) deleted`;
      
    showToast(
      validIds.length > 1 ? 'Transactions deleted' : 'Transaction deleted',
      message
    );
    
    // Don't throw error - with offline persistence, the delete is queued
    // and will sync when online. The UI already reflects the deletion.
    console.log('Delete operation complete. Note: With offline persistence, deletions are queued and sync when online.');
  }, [showToast, transactions]);

  // Clear all data from local and Firebase
  const clearAllData = useCallback(async (): Promise<void> => {
    console.log('Clearing all data...');
    
    // Unsubscribe from Firestore listeners first to prevent race conditions
    // This prevents "INTERNAL ASSERTION FAILED" errors when deleting documents
    // while real-time listeners are active
    if (unsubscribeRef.current) {
      console.log('Unsubscribing Firestore listeners before clearing data...');
      unsubscribeRef.current();
      unsubscribeRef.current = undefined;
    }
    
    // Clear local state first (immediately update UI)
    setFarmers([]);
    setProducts([]);
    setTransactions([]);
    console.log('Local state cleared');
    
    // Clear local database first, then cloud data for the current account.
    const userId = user?.uid || user?.id;
    await Database.clearAllData(userId);
    setLastSyncTime(new Date());

    console.log('All local and Firebase data cleared');
    console.log('All data cleared successfully');
    
    // Note: The useEffect will automatically re-subscribe to listeners
    // when the component re-renders with the updated state
  }, [user?.uid, user?.id]);

  // Search functions
  const searchFarmers = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return farmers.filter(
        (f) =>
          f.name.toLowerCase().includes(lowerQuery) ||
          f.location?.toLowerCase().includes(lowerQuery) ||
          f.contact?.toLowerCase().includes(lowerQuery)
      );
    },
    [farmers]
  );

  const searchProducts = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.notes?.toLowerCase().includes(lowerQuery)
      );
    },
    [products]
  );

  const searchTransactions = useCallback(
    (query: string) => {
      const lowerQuery = query.toLowerCase();
      return transactions.filter(
        (t) =>
          t.farmerName.toLowerCase().includes(lowerQuery) ||
          t.productName?.toLowerCase().includes(lowerQuery)
      );
    },
    [transactions]
  );

  const value: AppContextType = {
    isLoading,
    farmers,
    addFarmer,
    getFarmer,
    updateFarmer,
    deleteFarmer,
    getFarmerDebt,
    updateFarmerDebt,
    recordDebt,
    recordDebtPayment,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    transactions,
    addTransaction,
    getTransactionsByFarmer,
    getTransaction,
    searchFarmers,
    searchProducts,
    searchTransactions,
    deleteTransactions,
    refreshData,
    isSyncing,
    lastSyncTime,
    syncError,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
