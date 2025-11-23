# Phase 4: Code Refactoring - Detailed Implementation Guide

## Overview
Migrate all localStorage usage from being a data source to database-only with optional caching.

## Task 1: Settings Storage Refactoring

### Current Implementation
- File: `lib/settings-storage.ts`
- Storage Key: `vanity_general_settings`, `vanity_locations`, etc.
- Issue: Settings stored in localStorage, not persisted to database

### Required Changes
1. Create Prisma model for settings:
```prisma
model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON stringified
  category  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

2. Create API endpoint: `/api/settings`
   - GET /api/settings - Get all settings
   - POST /api/settings - Create/update setting
   - DELETE /api/settings/:key - Delete setting

3. Update `lib/settings-storage.ts`:
   - Replace localStorage.getItem with API call
   - Replace localStorage.setItem with API call
   - Add caching layer for performance

### Testing
- [ ] Settings persist after page reload
- [ ] Settings sync across devices
- [ ] Multi-user settings work
- [ ] No data loss

## Task 2: Transaction Provider Refactoring

### Current Implementation
- File: `lib/transaction-provider.tsx`
- Storage Key: `vanity_transactions`
- Issue: Transactions stored in localStorage, not synced

### Required Changes
1. Update to use Prisma Transaction model
2. Implement database sync on app load
3. Real-time sync for new transactions
4. Keep localStorage for offline capability

### Testing
- [ ] Transactions persist in database
- [ ] Multi-user sync works
- [ ] Accounting reports accurate
- [ ] Offline transactions sync on reconnect

## Task 3: Inventory Service Refactoring

### Current Implementation
- File: `lib/inventory-transaction-service.ts`
- Storage Key: `vanity_inventory_transactions`
- Issue: Inventory transactions stored in localStorage

### Required Changes
1. Use Prisma InventoryTransaction model
2. Create API endpoint: `/api/inventory/transactions`
3. Implement database persistence
4. Real-time inventory sync

### Testing
- [ ] Inventory transactions recorded
- [ ] Stock levels accurate
- [ ] Transfers work correctly
- [ ] Multi-location sync works

## Task 4: Membership Provider Refactoring

### Current Implementation
- File: `lib/membership-provider.tsx`
- Storage Keys: `memberships_key`, `tiers_key`, `transactions_key`
- Issue: Membership data stored in localStorage

### Required Changes
1. Use Prisma Membership model
2. Create API endpoint: `/api/memberships`
3. Implement database persistence
4. Real-time membership sync

### Testing
- [ ] Memberships persist
- [ ] Tiers work correctly
- [ ] Transactions recorded
- [ ] Multi-user sync works

## Task 5: Cart Provider Refactoring

### Current Implementation
- File: `lib/cart-provider.tsx`
- Storage Keys: `salon_cart`, `salon_wishlist`, `salon_promo`
- Issue: Cart stored in localStorage only

### Required Changes
1. Keep localStorage for performance
2. Add database persistence option
3. Sync cart to database on checkout
4. Restore cart from database on load

### Testing
- [ ] Cart persists across sessions
- [ ] Wishlist works
- [ ] Promo codes work
- [ ] Checkout completes successfully

## Task 6: Order Management Refactoring

### Current Implementation
- File: `lib/order-management-service.ts`
- Storage Key: `salon_orders`
- Issue: Orders stored in localStorage

### Required Changes
1. Use Prisma Order model
2. Create API endpoint: `/api/orders`
3. Implement database persistence
4. Real-time order sync

### Testing
- [ ] Orders persist
- [ ] Order status updates
- [ ] Notifications work
- [ ] Multi-user sync works

## Implementation Order

1. **Settings Storage** (Foundation - affects all features)
2. **Transaction Provider** (Critical - affects accounting)
3. **Inventory Service** (Critical - affects inventory)
4. **Membership Provider** (Important - affects loyalty)
5. **Order Management** (Important - affects sales)
6. **Cart Provider** (Nice to have - performance optimization)

## API Endpoints to Create

```
POST   /api/settings
GET    /api/settings
PUT    /api/settings/:key
DELETE /api/settings/:key

POST   /api/inventory/transactions
GET    /api/inventory/transactions
PUT    /api/inventory/transactions/:id

POST   /api/memberships
GET    /api/memberships
PUT    /api/memberships/:id

POST   /api/orders
GET    /api/orders
PUT    /api/orders/:id

POST   /api/cart/sync
GET    /api/cart/restore
```

## Database Sync Strategy

1. **On App Load**:
   - Fetch all data from database
   - Populate localStorage cache
   - Show cached data immediately

2. **On Data Change**:
   - Update database first
   - Update localStorage cache
   - Broadcast change to other tabs

3. **On Offline**:
   - Use localStorage cache
   - Queue changes for sync
   - Sync when reconnected

## Performance Optimization

- Use React Query for caching
- Implement pagination for large datasets
- Add database indexes
- Use connection pooling
- Monitor query performance

## Success Criteria

✅ All data persists in database
✅ Multi-user sync works
✅ No data loss
✅ Performance acceptable
✅ Offline capability maintained
✅ All tests passing

