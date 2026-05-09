// Database imports - platform specific (native vs web)
// @ts-ignore - platform specific module resolution
import * as Database from './database';

// No default data - system starts empty
// Users must manually create products and farmers

// Empty seed function - database starts clean
export async function seedDatabaseIfEmpty(): Promise<void> {
  // System starts empty - no default data
  console.log('Starting with empty database - create your own products and farmers');
}

// Reset database to empty state
export async function resetDatabase(): Promise<void> {
  try {
    console.log('Resetting database to empty state...');
    await Database.resetDatabase();
    console.log('Database reset successfully - ready for new data');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}
