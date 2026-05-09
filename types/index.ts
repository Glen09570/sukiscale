// Types for SukiScale

export interface Farmer {
  id: string;
  name: string;
  location?: string;
  contact?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  farmerId: string;
  farmerName: string;
  date: string;
  pricePerKilo: number;
  weights: number[];  // Array of weight values
  totalWeight: number;
  totalAmount: number;
  debtDeducted: number;
  finalAmount: number;
  receiptNumber?: string;
}

export interface WeightEntry {
  id: string;
  weight: number;
  timestamp: string;
}

export interface DebtRecord {
  id: string;
  farmerId: string;
  farmerName: string;
  amount: number;
  type: 'add' | 'deduct' | 'payment';
  transactionId?: string;
  notes?: string;
  date: string;
}

export interface FarmerBalance {
  farmerId: string;
  farmerName: string;
  balance: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
