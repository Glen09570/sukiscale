import { useAuth } from '@/context/AuthContext';
import * as Database from '@/services/database';
import { sendDebtNotification, sendPaymentNotification } from '@/services/emailService';
import * as FirebaseDB from '@/services/firebaseDatabase';
import { seedDatabaseIfEmpty } from '@/services/seedData';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { 
  syncQueue, 
  queueFarmerCreate, 
  queueFarmerUpdate, 
  queueFarmerDelete,
  queueProductCreate,
  queueProductUpdate,
  queueProductDelete,
  queueTransactionCreate,
  queueTransactionUpdate,
  queueTransactionDelete,
  SyncQueueStatus 
} from '@/services/syncQueue';
import { conflictResolver, ConflictData } from '@/services/conflictResolution';
import { 
  cacheManager, 
  cacheFarmers, 
  getCachedFarmers, 
  cacheProducts, 
  getCachedProducts, 
  cacheTransactions, 
  getCachedTransactions,
  loadProgressiveData 
} from '@/services/cacheManager';
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

interface EnhancedAppContextType {
  // Loading state
  isLoading: boolean;
  
  // Network status
  networkStatus: ReturnType<typeof useNetworkStatus>;
  
  // Sync status
  syncStatus: SyncQueueStatus;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncError: string | null;
  
  // Conflicts
  conflicts: ConflictData[];
  conflictCount: number;
  
  // Data
  farmers: AppFarmer[];
  products: AppProduct[];
  transactions: AppTransaction[];
  
  // Farmers
  addFarmer: (farmer: { name: string; contact?: string; email?: string; location?: string }) => Promise<void>;
  updateFarmer: (id: string, farmer: Partial<AppFarmer>) => Promise<void>;
  deleteFarmer: (id: string) => Promise<void>;
  getFarmerDebt: (farmerId: string) => number;
  
  // Products
  addProduct: (product: { name: string; price: number; notes?: string }) => Promise<void>;
  updateProduct: (id: string, product: Partial<AppProduct>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Transactions
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
    weights?: number[];
  }) => Promise<AppTransaction>;
  updateTransaction: (id: string, transaction: Partial<AppTransaction>) => Promise<void>;
  deleteTransactions: (ids: string[]) => Promise<void>;
  
  // Debt management
  recordDebt: (farmerId: string, amount: number, note?: string) => Promise<void>;
  recordDebtPayment: (farmerId: string, amount: number, note?: string) => Promise<void>;
  
  // Refresh
  refreshData: () => Promise<void>;
  
  // Clear all data
  clearAllData: () => Promise<void>;
  
  // Offline operations
  forceSync: () => Promise<void>;
  retryFailedSync: () => Promise<void>;
  clearSyncQueue: () => Promise<void>;
  
  // Cache operations
  clearCache: () => Promise<void>;
  getCacheStats: () => any;
}

const EnhancedAppContext = createContext<EnhancedAppContextType | undefined>(undefined);

export function EnhancedAppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const networkStatus = useNetworkStatus();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  
  const [farmers, setFarmers] = useState<AppFarmer[]>([]);
  const [products, setProducts] = useState<AppProduct[]>([]);
  const [transactions, setTransactions] = useState<AppTransaction[]>([]);
  
  const [syncStatus, setSyncStatus] = useState<SyncQueueStatus>({
    pending: 0,
    failed: 0,
    total: 0,
    isProcessing: false,
  });
  
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const unsubscribeRef = useRef<(() => void) | undefined>(undefined);
  const recentlyDeletedIdsRef = useRef<Set<string>>(new Set());

  // Initialize sync queue subscription
  useEffect(() => {
    const unsubscribe = syncQueue.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  // Update conflicts periodically
  useEffect(() => {
    const updateConflicts = () => {
      const unresolvedConflicts = conflictResolver.getUnresolvedConflicts();
      setConflicts(unresolvedConflicts);
    };

    updateConflicts();
    const interval = setInterval(updateConflicts, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (networkStatus.isConnected && syncStatus.total > 0) {
      console.log('Network restored, triggering sync');
      forceSync();
    }
  }, [networkStatus.isConnected, syncStatus.total]);

  // Enhanced data loading with caching and progressive loading
  const loadFarmers = useCallback(async (userId: string) => {
    try {
      // Try cache first
      const cached = await getCachedFarmers(userId);
      if (cached) {
        setFarmers(cached);
      }

      // Load fresh data with progressive loading
      const freshFarmers = await loadProgressiveData(
        userId,
        'farmers',
        async (limit?: number, offset?: number) => {
          return await Database.getAllFarmers();
        }
      );

      setFarmers(freshFarmers);
      await cacheFarmers(userId, freshFarmers);

      // Also sync with Firebase if online
      if (networkStatus.isConnected) {
        try {
          const firebaseFarmers = await FirebaseDB.getFarmers(userId);
          // Check for conflicts and merge if needed
          for (const fbFarmer of firebaseFarmers) {
            const localFarmer = freshFarmers.find(f => f.id === fbFarmer.id);
            if (localFarmer) {
              await conflictResolver.detectConflict('farmer', localFarmer, fbFarmer);
            }
          }
        } catch (error) {
          console.log('Firebase sync failed, using local data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading farmers:', error);
    }
  }, [networkStatus.isConnected]);

  const loadProducts = useCallback(async (userId: string) => {
    try {
      // Try cache first
      const cached = await getCachedProducts(userId);
      if (cached) {
        setProducts(cached);
      }

      // Load fresh data with progressive loading
      const freshProducts = await loadProgressiveData(
        userId,
        'products',
        async (limit?: number, offset?: number) => {
          return await Database.getAllProducts();
        }
      );

      setProducts(freshProducts);
      await cacheProducts(userId, freshProducts);

      // Also sync with Firebase if online
      if (networkStatus.isConnected) {
        try {
          const firebaseProducts = await FirebaseDB.getProducts(userId);
          // Check for conflicts and merge if needed
          for (const fbProduct of firebaseProducts) {
            const localProduct = freshProducts.find(p => p.id === fbProduct.id);
            if (localProduct) {
              await conflictResolver.detectConflict('product', localProduct, fbProduct);
            }
          }
        } catch (error) {
          console.log('Firebase sync failed, using local data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, [networkStatus.isConnected]);

  const loadTransactions = useCallback(async (userId: string) => {
    try {
      // Try cache first
      const cached = await getCachedTransactions(userId);
      if (cached) {
        setTransactions(cached);
      }

      // Load fresh data with progressive loading
      const freshTransactions = await loadProgressiveData(
        userId,
        'transactions',
        async (limit?: number, offset?: number) => {
          return await Database.getAllTransactions();
        }
      );

      setTransactions(freshTransactions);
      await cacheTransactions(userId, freshTransactions);

      // Also sync with Firebase if online
      if (networkStatus.isConnected) {
        try {
          const firebaseTransactions = await FirebaseDB.getTransactions(userId, 100);
          // Check for conflicts and merge if needed
          for (const fbTransaction of firebaseTransactions) {
            const localTransaction = freshTransactions.find(t => t.id === fbTransaction.id);
            if (localTransaction) {
              await conflictResolver.detectConflict('transaction', localTransaction, fbTransaction);
            }
          }
        } catch (error) {
          console.log('Firebase sync failed, using local data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [networkStatus.isConnected]);

  // Enhanced refresh data function
  const refreshData = useCallback(async () => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const refreshTask = (async () => {
      try {
        setIsLoading(true);
        
        // Initialize local database
        await Database.initDatabase();
        
        // Seed empty database
        if (Platform.OS !== 'web') {
          await seedDatabaseIfEmpty();
        }

        const userId = user?.uid || user?.id;
        if (!userId) {
          console.log('No user ID available, skipping data load');
          return;
        }

        // Load all data types in parallel
        await Promise.all([
          loadFarmers(userId),
          loadProducts(userId),
          loadTransactions(userId),
        ]);

        // Initialize Firebase if online
        if (networkStatus.isConnected && user?.uid) {
          try {
            await FirebaseDB.initFirestore();
            setSyncError(null);
          } catch (error) {
            console.error('Firebase init error:', error);
            setSyncError('Firebase sync unavailable');
          }
        }

        setLastSyncTime(new Date());
      } catch (error) {
        console.error('Error during data refresh:', error);
        showToast('Error loading data', 'error');
      } finally {
        setIsLoading(false);
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshTask;
    return refreshTask;
  }, [user, loadFarmers, loadProducts, loadTransactions, networkStatus.isConnected, showToast]);

  // Enhanced farmer operations with offline support
  const addFarmer = useCallback(async (farmerData: { name: string; contact?: string; email?: string; location?: string }) => {
    const userId = user?.uid || user?.id;
    
    try {
      // Add to local database first (offline-first)
      const localId = await Database.addFarmer({
        name: farmerData.name,
        contact: farmerData.contact || '',
        email: farmerData.email || '',
        location: farmerData.location || '',
        debt_balance: 0,
        userId: userId || '',
      });

      // Update local state immediately
      const newFarmer: AppFarmer = {
        id: localId,
        ...farmerData,
        debt_balance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setFarmers(prev => [...prev, newFarmer]);
      
      // Update cache
      if (userId) {
        await cacheFarmers(userId, [...farmers, newFarmer]);
      }

      showToast('Farmer added successfully', 'success');

      // Queue for sync if online, or add to sync queue if offline
      if (networkStatus.isConnected) {
        queueFarmerCreate(newFarmer);
        await syncQueue.processQueue();
      } else {
        queueFarmerCreate(newFarmer);
        showToast('Changes will sync when online', 'info');
      }

    } catch (error) {
      console.error('Error adding farmer:', error);
      showToast('Error adding farmer', 'error');
      throw error;
    }
  }, [user, farmers, networkStatus.isConnected, showToast]);

  const updateFarmer = useCallback(async (id: string, farmerData: Partial<AppFarmer>) => {
    try {
      await Database.updateFarmer(id, {
        name: farmerData.name,
        contact: farmerData.contact,
        email: farmerData.email,
        location: farmerData.location,
        debt_balance: farmerData.debt_balance,
      });

      setFarmers(prev => prev.map(f => f.id === id ? { ...f, ...farmerData } : f));
      
      // Update cache
      const userId = user?.uid || user?.id;
      if (userId) {
        await cacheFarmers(userId, farmers.map(f => f.id === id ? { ...f, ...farmerData } : f));
      }

      showToast('Farmer updated successfully', 'success');

      // Queue for sync
      const updatedFarmer = { ...farmers.find(f => f.id === id), ...farmerData };
      if (networkStatus.isConnected) {
        queueFarmerUpdate(updatedFarmer);
        await syncQueue.processQueue();
      } else {
        queueFarmerUpdate(updatedFarmer);
        showToast('Changes will sync when online', 'info');
      }

    } catch (error) {
      console.error('Error updating farmer:', error);
      showToast('Error updating farmer', 'error');
      throw error;
    }
  }, [farmers, user, networkStatus.isConnected, showToast]);

  const deleteFarmer = useCallback(async (id: string) => {
    const farmerName = farmers.find((f) => f.id === id)?.name;
    
    try {
      await Database.deleteFarmer(id);
      setFarmers(prev => prev.filter(f => f.id !== id));
      
      // Update cache
      const userId = user?.uid || user?.id;
      if (userId) {
        await cacheFarmers(userId, farmers.filter(f => f.id !== id));
      }

      showToast(`Farmer "${farmerName}" deleted`, 'success');

      // Queue for sync
      if (networkStatus.isConnected) {
        queueFarmerDelete(id);
        await syncQueue.processQueue();
      } else {
        queueFarmerDelete(id);
        showToast('Changes will sync when online', 'info');
      }

    } catch (error) {
      console.error('Error deleting farmer:', error);
      showToast('Error deleting farmer', 'error');
      throw error;
    }
  }, [farmers, user, networkStatus.isConnected, showToast]);

  // Similar enhanced operations for products and transactions...
  const addProduct = useCallback(async (productData: { name: string; price: number; notes?: string }) => {
    const userId = user?.uid || user?.id;
    
    try {
      const localId = await Database.addProduct({
        name: productData.name,
        price: productData.price,
        notes: productData.notes || '',
        is_active: 1,
        userId: userId || '',
      });

      const newProduct: AppProduct = {
        id: localId,
        ...productData,
        is_active: 1,
        updatedAt: new Date().toISOString(),
      };

      setProducts(prev => [...prev, newProduct]);
      
      if (userId) {
        await cacheProducts(userId, [...products, newProduct]);
      }

      showToast('Product added successfully', 'success');

      if (networkStatus.isConnected) {
        queueProductCreate(newProduct);
        await syncQueue.processQueue();
      } else {
        queueProductCreate(newProduct);
        showToast('Changes will sync when online', 'info');
      }

    } catch (error) {
      console.error('Error adding product:', error);
      showToast('Error adding product', 'error');
      throw error;
    }
  }, [user, products, networkStatus.isConnected, showToast]);

  const updateProduct = useCallback(async (id: string, productData: Partial<AppProduct>) => {
    try {
      await Database.updateProduct(id, {
        name: productData.name,
        price: productData.price,
        notes: productData.notes,
        is_active: productData.is_active,
      });

      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...productData } : p));
      
      const userId = user?.uid || user?.id;
      if (userId) {
        await cacheProducts(userId, products.map(p => p.id === id ? { ...p, ...productData } : p));
      }

      showToast('Product updated successfully', 'success');

      const updatedProduct = { ...products.find(p => p.id === id), ...productData };
      if (networkStatus.isConnected) {
        queueProductUpdate(updatedProduct);
        await syncQueue.processQueue();
      } else {
        queueProductUpdate(updatedProduct);
        showToast('Changes will sync when online', 'info');
      }

    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Error updating product', 'error');
      throw error;
    }
  }, [products, user, networkStatus.isConnected, showToast]);

  const deleteProduct = useCallback(async (id: string) => {
    const productName = products.find((p) => p.id === id)?.name;
    
    try {
      await Database.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      
      const userId = user?.uid || user?.id;
      if (userId) {
        await cacheProducts(userId, products.filter(p => p.id !== id));
      }

      showToast(`Product "${productName}" deleted`, 'success');

      if (networkStatus.isConnected) {
        queueProductDelete(id);
        await syncQueue.processQueue();
      } else {
        queueProductDelete(id);
        showToast('Changes will sync when online', 'info');
      }

    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Error deleting product', 'error');
      throw error;
    }
  }, [products, user, networkStatus.isConnected, showToast]);

  // Transaction operations
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
    weights?: number[];
  }): Promise<AppTransaction> => {
    const userId = user?.uid || user?.id;
    
    try {
      const localId = await Database.addTransaction({
        farmerId: transactionData.farmerId,
        farmerName: transactionData.farmerName,
        productId: transactionData.productId || '',
        productName: transactionData.productName || '',
        pricePerKilo: transactionData.pricePerKilo || 0,
        weight: transactionData.weight,
        totalAmount: transactionData.totalAmount,
        debtDeducted: transactionData.debtDeducted,
        finalPayment: transactionData.finalPayment,
        date: new Date().toISOString(),
        weights: transactionData.weights || [transactionData.weight],
        userId: userId || '',
      });

      const newTransaction: AppTransaction = {
        id: localId,
        ...transactionData,
        date: new Date().toISOString(),
        weights: transactionData.weights || [transactionData.weight],
      };

      setTransactions(prev => [newTransaction, ...prev]);
      
      if (userId) {
        await cacheTransactions(userId, [newTransaction, ...transactions]);
      }

      showToast('Transaction added successfully', 'success');

      if (networkStatus.isConnected) {
        queueTransactionCreate(newTransaction);
        await syncQueue.processQueue();
      } else {
        queueTransactionCreate(newTransaction);
        showToast('Changes will sync when online', 'info');
      }

      return newTransaction;

    } catch (error) {
      console.error('Error adding transaction:', error);
      showToast('Error adding transaction', 'error');
      throw error;
    }
  }, [user, transactions, networkStatus.isConnected, showToast]);

  const deleteTransactions = useCallback(async (ids: string[]) => {
    try {
      for (const id of ids) {
        await Database.deleteTransaction(id);
      }

      setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
      
      const userId = user?.uid || user?.id;
      if (userId) {
        await cacheTransactions(userId, transactions.filter(t => !ids.includes(t.id)));
      }

      showToast(`${ids.length} transaction(s) deleted`, 'success');

      // Queue for sync
      for (const id of ids) {
        if (networkStatus.isConnected) {
          queueTransactionDelete(id);
        } else {
          queueTransactionDelete(id);
        }
      }

      if (networkStatus.isConnected) {
        await syncQueue.processQueue();
      } else {
        showToast('Changes will sync when online', 'info');
      }

    } catch (error) {
      console.error('Error deleting transactions:', error);
      showToast('Error deleting transactions', 'error');
      throw error;
    }
  }, [transactions, user, networkStatus.isConnected, showToast]);

  // Helper functions
  const getFarmerDebt = useCallback((farmerId: string) => {
    const farmer = farmers.find(f => f.id === farmerId);
    return farmer?.debt_balance || 0;
  }, [farmers]);

  const recordDebt = useCallback(async (farmerId: string, amount: number, note?: string) => {
    const currentDebt = getFarmerDebt(farmerId);
    const newBalance = currentDebt + amount;
    await updateFarmer(farmerId, { debt_balance: newBalance });
    showToast(`Debt of ₱${amount.toLocaleString()} recorded`, 'success');
  }, [getFarmerDebt, updateFarmer, showToast]);

  const recordDebtPayment = useCallback(async (farmerId: string, amount: number, note?: string) => {
    const currentDebt = getFarmerDebt(farmerId);
    const newBalance = Math.max(0, currentDebt - amount);
    await updateFarmer(farmerId, { debt_balance: newBalance });
    showToast(`Payment of ₱${amount.toLocaleString()} recorded`, 'success');
  }, [getFarmerDebt, updateFarmer, showToast]);

  // Offline operations
  const forceSync = useCallback(async () => {
    if (!networkStatus.isConnected) {
      showToast('No internet connection', 'error');
      return;
    }

    setIsSyncing(true);
    try {
      await syncQueue.processQueue();
      setLastSyncTime(new Date());
      showToast('Sync completed', 'success');
    } catch (error) {
      console.error('Sync error:', error);
      showToast('Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [networkStatus.isConnected, showToast]);

  const retryFailedSync = useCallback(() => {
    syncQueue.retryFailedOperations();
    showToast('Retrying failed sync operations', 'info');
  }, [showToast]);

  const clearSyncQueue = useCallback(() => {
    syncQueue.clearQueue();
    showToast('Sync queue cleared', 'info');
  }, [showToast]);

  const clearCache = useCallback(async () => {
    await cacheManager.clear();
    showToast('Cache cleared', 'info');
  }, [showToast]);

  const getCacheStats = useCallback(() => {
    return cacheManager.getStats();
  }, []);

  const clearAllData = useCallback(async (): Promise<void> => {
    console.log('Clearing all data...');
    
    try {
      const userId = user?.uid || user?.id;
      await Database.clearAllData(userId);
      
      // Clear Firebase data if online
      if (networkStatus.isConnected && userId) {
        try {
          await FirebaseDB.clearAllData(userId);
        } catch (error) {
          console.log('Failed to clear Firebase data:', error);
        }
      }

      // Clear cache and sync queue
      await cacheManager.clear();
      syncQueue.clearQueue();
      conflictResolver.clearResolvedConflicts();

      // Reset state
      setFarmers([]);
      setProducts([]);
      setTransactions([]);
      setLastSyncTime(new Date());

      console.log('All data cleared successfully');
      showToast('All data cleared', 'success');
    } catch (error) {
      console.error('Error clearing data:', error);
      showToast('Error clearing data', 'error');
      throw error;
    }
  }, [user, networkStatus.isConnected, showToast]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set up real-time Firebase subscription for transactions (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && user?.uid && networkStatus.isConnected) {
      const userId = user.uid;
      
      FirebaseDB.initFirestore()
        .then(() => {
          unsubscribeRef.current = FirebaseDB.subscribeToTransactions(
            userId,
            async (firebaseTransactions) => {
              const recentlyDeleted = recentlyDeletedIdsRef.current;
              const filteredTransactions = firebaseTransactions.filter(
                t => !recentlyDeleted.has(t.id)
              );

              const appTransactions = filteredTransactions.map(mapFirebaseTransaction);
              setTransactions(appTransactions);
              setLastSyncTime(new Date());
              setSyncError(null);

              // Cache the updated transactions
              await cacheTransactions(userId, appTransactions);
            },
            () => setSyncError('Firebase sync unavailable')
          );
        })
        .catch((error) => {
          console.error('Failed to start transaction subscription:', error);
          setSyncError('Firebase sync unavailable');
        });

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }
  }, [user?.uid, networkStatus.isConnected]);

  const value: EnhancedAppContextType = {
    isLoading,
    networkStatus,
    syncStatus,
    isSyncing,
    lastSyncTime,
    syncError,
    conflicts,
    conflictCount: conflicts.length,
    farmers,
    products,
    transactions,
    addFarmer,
    updateFarmer,
    deleteFarmer,
    getFarmerDebt,
    addProduct,
    updateProduct,
    deleteProduct,
    addTransaction,
    updateTransaction: async (id: string, transaction: Partial<AppTransaction>) => {
      // Implementation for updateTransaction
      console.log('Update transaction not fully implemented');
    },
    deleteTransactions,
    recordDebt,
    recordDebtPayment,
    refreshData,
    clearAllData,
    forceSync,
    retryFailedSync,
    clearSyncQueue,
    clearCache,
    getCacheStats,
  };

  return (
    <EnhancedAppContext.Provider value={value}>
      {children}
    </EnhancedAppContext.Provider>
  );
}

export function useEnhancedApp() {
  const context = useContext(EnhancedAppContext);
  if (context === undefined) {
    throw new Error('useEnhancedApp must be used within an EnhancedAppProvider');
  }
  return context;
}
