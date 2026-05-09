import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'farmer' | 'product' | 'transaction';
  data: any;
  timestamp: number;
  attempts: number;
  lastAttempt?: number;
  error?: string;
}

export interface SyncQueueStatus {
  pending: number;
  failed: number;
  total: number;
  lastSync?: Date;
  isProcessing: boolean;
}

class SyncQueue {
  private static instance: SyncQueue;
  private queue: SyncOperation[] = [];
  private isProcessing = false;
  private listeners: ((status: SyncQueueStatus) => void)[] = [];

  private constructor() {
    this.loadQueue();
  }

  static getInstance(): SyncQueue {
    if (!SyncQueue.instance) {
      SyncQueue.instance = new SyncQueue();
    }
    return SyncQueue.instance;
  }

  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('syncQueue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  public addOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'attempts'>): void {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${operation.type}_${operation.entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      attempts: 0,
    };

    this.queue.push(syncOp);
    this.saveQueue();
    this.notifyListeners();

    // Try to sync immediately if online
    this.processQueue();
  }

  public async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.notifyListeners();

    try {
      // Import Firebase dynamically to avoid circular dependencies
      const FirebaseDB = await import('./firebaseDatabase');
      
      // Process operations in order
      for (let i = 0; i < this.queue.length; i++) {
        const operation = this.queue[i];
        
        try {
          await this.processOperation(operation, FirebaseDB);
          
          // Remove successful operation
          this.queue.splice(i, 1);
          i--; // Adjust index after removal
          
        } catch (error) {
          console.error(`Failed to process operation ${operation.id}:`, error);
          
          operation.attempts++;
          operation.lastAttempt = Date.now();
          operation.error = error instanceof Error ? error.message : 'Unknown error';
          
          // Remove operation if it has failed too many times
          if (operation.attempts >= 3) {
            console.warn(`Removing operation ${operation.id} after 3 failed attempts`);
            this.queue.splice(i, 1);
            i--;
          }
        }
      }

      await this.saveQueue();
      
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  private async processOperation(operation: SyncOperation, FirebaseDB: any): Promise<void> {
    const { type, entityType, data } = operation;

    switch (entityType) {
      case 'farmer':
        if (type === 'create') {
          await FirebaseDB.addFarmer(data);
        } else if (type === 'update') {
          await FirebaseDB.updateFarmer(data.id, data);
        } else if (type === 'delete') {
          await FirebaseDB.deleteFarmer(data.id);
        }
        break;

      case 'product':
        if (type === 'create') {
          await FirebaseDB.addProduct(data);
        } else if (type === 'update') {
          await FirebaseDB.updateProduct(data.id, data);
        } else if (type === 'delete') {
          await FirebaseDB.deleteProduct(data.id);
        }
        break;

      case 'transaction':
        if (type === 'create') {
          await FirebaseDB.addTransaction(data);
        } else if (type === 'update') {
          await FirebaseDB.updateTransaction(data.id, data);
        } else if (type === 'delete') {
          await FirebaseDB.deleteTransaction(data.id);
        }
        break;

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  public getStatus(): SyncQueueStatus {
    const pending = this.queue.filter(op => op.attempts === 0).length;
    const failed = this.queue.filter(op => op.attempts > 0).length;
    
    return {
      pending,
      failed,
      total: this.queue.length,
      lastSync: this.queue.length > 0 ? new Date(Math.max(...this.queue.map(op => op.timestamp))) : undefined,
      isProcessing: this.isProcessing,
    };
  }

  public getFailedOperations(): SyncOperation[] {
    return this.queue.filter(op => op.attempts > 0);
  }

  public retryFailedOperations(): void {
    const failedOps = this.queue.filter(op => op.attempts > 0);
    failedOps.forEach(op => {
      op.attempts = 0;
      op.lastAttempt = undefined;
      op.error = undefined;
    });
    this.saveQueue();
    this.processQueue();
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    this.notifyListeners();
  }

  public subscribe(listener: (status: SyncQueueStatus) => void): () => void {
    this.listeners.push(listener);
    listener(this.getStatus());
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

export const syncQueue = SyncQueue.getInstance();

// Helper functions for common operations
export const queueFarmerCreate = (farmerData: any) => {
  syncQueue.addOperation({
    type: 'create',
    entityType: 'farmer',
    data: farmerData,
  });
};

export const queueFarmerUpdate = (farmerData: any) => {
  syncQueue.addOperation({
    type: 'update',
    entityType: 'farmer',
    data: farmerData,
  });
};

export const queueFarmerDelete = (farmerId: string) => {
  syncQueue.addOperation({
    type: 'delete',
    entityType: 'farmer',
    data: { id: farmerId },
  });
};

export const queueProductCreate = (productData: any) => {
  syncQueue.addOperation({
    type: 'create',
    entityType: 'product',
    data: productData,
  });
};

export const queueProductUpdate = (productData: any) => {
  syncQueue.addOperation({
    type: 'update',
    entityType: 'product',
    data: productData,
  });
};

export const queueProductDelete = (productId: string) => {
  syncQueue.addOperation({
    type: 'delete',
    entityType: 'product',
    data: { id: productId },
  });
};

export const queueTransactionCreate = (transactionData: any) => {
  syncQueue.addOperation({
    type: 'create',
    entityType: 'transaction',
    data: transactionData,
  });
};

export const queueTransactionUpdate = (transactionData: any) => {
  syncQueue.addOperation({
    type: 'update',
    entityType: 'transaction',
    data: transactionData,
  });
};

export const queueTransactionDelete = (transactionId: string) => {
  syncQueue.addOperation({
    type: 'delete',
    entityType: 'transaction',
    data: { id: transactionId },
  });
};
