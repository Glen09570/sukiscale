import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  lastCleanup: Date | null;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private hits = 0;
  private misses = 0;
  private lastCleanup: Date | null = null;

  private constructor() {
    this.loadCache();
    this.startPeriodicCleanup();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private async loadCache(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('appCache');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(parsed.entries || []);
        this.hits = parsed.hits || 0;
        this.misses = parsed.misses || 0;
        this.lastCleanup = parsed.lastCleanup ? new Date(parsed.lastCleanup) : null;
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        hits: this.hits,
        misses: this.misses,
        lastCleanup: this.lastCleanup?.toISOString(),
      };
      await AsyncStorage.setItem('appCache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  private startPeriodicCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  public async set<T>(
    key: string, 
    data: T, 
    ttl: number = 15 * 60 * 1000, // Default 15 minutes
    version: string = '1.0'
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version,
    };

    this.cache.set(key, entry);
    await this.saveCache();
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      await this.saveCache();
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      await this.saveCache();
      return null;
    }

    this.hits++;
    await this.saveCache();
    return entry.data as T;
  }

  public async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    version?: string
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetcher();
      await this.set(key, data, ttl, version);
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error);
      throw error;
    }
  }

  public async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
    await this.saveCache();
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    await this.saveCache();
  }

  public async clear(): Promise<void> {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.lastCleanup = new Date();
    await this.saveCache();
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.lastCleanup = new Date();
      console.log(`Cache cleanup: removed ${cleanedCount} expired entries`);
      this.saveCache();
    }
  }

  public getStats(): CacheStats {
    const totalEntries = this.cache.size;
    const totalSize = JSON.stringify(Array.from(this.cache.entries())).length;
    const hitRate = this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0;

    return {
      totalEntries,
      totalSize,
      hitRate,
      lastCleanup: this.lastCleanup,
    };
  }

  public getCacheInfo(): Array<{ key: string; size: number; age: number; ttl: number }> {
    const now = Date.now();
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }));
  }
}

export const cacheManager = CacheManager.getInstance();

// Helper functions for specific data types
export const cacheFarmers = async (userId: string, farmers: any[]): Promise<void> => {
  await cacheManager.set(`farmers_${userId}`, farmers, 30 * 60 * 1000); // 30 minutes
};

export const getCachedFarmers = async (userId: string): Promise<any[] | null> => {
  return await cacheManager.get(`farmers_${userId}`);
};

export const cacheProducts = async (userId: string, products: any[]): Promise<void> => {
  await cacheManager.set(`products_${userId}`, products, 30 * 60 * 1000); // 30 minutes
};

export const getCachedProducts = async (userId: string): Promise<any[] | null> => {
  return await cacheManager.get(`products_${userId}`);
};

export const cacheTransactions = async (userId: string, transactions: any[]): Promise<void> => {
  await cacheManager.set(`transactions_${userId}`, transactions, 10 * 60 * 1000); // 10 minutes
};

export const getCachedTransactions = async (userId: string): Promise<any[] | null> => {
  return await cacheManager.get(`transactions_${userId}`);
};

// Progressive data loading
export const loadProgressiveData = async (
  userId: string,
  dataType: 'farmers' | 'products' | 'transactions',
  fetcher: (limit?: number, offset?: number) => Promise<any[]>
): Promise<any[]> => {
  const cacheKey = `${dataType}_${userId}`;
  
  // Try to get cached data first
  const cached = await cacheManager.get(cacheKey);
  if (cached) {
    // Start background refresh
    fetcher().then(async (freshData) => {
      await cacheManager.set(cacheKey, freshData);
    }).catch(error => {
      console.warn('Background refresh failed:', error);
    });
    
    return cached;
  }

  // Load fresh data in chunks if no cache
  const chunkSize = 50;
  let allData: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    try {
      const chunk = await fetcher(chunkSize, offset);
      if (chunk.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(chunk);
        offset += chunkSize;
        
        // Cache intermediate results
        await cacheManager.set(cacheKey, allData, 5 * 60 * 1000); // 5 minutes for partial data
      }
    } catch (error) {
      console.error('Error loading chunk:', error);
      hasMore = false;
    }
  }

  // Cache final results with longer TTL
  await cacheManager.set(cacheKey, allData);
  return allData;
};
