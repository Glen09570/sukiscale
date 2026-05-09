import { firebaseConfig } from '@/config/firebase';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
    collection,
    deleteDoc,
    disableNetwork,
    doc,
    enableNetwork,
    getDocs,
    initializeFirestore,
    memoryLocalCache,
    onSnapshot,
    persistentLocalCache,
    persistentSingleTabManager,
    query,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc,
    where,
    type DocumentData,
    type Firestore
} from 'firebase/firestore';
import { Platform } from 'react-native';

// Initialize Firebase app (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with offline persistence
let db: Firestore | undefined;
let initPromise: Promise<Firestore> | undefined;

function generateNumericId(): string {
  const timestamp = Date.now().toString();
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestamp}${randomSuffix}`;
}

function getActiveUserId(): string | undefined {
  try {
    return getAuth(app).currentUser?.uid;
  } catch {
    return undefined;
  }
}

function resolveUserId(explicitUserId?: string): string | undefined {
  return explicitUserId || getActiveUserId();
}

// Remove undefined fields from objects for Firestore storage
function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

export async function initFirestore(): Promise<Firestore> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const localCache = Platform.OS === 'web'
        ? persistentLocalCache({ tabManager: persistentSingleTabManager() })
        : memoryLocalCache();

      db = initializeFirestore(app, {
        localCache,
      });
      console.log(`Firestore initialized with ${Platform.OS === 'web' ? 'persistent' : 'memory'} cache (${Platform.OS})`);

      return db;
    } catch (error) {
      console.error('Error initializing Firestore:', error);
      // Fallback to default initialization (memory cache)
      db = initializeFirestore(app, {});
      return db;
    }
  })();

  return initPromise;
}

// Get Firestore instance
export function getFirestoreInstance(): Firestore {
  if (!db) {
    throw new Error('Firestore not initialized. Call initFirestore() first.');
  }
  return db;
}

export async function initDatabase(): Promise<Firestore> {
  return initFirestore();
}

export async function closeDatabase(): Promise<void> {
  return;
}

// Types
export interface Farmer {
  id?: string;
  name: string;
  location?: string;
  contact?: string;
  email?: string;
  debt_balance: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
}

export interface Product {
  id?: string;
  name: string;
  price_per_kg: number;
  current_stock_kg: number;
  min_stock_kg?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
}

export interface Transaction {
  id?: string;
  farmerId: string;
  farmerName: string;
  productId?: string;
  productName?: string;
  pricePerKg?: number;
  totalWeight?: number;
  totalAmount: number;
  debtDeducted?: number;
  finalPayment?: number;
  weights?: number[];
  note?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  userId: string;
}

export interface DebtRecord {
  id?: string;
  farmerId: string;
  transaction_id?: string;
  type: 'add' | 'deduct' | 'pay' | 'payment';
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt?: Timestamp;
  userId: string;
}

// Helper to convert Firestore data
function convertTimestamps(data: DocumentData): DocumentData {
  const result = { ...data };
  if (data.createdAt instanceof Timestamp) {
    result.createdAt = data.createdAt.toDate().toISOString();
  }
  if (data.updatedAt instanceof Timestamp) {
    result.updatedAt = data.updatedAt.toDate().toISOString();
  }
  return result;
}

// Farmers Collection
export async function getFarmers(userId: string): Promise<Farmer[]> {
  const db = getFirestoreInstance();
  const q = query(collection(db, 'farmers'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...convertTimestamps(doc.data()),
    id: doc.id,  // Ensure doc.id takes precedence over any id in document data
  } as Farmer));
}

export async function addFarmer(farmer: Omit<Farmer, 'id'> & { id?: string }): Promise<string> {
  const db = getFirestoreInstance();
  // Use local ID if provided, otherwise auto-generate
  const docId = farmer.id ? String(farmer.id) : generateNumericId();
  await setDoc(doc(db, 'farmers', docId), removeUndefinedFields({
    ...farmer,
    id: docId,
    userId: resolveUserId(farmer.userId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  return docId;
}

export async function updateFarmer(farmerId: string, updates: Partial<Farmer>): Promise<void> {
  const db = getFirestoreInstance();
  const docRef = doc(db, 'farmers', farmerId);
  await updateDoc(docRef, removeUndefinedFields({
    ...updates,
    updatedAt: serverTimestamp(),
  }));
}

export async function deleteFarmer(farmerId: string): Promise<void> {
  const db = getFirestoreInstance();
  await deleteDoc(doc(db, 'farmers', farmerId));
}

// Products Collection
export async function getProducts(userId: string): Promise<Product[]> {
  const db = getFirestoreInstance();
  const q = query(collection(db, 'products'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...convertTimestamps(doc.data()),
    id: doc.id,  // Ensure doc.id takes precedence over any id in document data
  } as Product));
}

export async function addProduct(product: Omit<Product, 'id'> & { id?: string }): Promise<string> {
  const db = getFirestoreInstance();
  // Use local ID if provided, otherwise auto-generate
  const docId = product.id ? String(product.id) : generateNumericId();
  await setDoc(doc(db, 'products', docId), removeUndefinedFields({
    ...product,
    id: docId,
    userId: resolveUserId(product.userId),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  return docId;
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
  const db = getFirestoreInstance();
  const docRef = doc(db, 'products', productId);
  await updateDoc(docRef, removeUndefinedFields({
    ...updates,
    updatedAt: serverTimestamp(),
  }));
}

export async function deleteProduct(productId: string): Promise<void> {
  const db = getFirestoreInstance();
  await deleteDoc(doc(db, 'products', productId));
}

// Transactions Collection
export async function getTransactions(userId: string, limit?: number): Promise<Transaction[]> {
  const db = getFirestoreInstance();
  console.log('🔍 getTransactions: Fetching for userId:', userId);
  let q = query(collection(db, 'transactions'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  console.log('🔍 getTransactions: Found', snapshot.docs.length, 'documents');
  const transactions = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log('🔍 getTransactions: doc.id =', doc.id, '| data.id =', data.id, '| farmerName =', data.farmerName);
    return {
      id: doc.id,
      ...convertTimestamps(data),
    } as Transaction;
  });
  return limit ? transactions.slice(0, limit) : transactions;
}

export async function addTransaction(transaction: Omit<Transaction, 'id'> & { id?: string }): Promise<string> {
  const db = getFirestoreInstance();
  const userId = resolveUserId(transaction.userId);
  
  if (transaction.id) {
    console.log('📝 addTransaction: Using provided ID:', transaction.id);
    await setDoc(doc(db, 'transactions', transaction.id), removeUndefinedFields({
      ...transaction,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    console.log('✅ addTransaction: Stored with ID:', transaction.id);
    return transaction.id;
  }

  const docId = generateNumericId();
  console.log('📝 addTransaction: Generated new ID:', docId);
  await setDoc(doc(db, 'transactions', docId), removeUndefinedFields({
    ...transaction,
    id: docId,
    userId,
    totalWeight: transaction.totalWeight ?? (transaction.weights?.reduce((sum, weight) => sum + weight, 0) ?? 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }));
  console.log('✅ addTransaction: Stored with generated ID:', docId);
  return docId;
}

// Debt Records Collection
export async function getDebtRecords(farmerId: string, userId: string): Promise<DebtRecord[]> {
  const db = getFirestoreInstance();
  const q = query(
    collection(db, 'debtRecords'),
    where('farmerId', '==', farmerId),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...convertTimestamps(doc.data()),
  } as DebtRecord));
}

export async function addDebtRecord(record: Omit<DebtRecord, 'id'>): Promise<string> {
  const db = getFirestoreInstance();
  const docId = generateNumericId();
  await setDoc(doc(db, 'debtRecords', docId), removeUndefinedFields({
    ...record,
    id: docId,
    userId: resolveUserId(record.userId),
    createdAt: serverTimestamp(),
  }));
  return docId;
}

// Real-time listeners
export function subscribeToFarmers(
  userId: string,
  callback: (farmers: Farmer[]) => void
): () => void {
  if (Platform.OS === 'web') {
    console.log('Skipping farmer realtime subscription on web');
    return () => {};
  }

  const db = getFirestoreInstance();
  const q = query(collection(db, 'farmers'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const farmers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as Farmer));
    callback(farmers);
  });
}

export function subscribeToProducts(
  userId: string,
  callback: (products: Product[]) => void
): () => void {
  if (Platform.OS === 'web') {
    console.log('Skipping product realtime subscription on web');
    return () => {};
  }

  const db = getFirestoreInstance();
  const q = query(collection(db, 'products'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...convertTimestamps(doc.data()),
    } as Product));
    callback(products);
  });
}

export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (Platform.OS === 'web') {
    console.log('Skipping transaction realtime subscription on web');
    return () => {};
  }

  const db = getFirestoreInstance();
  const q = query(collection(db, 'transactions'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({
      ...convertTimestamps(doc.data()),
      id: doc.id,
    } as Transaction));

    transactions.sort((a: any, b: any) => {
      const aDate = new Date(a.transaction_date || a.createdAt || 0).getTime();
      const bDate = new Date(b.transaction_date || b.createdAt || 0).getTime();
      return bDate - aDate;
    });

    callback(transactions);
  }, (error) => {
    console.error('Transaction subscription error:', error);
    onError?.(error);
  });
}

// Get all farmers (for sync from Firebase to SQLite)
export async function getAllFarmers(userId?: string): Promise<Farmer[]> {
  const db = getFirestoreInstance();
  const q = userId
    ? query(collection(db, 'farmers'), where('userId', '==', userId))
    : query(collection(db, 'farmers'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...convertTimestamps(doc.data()),
    id: doc.id,  // Ensure doc.id takes precedence over any id in document data
  } as Farmer));
}

// Delete a transaction from Firebase
export async function deleteTransaction(id: string): Promise<void> {
  console.log('🔥 Firebase deleteTransaction called with ID:', id);
  
  if (!id || id.trim() === '') {
    console.error('❌ Cannot delete transaction: ID is empty or invalid');
    throw new Error('Transaction ID is required');
  }
  
  // Ensure Firestore is initialized before deleting
  const db = await initFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized, cannot delete');
    throw new Error('Firestore not initialized');
  }
  
  try {
    const docRef = doc(db, 'transactions', id);
    console.log('🔥 Deleting document at path:', `transactions/${id}`);
    
    // On mobile with offline persistence, deleteDoc marks for deletion
    // and will sync when online. The local cache might still show the doc briefly.
    await deleteDoc(docRef);
    console.log('✅ deleteDoc() completed for:', id);
    
    // Note: With Firestore offline persistence, the document is marked for deletion
    // The actual server delete happens asynchronously when the device is online
    // We consider this successful if deleteDoc() doesn't throw
    console.log('✅ Transaction deletion queued (will sync to server):', id);
  } catch (error) {
    console.error('❌ Error deleting transaction from Firebase:', id, error);
    throw error;
  }
}

// Get all products (for sync from Firebase to SQLite)
export async function getAllProducts(userId?: string): Promise<Product[]> {
  const db = getFirestoreInstance();
  const q = userId
    ? query(collection(db, 'products'), where('userId', '==', userId))
    : query(collection(db, 'products'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    ...convertTimestamps(doc.data()),
    id: doc.id,  // Ensure doc.id takes precedence
  } as Product));
}

// Bulk delete functions for Clear All Data
async function deleteAllDocumentsForUser(collectionName: string, userId?: string): Promise<void> {
  await goOnline();
  const db = getFirestoreInstance();
  const q = userId
    ? query(collection(db, collectionName), where('userId', '==', userId))
    : query(collection(db, collectionName));
  const snapshot = await getDocs(q);

  await Promise.all(
    snapshot.docs.map(docSnap => deleteDoc(doc(db, collectionName, docSnap.id)))
  );

  console.log(`Deleted ${snapshot.docs.length} ${collectionName} documents for user ${userId}`);
}

export async function deleteAllFarmers(userId: string): Promise<void> {
  await deleteAllDocumentsForUser('farmers', userId);
}

export async function deleteAllProducts(userId: string): Promise<void> {
  await deleteAllDocumentsForUser('products', userId);
}

export async function deleteAllTransactions(userId: string): Promise<void> {
  await deleteAllDocumentsForUser('transactions', userId);
}

export async function deleteAllDebtRecords(userId: string): Promise<void> {
  await deleteAllDocumentsForUser('debtRecords', userId);
}

export async function clearAllData(userId?: string): Promise<void> {
  await Promise.all([
    deleteAllDocumentsForUser('farmers', userId),
    deleteAllDocumentsForUser('products', userId),
    deleteAllDocumentsForUser('transactions', userId),
    deleteAllDocumentsForUser('debtRecords', userId),
  ]);
  
  // Also delete orphaned debt records without userId (legacy data)
  if (userId) {
    await deleteOrphanedDebtRecords();
  }
}

// Delete debt records that have no userId or empty userId (legacy data cleanup)
async function deleteOrphanedDebtRecords(): Promise<void> {
  const db = getFirestoreInstance();
  const collectionRef = collection(db, 'debtRecords');
  
  // Get all debt records
  const allRecordsSnapshot = await getDocs(collectionRef);
  const orphanedDocs = allRecordsSnapshot.docs.filter(docSnap => {
    const data = docSnap.data();
    // Consider it orphaned if userId is missing, undefined, or empty string
    return !data.userId || data.userId === '';
  });
  
  if (orphanedDocs.length > 0) {
    console.log(`Found ${orphanedDocs.length} orphaned debt records to delete`);
    await Promise.all(
      orphanedDocs.map(docSnap => deleteDoc(doc(db, 'debtRecords', docSnap.id)))
    );
    console.log(`Deleted ${orphanedDocs.length} orphaned debt records`);
  }
}

export async function resetDatabase(userId?: string): Promise<void> {
  await clearAllData(userId);
}

export async function removeDuplicateFarmers(): Promise<number> {
  const farmers = await getAllFarmers();
  const seen = new Set<string>();
  let removed = 0;

  for (const farmer of farmers) {
    const key = `${farmer.userId || ''}::${farmer.name.toLowerCase().trim()}`;
    if (seen.has(key) && farmer.id) {
      await deleteFarmer(farmer.id);
      removed += 1;
      continue;
    }
    seen.add(key);
  }

  return removed;
}

export async function removeDuplicateProducts(): Promise<number> {
  const products = await getAllProducts();
  const seen = new Set<string>();
  let removed = 0;

  for (const product of products) {
    const key = `${product.userId || ''}::${product.name.toLowerCase().trim()}`;
    if (seen.has(key) && product.id) {
      await deleteProduct(product.id);
      removed += 1;
      continue;
    }
    seen.add(key);
  }

  return removed;
}

export async function removeDuplicateTransactions(userId?: string): Promise<number> {
  const transactions = await getAllTransactions(userId);
  const seen = new Set<string>();
  let removed = 0;

  for (const transaction of transactions) {
    const dateStr = transaction.createdAt instanceof Timestamp
      ? transaction.createdAt.toDate().toISOString()
      : (transaction.createdAt || '');
    const key = `${transaction.userId || ''}::${transaction.farmerId}::${transaction.productId || ''}::${transaction.totalAmount}::${dateStr}`;
    if (seen.has(key) && transaction.id) {
      await deleteTransaction(transaction.id);
      removed += 1;
      continue;
    }
    seen.add(key);
  }

  return removed;
}

export async function getAllTransactions(userId?: string): Promise<(Transaction & { farmer_name: string })[]> {
  const db = getFirestoreInstance();
  const q = userId
    ? query(collection(db, 'transactions'), where('userId', '==', userId))
    : query(collection(db, 'transactions'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = convertTimestamps(docSnap.data()) as Transaction & { farmerName?: string; farmer_name?: string };
    return {
      ...data,
      id: docSnap.id,
      farmer_name: data.farmerName || data.farmer_name || '',
    } as Transaction & { farmer_name: string };
  });
}

export async function getTransactionById(id: string | number): Promise<(Transaction & { farmer_name: string; weights: number[] }) | null> {
  const transactions = await getAllTransactions();
  const transaction = transactions.find(item => item.id === String(id));
  if (!transaction) return null;

  return {
    ...transaction,
    weights: Array.isArray((transaction as Transaction).weights) ? ((transaction as Transaction).weights as number[]) : [],
  };
}

export async function getTransactionsByFarmer(farmerId: string | number): Promise<Transaction[]> {
  const transactions = await getAllTransactions();
  return transactions.filter(transaction => String(transaction.farmerId) === String(farmerId));
}

export async function getDebtRecordsByFarmer(farmerId: string | number): Promise<DebtRecord[]> {
  const db = getFirestoreInstance();
  const snapshot = await getDocs(query(collection(db, 'debtRecords'), where('farmerId', '==', String(farmerId))));
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...convertTimestamps(docSnap.data()),
  } as DebtRecord));
}

export async function addOrUpdateFarmer(farmer: Farmer & { firebaseId?: string }): Promise<void> {
  const db = getFirestoreInstance();
  if (!farmer.id) throw new Error('Farmer must have an ID for sync');

  const docId = String(farmer.id);
  await setDoc(doc(db, 'farmers', docId), removeUndefinedFields({
    ...farmer,
    id: docId,
    userId: resolveUserId(farmer.userId),
    createdAt: farmer.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }), { merge: true });
}

export async function addOrUpdateProduct(product: Product & { firebaseId?: string }): Promise<void> {
  const db = getFirestoreInstance();
  if (!product.id) throw new Error('Product must have an ID for sync');

  const docId = String(product.id);
  await setDoc(doc(db, 'products', docId), removeUndefinedFields({
    ...product,
    id: docId,
    userId: resolveUserId(product.userId),
    createdAt: product.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }), { merge: true });
}

export async function addOrUpdateTransaction(transaction: Partial<Transaction> & { firebaseId?: string }): Promise<void> {
  const db = getFirestoreInstance();
  const docId = String(transaction.firebaseId || transaction.id || generateNumericId());

  await setDoc(doc(db, 'transactions', docId), removeUndefinedFields({
    ...transaction,
    id: docId,
    userId: resolveUserId(transaction.userId),
    totalWeight: transaction.totalWeight ?? (transaction.weights?.reduce((sum, weight) => sum + weight, 0) ?? 0),
    createdAt: transaction.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  }), { merge: true });
}

export async function updateFarmerDebt(farmerId: string | number, newDebtBalance: number): Promise<void> {
  const db = getFirestoreInstance();
  await updateDoc(doc(db, 'farmers', String(farmerId)), removeUndefinedFields({
    debt_balance: newDebtBalance,
    updatedAt: serverTimestamp(),
  }));
}

export async function getFarmerById(id: string | number): Promise<Farmer | null> {
  const farmers = await getAllFarmers();
  return farmers.find(farmer => farmer.id === String(id)) || null;
}

export async function getProductById(id: string | number): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find(product => product.id === String(id)) || null;
}

export async function getAllDebtRecords(): Promise<(DebtRecord & { farmer_name: string })[]> {
  const db = getFirestoreInstance();
  const snapshot = await getDocs(query(collection(db, 'debtRecords')));
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...convertTimestamps(docSnap.data()),
    farmer_name: '',
  } as DebtRecord & { farmer_name: string }));
}

export async function searchFarmers(queryText: string): Promise<Farmer[]> {
  const lowerQuery = queryText.toLowerCase().trim();
  const farmers = await getAllFarmers();
  return farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(lowerQuery) ||
    (farmer.location || '').toLowerCase().includes(lowerQuery) ||
    (farmer.contact || '').toLowerCase().includes(lowerQuery)
  );
}

export async function searchProducts(queryText: string, userId?: string): Promise<Product[]> {
  const lowerQuery = queryText.toLowerCase().trim();
  const products = await getAllProducts(userId);
  return products.filter(product =>
    product.name.toLowerCase().includes(lowerQuery)
  );
}

export async function searchTransactions(queryText: string, userId?: string): Promise<(Transaction & { farmer_name: string })[]> {
  const lowerQuery = queryText.toLowerCase().trim();
  const transactions = await getAllTransactions(userId);
  return transactions.filter(transaction =>
    (transaction.farmer_name || '').toLowerCase().includes(lowerQuery) ||
    (transaction.productName || '').toLowerCase().includes(lowerQuery)
  );
}

// Network control
export async function goOffline(): Promise<void> {
  const db = getFirestoreInstance();
  await disableNetwork(db);
  console.log('Firestore went offline');
}

export async function goOnline(): Promise<void> {
  const db = getFirestoreInstance();
  await enableNetwork(db);
  console.log('Firestore went online');
}

// Sync status monitoring
export function onSyncStatusChange(callback: (isPending: boolean) => void): () => void {
  if (Platform.OS === 'web') {
    return () => {};
  }

  // Firestore automatically handles sync, but we can listen for snapshot metadata
  // to know if data is from cache or server
  return () => {}; // Placeholder - Firestore handles this internally
}

export { app, db };

