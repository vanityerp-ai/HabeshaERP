/**
 * Tests for POS Payment Recording Service
 * Verifies that POS sales are recorded with proper accounting entries
 * matching Online Store sales structure
 */

import { posPaymentRecordingService, POSPaymentRecord } from '../pos-payment-recording-service';
import { PaymentMethod, TransactionType, TransactionSource, TransactionStatus } from '../transaction-types';

describe('POS Payment Recording Service', () => {
  
  test('should record POS product sale with cost tracking', () => {
    const paymentRecord: POSPaymentRecord = {
      saleId: 'SALE-001',
      locationId: 'loc-muaither',
      locationName: 'Muaither',
      staffId: 'staff-001',
      staffName: 'John Doe',
      clientId: 'client-001',
      clientName: 'Jane Smith',
      items: [
        {
          id: 'prod-001',
          name: 'Hair Serum',
          type: 'product',
          quantity: 2,
          unitPrice: 50,
          totalPrice: 100,
          cost: 20
        }
      ],
      subtotal: 100,
      tax: 10,
      discount: 0,
      total: 110,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: 'paid',
      timestamp: new Date()
    };

    const transaction = posPaymentRecordingService.recordPOSPayment(paymentRecord);

    // Verify transaction structure
    expect(transaction.type).toBe(TransactionType.PRODUCT_SALE);
    expect(transaction.source).toBe(TransactionSource.POS);
    expect(transaction.status).toBe(TransactionStatus.COMPLETED);
    expect(transaction.amount).toBe(110);
    expect(transaction.paymentMethod).toBe(PaymentMethod.CASH);
    expect(transaction.location).toBe('loc-muaither');
    
    // Verify cost tracking
    expect(transaction.metadata?.totalCost).toBe(40); // 2 units * 20 cost
    expect(transaction.metadata?.profit).toBe(60); // 100 revenue - 40 cost
    expect(transaction.metadata?.source).toBe('pos');
    
    // Verify items include cost
    expect(transaction.items[0].cost).toBe(20);
  });

  test('should record consolidated sale with products and services', () => {
    const paymentRecord: POSPaymentRecord = {
      saleId: 'SALE-002',
      locationId: 'loc-downtown',
      locationName: 'Downtown',
      staffId: 'staff-002',
      staffName: 'Sarah Johnson',
      items: [
        {
          id: 'prod-002',
          name: 'Shampoo',
          type: 'product',
          quantity: 1,
          unitPrice: 30,
          totalPrice: 30,
          cost: 10
        },
        {
          id: 'svc-001',
          name: 'Hair Styling',
          type: 'service',
          quantity: 1,
          unitPrice: 50,
          totalPrice: 50
        }
      ],
      subtotal: 80,
      tax: 8,
      discount: 0,
      total: 88,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentStatus: 'paid',
      timestamp: new Date()
    };

    const transaction = posPaymentRecordingService.recordPOSPayment(paymentRecord);

    // Verify consolidated sale type
    expect(transaction.type).toBe(TransactionType.CONSOLIDATED_SALE);
    expect(transaction.amount).toBe(88);
    
    // Verify cost tracking (only for products)
    expect(transaction.metadata?.totalCost).toBe(10);
    expect(transaction.metadata?.profit).toBe(20); // 30 product revenue - 10 cost
  });

  test('should handle partial payment status', () => {
    const paymentRecord: POSPaymentRecord = {
      saleId: 'SALE-003',
      locationId: 'loc-northside',
      locationName: 'Northside',
      staffId: 'staff-003',
      staffName: 'Mike Wilson',
      items: [
        {
          id: 'prod-003',
          name: 'Conditioner',
          type: 'product',
          quantity: 1,
          unitPrice: 25,
          totalPrice: 25,
          cost: 8
        }
      ],
      subtotal: 25,
      tax: 2.5,
      discount: 0,
      total: 27.5,
      paymentMethod: PaymentMethod.MOBILE_PAYMENT,
      paymentStatus: 'partial',
      timestamp: new Date()
    };

    const transaction = posPaymentRecordingService.recordPOSPayment(paymentRecord);

    expect(transaction.status).toBe(TransactionStatus.PARTIAL);
    expect(transaction.metadata?.paymentStatus).toBe('partial');
  });

  test('should calculate profit correctly with multiple items', () => {
    const paymentRecord: POSPaymentRecord = {
      saleId: 'SALE-004',
      locationId: 'loc-muaither',
      locationName: 'Muaither',
      staffId: 'staff-001',
      staffName: 'John Doe',
      items: [
        {
          id: 'prod-001',
          name: 'Product A',
          type: 'product',
          quantity: 3,
          unitPrice: 100,
          totalPrice: 300,
          cost: 40
        },
        {
          id: 'prod-002',
          name: 'Product B',
          type: 'product',
          quantity: 2,
          unitPrice: 50,
          totalPrice: 100,
          cost: 20
        }
      ],
      subtotal: 400,
      tax: 40,
      discount: 0,
      total: 440,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: 'paid',
      timestamp: new Date()
    };

    const transaction = posPaymentRecordingService.recordPOSPayment(paymentRecord);

    // Total cost: (3 * 40) + (2 * 20) = 120 + 40 = 160
    // Total revenue: 300 + 100 = 400
    // Profit: 400 - 160 = 240
    expect(transaction.metadata?.totalCost).toBe(160);
    expect(transaction.metadata?.profit).toBe(240);
  });
});

