import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConflictData {
  id: string;
  entityType: 'farmer' | 'product' | 'transaction';
  localData: any;
  serverData: any;
  timestamp: number;
  resolved?: boolean;
  resolution?: 'local' | 'server' | 'merge';
}

export interface ConflictResolution {
  conflicts: ConflictData[];
  resolveConflict: (conflictId: string, resolution: 'local' | 'server' | 'merge', mergedData?: any) => Promise<void>;
  clearResolvedConflicts: () => Promise<void>;
}

class ConflictResolver {
  private static instance: ConflictResolver;
  private conflicts: ConflictData[] = [];

  private constructor() {
    this.loadConflicts();
  }

  static getInstance(): ConflictResolver {
    if (!ConflictResolver.instance) {
      ConflictResolver.instance = new ConflictResolver();
    }
    return ConflictResolver.instance;
  }

  private async loadConflicts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('conflicts');
      if (stored) {
        this.conflicts = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  }

  private async saveConflicts(): Promise<void> {
    try {
      await AsyncStorage.setItem('conflicts', JSON.stringify(this.conflicts));
    } catch (error) {
      console.error('Failed to save conflicts:', error);
    }
  }

  public async detectConflict(
    entityType: 'farmer' | 'product' | 'transaction',
    localData: any,
    serverData: any
  ): Promise<boolean> {
    // Simple conflict detection - compare timestamps and data
    const localTimestamp = localData.updatedAt || localData.timestamp || 0;
    const serverTimestamp = serverData.updatedAt || serverData.timestamp || 0;

    // If server data is newer and different from local data, there's a potential conflict
    if (serverTimestamp > localTimestamp && this.hasDataChanged(localData, serverData)) {
      const conflict: ConflictData = {
        id: `${entityType}_${localData.id}_${Date.now()}`,
        entityType,
        localData,
        serverData,
        timestamp: Date.now(),
      };

      this.conflicts.push(conflict);
      await this.saveConflicts();
      return true;
    }

    return false;
  }

  private hasDataChanged(localData: any, serverData: any): boolean {
    // Compare relevant fields, ignoring system fields
    const relevantFields = ['name', 'contact', 'email', 'location', 'debt_balance', 'price', 'notes', 'weight', 'totalAmount'];
    
    for (const field of relevantFields) {
      if (localData[field] !== serverData[field]) {
        return true;
      }
    }
    
    return false;
  }

  public async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: any
  ): Promise<void> {
    const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    const conflict = this.conflicts[conflictIndex];
    conflict.resolved = true;
    conflict.resolution = resolution;

    if (resolution === 'merge' && mergedData) {
      // Apply merged data to both local and server
      await this.applyMergedData(conflict, mergedData);
    }

    await this.saveConflicts();
  }

  private async applyMergedData(conflict: ConflictData, mergedData: any): Promise<void> {
    // This would integrate with your database services
    // For now, we'll just mark it as resolved
    console.log('Applying merged data:', mergedData);
  }

  public async clearResolvedConflicts(): Promise<void> {
    this.conflicts = this.conflicts.filter(c => !c.resolved);
    await this.saveConflicts();
  }

  public getUnresolvedConflicts(): ConflictData[] {
    return this.conflicts.filter(c => !c.resolved);
  }

  public getConflictCount(): number {
    return this.getUnresolvedConflicts().length;
  }

  public mergeData(localData: any, serverData: any): any {
    // Simple merge strategy - prefer local data for fields that have been modified
    const merged = { ...serverData };
    
    // Fields where local changes should take precedence
    const localPriorityFields = ['name', 'contact', 'email', 'location'];
    
    for (const field of localPriorityFields) {
      if (localData[field] && localData[field] !== serverData[field]) {
        merged[field] = localData[field];
      }
    }
    
    // For numerical fields, use the most recent value
    const numericalFields = ['debt_balance', 'price', 'weight', 'totalAmount'];
    for (const field of numericalFields) {
      if (typeof localData[field] === 'number' && typeof serverData[field] === 'number') {
        const localTimestamp = localData.updatedAt || localData.timestamp || 0;
        const serverTimestamp = serverData.updatedAt || serverData.timestamp || 0;
        merged[field] = localTimestamp > serverTimestamp ? localData[field] : serverData[field];
      }
    }
    
    // Update timestamp to current time
    merged.updatedAt = new Date().toISOString();
    
    return merged;
  }
}

export const conflictResolver = ConflictResolver.getInstance();

// Helper function to check for conflicts during sync
export const checkForConflicts = async (
  entityType: 'farmer' | 'product' | 'transaction',
  localData: any,
  serverData: any
): Promise<boolean> => {
  return await conflictResolver.detectConflict(entityType, localData, serverData);
};
