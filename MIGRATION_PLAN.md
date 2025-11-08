# LocalStorage to Database Migration Plan

## Executive Summary
This document outlines the migration strategy from localStorage-based data persistence to database-based persistence while maintaining backward compatibility and zero downtime.

## Current State Analysis

### Data Currently Stored in localStorage

| Data Type | Storage Key | File Location | Database Table | Status |
|-----------|-------------|---------------|----------------|--------|
| **Appointments** | `vanity_appointments` | `lib/appointment-service.ts` | ✅ `Appointment` | Table exists |
| **Transactions** | `vanity_transactions` | `lib/transaction-provider.tsx` | ✅ `Transaction` | Table exists |
| **Cart Items** | `vanity_cart_items` | `lib/cart-provider.tsx` | ❌ None | Session data - keep in localStorage |
| **Wishlist** | `vanity_wishlist_items` | `lib/cart-provider.tsx` | ❌ None | Session data - keep in localStorage |
| **Orders** | `salon_orders` | `lib/order-management-service.ts` | ❌ None | **Needs table** |
| **Order Notifications** | `salon_order_notifications` | `lib/order-management-service.ts` | ❌ None | **Needs table** |
| **Staff Schedules** | `vanity_staff_schedules` | `lib/schedule-storage.ts` | ✅ `StaffSchedule` | Table exists |
| **Time Off Requests** | `vanity_staff_time_off` | `lib/schedule-storage.ts` | ❌ None | **Needs table** |

### Data That Should Remain in localStorage
- **Cart & Wishlist**: Session-specific data, not user-persistent
- **Promo Codes**: Temporary session data
- **UI Preferences**: Client-side only settings
- **Branding Settings**: Admin-configured, can stay in localStorage for now

## Migration Strategy

### Phase 1: Database Schema Updates ✅ PRIORITY

#### 1.1 Add Missing Tables

**Order Table**
```prisma
model Order {
  id                  String    @id @default(cuid())
  orderNumber         String    @unique
  clientId            String
  clientName          String
  items               String    // JSON array of order items
  subtotal            Decimal
  tax                 Decimal
  shipping            Decimal
  total               Decimal
  paymentMethod       String
  shippingAddress     String    // JSON object
  status              String    // pending, processing, shipped, delivered, cancelled
  appliedPromo        String?   // JSON object
  tracking            String?   // JSON object
  notes               String?
  transactionId       String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  processedAt         DateTime?
  shippedAt           DateTime?
  deliveredAt         DateTime?
  cancelledAt         DateTime?
  cancellationReason  String?
  
  @@index([clientId])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}
```

**TimeOffRequest Table**
```prisma
model TimeOffRequest {
  id          String   @id @default(cuid())
  staffId     String
  startDate   DateTime
  endDate     DateTime
  reason      String
  status      String   @default("pending") // pending, approved, rejected
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  updatedBy   String?
  
  staff StaffMember @relation(fields: [staffId], references: [id], onDelete: Cascade)
  
  @@index([staffId])
  @@index([status])
  @@index([startDate, endDate])
  @@map("time_off_requests")
}
```

### Phase 2: API Routes Creation

#### 2.1 Appointments API
- ✅ **Already exists**: `app/api/appointments/route.ts`
- **Action**: Verify it handles all CRUD operations
- **Endpoints needed**:
  - `GET /api/appointments` - List all appointments
  - `POST /api/appointments` - Create appointment
  - `PUT /api/appointments/[id]` - Update appointment
  - `DELETE /api/appointments/[id]` - Delete appointment
  - `GET /api/appointments/[id]` - Get single appointment

#### 2.2 Transactions API
- **Status**: Needs to be created
- **File**: `app/api/transactions/route.ts`
- **Endpoints needed**:
  - `GET /api/transactions` - List all transactions
  - `POST /api/transactions` - Create transaction
  - `PUT /api/transactions/[id]` - Update transaction
  - `GET /api/transactions/[id]` - Get single transaction

#### 2.3 Orders API
- **Status**: Needs to be created
- **File**: `app/api/orders/route.ts`
- **Endpoints needed**:
  - `GET /api/orders` - List all orders
  - `POST /api/orders` - Create order
  - `PUT /api/orders/[id]` - Update order status
  - `GET /api/orders/[id]` - Get single order

#### 2.4 Time Off Requests API
- **Status**: Needs to be created
- **File**: `app/api/time-off/route.ts`
- **Endpoints needed**:
  - `GET /api/time-off` - List all requests
  - `POST /api/time-off` - Create request
  - `PUT /api/time-off/[id]` - Update request
  - `DELETE /api/time-off/[id]` - Delete request

### Phase 3: Client-Side Migration

#### 3.1 Appointment Service Migration
**File**: `lib/appointment-service.ts`

**Current**: 
- Reads from `localStorage.getItem('vanity_appointments')`
- Writes to `localStorage.setItem('vanity_appointments')`

**New Approach**:
1. Create API client functions
2. Replace localStorage calls with API calls
3. Keep localStorage as cache layer (optional)
4. Implement optimistic updates for better UX

#### 3.2 Transaction Provider Migration
**File**: `lib/transaction-provider.tsx`

**Current**:
- Loads from `localStorage.getItem('vanity_transactions')`
- Saves to `localStorage.setItem('vanity_transactions')`

**New Approach**:
1. Fetch from `/api/transactions` on mount
2. POST to `/api/transactions` when creating
3. Implement real-time sync
4. Keep localStorage as fallback cache

#### 3.3 Order Management Migration
**File**: `lib/order-management-service.ts`

**Current**:
- Uses `localStorage.getItem('salon_orders')`
- Uses `localStorage.getItem('salon_order_notifications')`

**New Approach**:
1. Fetch from `/api/orders` on mount
2. POST to `/api/orders` when creating
3. Update order status via API
4. Remove localStorage dependency

#### 3.4 Schedule Provider Migration
**File**: `lib/schedule-provider.tsx`

**Current**:
- Uses `ScheduleStorage.getSchedules()` (localStorage)
- Uses `ScheduleStorage.getTimeOffRequests()` (localStorage)

**New Approach**:
1. Fetch schedules from database (already exists in StaffSchedule table)
2. Fetch time-off requests from `/api/time-off`
3. Update via API calls
4. Remove localStorage dependency

## Implementation Order

### Step 1: Schema Migration (FIRST)
1. ✅ Add `Order` model to Prisma schema
2. ✅ Add `TimeOffRequest` model to Prisma schema
3. ✅ Run `npx prisma db push` to update database
4. ✅ Run `npx prisma generate` to update Prisma client

### Step 2: API Routes (SECOND)
1. Create `/api/transactions/route.ts`
2. Create `/api/orders/route.ts`
3. Create `/api/time-off/route.ts`
4. Update `/api/appointments/route.ts` if needed

### Step 3: Client Migration (THIRD)
1. Update `lib/appointment-service.ts`
2. Update `lib/transaction-provider.tsx`
3. Update `lib/order-management-service.ts`
4. Update `lib/schedule-provider.tsx`

### Step 4: Testing (FOURTH)
1. Test appointment creation/update/delete
2. Test transaction creation
3. Test order management
4. Test time-off requests
5. Verify data persistence across devices
6. Verify no UI changes

## Backward Compatibility Strategy

### Hybrid Approach (Recommended)
1. **Read**: Try API first, fallback to localStorage
2. **Write**: Write to both API and localStorage
3. **Gradual Migration**: Over time, remove localStorage writes
4. **Cache Layer**: Keep localStorage as performance cache

### Migration Helper
```typescript
// Example migration helper
async function getDataWithFallback<T>(
  apiCall: () => Promise<T>,
  localStorageKey: string,
  defaultValue: T
): Promise<T> {
  try {
    // Try API first
    const data = await apiCall();
    // Cache in localStorage for offline access
    localStorage.setItem(localStorageKey, JSON.stringify(data));
    return data;
  } catch (error) {
    console.warn('API call failed, using localStorage fallback', error);
    // Fallback to localStorage
    const cached = localStorage.getItem(localStorageKey);
    return cached ? JSON.parse(cached) : defaultValue;
  }
}
```

## Risk Mitigation

### Data Loss Prevention
- ✅ Keep localStorage as backup during migration
- ✅ Implement data validation before saving
- ✅ Add error handling and retry logic
- ✅ Log all migration activities

### Performance Considerations
- ✅ Implement pagination for large datasets
- ✅ Use caching strategies
- ✅ Optimize database queries with indexes
- ✅ Implement optimistic UI updates

### Testing Checklist
- [ ] All appointments sync across devices
- [ ] Transactions persist correctly
- [ ] Orders are created and updated properly
- [ ] Time-off requests work correctly
- [ ] No data loss during migration
- [ ] UI remains unchanged
- [ ] Performance is acceptable
- [ ] Error handling works correctly

## Success Criteria
1. ✅ All business data persists in database
2. ✅ Users can access data from any device
3. ✅ No breaking changes to existing functionality
4. ✅ No UI changes
5. ✅ Performance is maintained or improved
6. ✅ Data integrity is preserved

## Next Steps
1. Review and approve this migration plan
2. Begin with Phase 1: Database Schema Updates
3. Proceed sequentially through each phase
4. Test thoroughly at each step
5. Deploy incrementally to minimize risk

