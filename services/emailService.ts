// EmailJS configuration
// NOTE: User needs to set up these values from their EmailJS account
const EMAILJS_SERVICE_ID = 'service_yrt9nhp'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'template_qhzsafi'; // Template for debt/payment notifications
const EMAILJS_RECEIPT_TEMPLATE_ID = 'template_vvtuqfr'; // Template for transaction receipts
const EMAILJS_PUBLIC_KEY = 'z6kgFZ_r10QfZDZRX'; // Replace with your EmailJS public key

export interface DebtNotificationData {
  to_email: string;
  farmer_name: string;
  debt_amount: number;
  new_balance: number;
  note?: string;
  date: string;
}

export interface PaymentNotificationData {
  to_email: string;
  farmer_name: string;
  payment_amount: number;
  new_balance: number;
  note?: string;
  date: string;
}

export interface TransactionReceiptData {
  to_email: string;
  farmer_name: string;
  product_name: string;
  weight: number;
  price_per_kg: number;
  total_amount: number;
  debt_deducted: number;
  final_payment: number;
  transaction_date: string;
  receipt_number?: string;
}

/**
 * Send debt notification email to farmer
 * Uses EmailJS for client-side email sending (no backend required)
 */
export async function sendDebtNotification(data: DebtNotificationData): Promise<boolean> {
  try {
    console.log('=== EMAIL DEBUG ===');
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Template ID:', EMAILJS_TEMPLATE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('Sending to:', data.to_email);
    console.log('Farmer:', data.farmer_name);
    console.log('===================');

    // Check if EmailJS is configured
    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID.includes('YOUR_SERVICE_ID')) {
      console.warn('EmailJS not configured. Please set up your EmailJS credentials.');
      return false;
    }

    // Validate email
    if (!data.to_email || !isValidEmail(data.to_email)) {
      console.warn('Invalid or missing email address:', data.to_email);
      return false;
    }

    const templateParams = {
      to_email: data.to_email,
      to_name: data.farmer_name,
      debt_amount: `₱${data.debt_amount.toLocaleString()}`,
      new_balance: `₱${data.new_balance.toLocaleString()}`,
      note: data.note || 'No additional notes',
      date: data.date,
    };

    // Use EmailJS REST API directly (works better in React Native)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EmailJS API error:', response.status, errorText);
      return false;
    }

    console.log('Debt notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Send debt payment notification email to farmer
 * Uses EmailJS for client-side email sending (no backend required)
 */
export async function sendPaymentNotification(data: PaymentNotificationData): Promise<boolean> {
  try {
    console.log('=== PAYMENT EMAIL DEBUG ===');
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Template ID:', EMAILJS_TEMPLATE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('Sending to:', data.to_email);
    console.log('Farmer:', data.farmer_name);
    console.log('===========================');

    // Check if EmailJS is configured
    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID.includes('YOUR_SERVICE_ID')) {
      console.warn('EmailJS not configured. Please set up your EmailJS credentials.');
      return false;
    }

    // Validate email
    if (!data.to_email || !isValidEmail(data.to_email)) {
      console.warn('Invalid or missing email address:', data.to_email);
      return false;
    }

    const templateParams = {
      to_email: data.to_email,
      to_name: data.farmer_name,
      payment_amount: `₱${data.payment_amount.toLocaleString()}`,
      new_balance: `₱${data.new_balance.toLocaleString()}`,
      note: data.note || 'No additional notes',
      date: data.date,
    };

    // Use EmailJS REST API directly (works better in React Native)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EmailJS API error:', response.status, errorText);
      return false;
    }

    console.log('Payment notification email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send payment notification email:', error);
    return false;
  }
}

/**
 * Send transaction receipt email to farmer
 * Uses EmailJS for client-side email sending (no backend required)
 */
export async function sendTransactionReceipt(data: TransactionReceiptData): Promise<boolean> {
  try {
    console.log('=== TRANSACTION RECEIPT EMAIL DEBUG ===');
    console.log('Service ID:', EMAILJS_SERVICE_ID);
    console.log('Template ID:', EMAILJS_RECEIPT_TEMPLATE_ID);
    console.log('Public Key:', EMAILJS_PUBLIC_KEY);
    console.log('Sending to:', data.to_email);
    console.log('Farmer:', data.farmer_name);
    console.log('Product:', data.product_name);
    console.log('Total:', data.total_amount);
    console.log('=======================================');

    // Check if EmailJS is configured
    if (!EMAILJS_SERVICE_ID || EMAILJS_SERVICE_ID.includes('YOUR_SERVICE_ID') || !EMAILJS_RECEIPT_TEMPLATE_ID) {
      console.warn('EmailJS receipt template not configured. Please set up your EmailJS credentials.');
      return false;
    }

    // Validate email
    if (!data.to_email || !isValidEmail(data.to_email)) {
      console.warn('Invalid or missing email address:', data.to_email);
      return false;
    }

    const templateParams = {
      to_email: data.to_email,
      to_name: data.farmer_name,
      product_name: data.product_name || 'N/A',
      weight: `${data.weight.toFixed(2)} kg`,
      price_per_kg: `₱${data.price_per_kg.toFixed(2)}`,
      total_amount: `₱${data.total_amount.toLocaleString()}`,
      debt_deducted: data.debt_deducted > 0 ? `₱${data.debt_deducted.toLocaleString()}` : 'None',
      final_payment: `₱${data.final_payment.toLocaleString()}`,
      transaction_date: data.transaction_date,
      receipt_number: data.receipt_number || 'N/A',
    };

    // Use EmailJS REST API directly (works better in React Native)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_RECEIPT_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: templateParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EmailJS API error:', response.status, errorText);
      return false;
    }

    console.log('Transaction receipt email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send transaction receipt email:', error);
    return false;
  }
}

/**
 * Check if email notifications are enabled in app settings
 */
export async function isEmailNotificationsEnabled(): Promise<boolean> {
  // This can be connected to app settings later
  // For now, return true to enable notifications
  return true;
}
