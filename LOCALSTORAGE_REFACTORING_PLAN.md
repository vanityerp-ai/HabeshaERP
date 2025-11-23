# localStorage to Database Refactoring Plan

## Overview
Migrate all localStorage usage from being a data source to database-only with optional caching.

## Critical localStorage Usage (Data Source)

### 1. Settings Storage (`lib/settings-storage.ts`)
**Current**: Stores all settings in localStorage
**Keys**: 
- `vanity_general_settings`
- `vanity_locations`
- `vanity_users`
- `vanity_roles`
- `vanity_checkout_settings`
- `vanity_gift_card_membership_settings`

**Action**: Create Prisma models for settings, migrate to database

### 2. Staff Storage (`lib/staff-storage.ts`)
**Current**: Reads/writes staff from localStorage
**Key**: `vanity_staff`
**Action**: Already has Prisma integration, remove localStorage fallback

### 3. Transaction Provider (`lib/transaction-provider.tsx`)
**Current**: Stores transactions in localStorage
**Key**: `vanity_transactions`
**Action**: Use Prisma Transaction model, sync from database

### 4. Inventory Transactions (`lib/inventory-transaction-service.ts`)
**Current**: Stores inventory transactions in localStorage
**Key**: `vanity_inventory_transactions`
**Action**: Use Prisma InventoryTransaction model

### 5. Membership Provider (`lib/membership-provider.tsx`)
**Current**: Stores memberships in localStorage
**Keys**: `memberships_key`, `tiers_key`, `transactions_key`
**Action**: Use Prisma Membership model

### 6. Cart Provider (`lib/cart-provider.tsx`)
**Current**: Stores cart in localStorage
**Keys**: `salon_cart`, `salon_wishlist`, `salon_promo`
**Action**: Keep localStorage for performance, sync to database

### 7. Order Management (`lib/order-management-service.ts`)
**Current**: Stores orders in localStorage
**Key**: `salon_orders`
**Action**: Use Prisma Order model

## Refactoring Priority

### Priority 1 (Critical - Data Integrity)
1. Settings Storage - affects all features
2. Transaction Provider - affects accounting
3. Inventory Transactions - affects inventory

### Priority 2 (High - Business Logic)
1. Staff Storage - affects scheduling
2. Membership Provider - affects loyalty
3. Order Management - affects sales

### Priority 3 (Medium - Performance)
1. Cart Provider - can use hybrid approach
2. Special Offers - can use hybrid approach

## Implementation Approach

### For Each Service:
1. Create/update Prisma model
2. Create API endpoint for CRUD operations
3. Update service to use API instead of localStorage
4. Add database sync on app load
5. Keep localStorage for offline capability
6. Test multi-user scenarios

## Database Schema Additions Needed

```prisma
model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON stringified
  category  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Order {
  id        String   @id @default(cuid())
  // order fields
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Extend existing models as needed
```

## Testing Strategy

1. **Data Integrity**: Verify all data persists
2. **Sync**: Test multi-device sync
3. **Offline**: Test offline capability
4. **Performance**: Monitor query performance
5. **Rollback**: Test rollback procedure

## Success Criteria

✅ All data persists in database
✅ Multi-user sync works
✅ No data loss
✅ Performance acceptable
✅ Offline capability maintained

