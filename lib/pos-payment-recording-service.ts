/**
 * POS Payment Recording Service
 * 
 * Ensures that physical location POS sales are recorded in the accounting system
 * with the same structure, format, and accounting entries as Online Store sales.
 * 
 * This service provides unified payment recording for POS transactions with:
 * - Cost price tracking
 * - Profit calculations
 * - Consistent metadata structure
 * - Payment method categorization
 * - Location-based recording
 */

import { Transaction, TransactionType, TransactionSource, TransactionStatus, PaymentMethod } from './transaction-types';

export interface POSPaymentRecord {
  saleId: string;
  locationId: string;
  locationName: string;
  staffId: string;
  staffName: string;
  clientId?: string;
  clientName?: string;
  items: POSPaymentItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'pending';
  timestamp: Date;
}

export interface POSPaymentItem {
  id: string;
  name: string;
  type: 'product' | 'service';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  cost?: number; // Cost price for products
}

class POSPaymentRecordingService {
  /**
   * Record a POS payment with full accounting parity to Online Store sales
   */
  recordPOSPayment(paymentRecord: POSPaymentRecord): Transaction {
    const productItems = paymentRecord.items.filter(item => item.type === 'product');
    const serviceItems = paymentRecord.items.filter(item => item.type === 'service');

    // Calculate product cost and profit (matching Online Store structure)
    const totalProductCost = productItems.reduce((sum, item) => {
      return sum + ((item.cost || 0) * item.quantity);
    }, 0);
    const productRevenue = productItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const productProfit = productRevenue - totalProductCost;

    // Generate transaction ID
    const generateShortId = () => {
      const timestamp = Date.now();
      const last6Digits = timestamp % 1000000;
      const random2Digits = Math.floor(Math.random() * 100);
      return `${last6Digits}${random2Digits.toString().padStart(2, '0')}`;
    };

    // Create unified transaction matching Online Store structure
    const transaction: Transaction = {
      id: generateShortId(),
      date: paymentRecord.timestamp,
      type: serviceItems.length > 0 && productItems.length > 0 
        ? TransactionType.CONSOLIDATED_SALE 
        : productItems.length > 0 
          ? TransactionType.PRODUCT_SALE 
          : TransactionType.SERVICE_SALE,
      source: TransactionSource.POS,
      status: paymentRecord.paymentStatus === 'paid' 
        ? TransactionStatus.COMPLETED 
        : paymentRecord.paymentStatus === 'partial'
          ? TransactionStatus.PARTIAL
          : TransactionStatus.PENDING,
      amount: paymentRecord.total,
      paymentMethod: paymentRecord.paymentMethod,
      clientId: paymentRecord.clientId,
      clientName: paymentRecord.clientName,
      staffId: paymentRecord.staffId,
      staffName: paymentRecord.staffName,
      location: paymentRecord.locationId,
      category: "Physical Location Sale", // Consistent with Online Store categorization
      description: `POS Sale at ${paymentRecord.locationName} - ${paymentRecord.items.length} item(s)`,
      items: paymentRecord.items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        cost: item.cost, // Include cost for accounting
        type: item.type
      })),
      reference: {
        type: 'pos_sale',
        id: paymentRecord.saleId
      },
      metadata: {
        // Matching Online Store metadata structure
        locationId: paymentRecord.locationId,
        locationName: paymentRecord.locationName,
        subtotal: paymentRecord.subtotal,
        tax: paymentRecord.tax,
        discount: paymentRecord.discount,
        totalCost: totalProductCost,
        profit: productProfit,
        source: 'pos',
        paymentStatus: paymentRecord.paymentStatus
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💳 POS Payment Recorded:', {
      saleId: paymentRecord.saleId,
      location: paymentRecord.locationName,
      total: paymentRecord.total,
      totalCost: totalProductCost,
      profit: productProfit,
      paymentMethod: paymentRecord.paymentMethod
    });

    return transaction;
  }
}

export const posPaymentRecordingService = new POSPaymentRecordingService();

