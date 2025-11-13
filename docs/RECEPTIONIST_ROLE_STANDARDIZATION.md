# Receptionist Role Standardization

## Overview
This document describes the standardization of the "Receptionist" role naming convention throughout the VanityPOS codebase to ensure consistency and avoid case-sensitivity issues.

## Standard Format
**The receptionist role is now standardized to: `RECEPTIONIST` (all uppercase)**

This matches the existing pattern for other roles in the system:
- `ADMIN` - Super Admin
- `MANAGER` - Organization/Location Manager  
- `STAFF` - Salon workers (stylists, colorists, etc.)
- `RECEPTIONIST` - Receptionist
- `CLIENT` - Client/Customer

## Changes Made

### 1. Database Seed Data
**File:** `prisma/seed.ts`
- Updated Samrawit Legese's role from "Sales" to "Receptionist"
- Modified user creation logic to map "Receptionist" staff role to "RECEPTIONIST" user role

### 2. API Route Mappings
Updated role mapping functions in the following files to map lowercase "receptionist" to uppercase "RECEPTIONIST":
- `app/api/staff/route.ts`
- `app/api/staff/[id]/route.ts`
- `app/api/seed-staff/route.ts`
- `app/api/migrate-data/route.ts`
- `app/api/db/init/route.ts`

### 3. Authentication & Permissions
**Files:**
- `lib/auth-utils.ts` - Updated `mapStaffRoleToUserRole()` function
- `lib/auth-provider.tsx` - Already has case-insensitive checks (`.toUpperCase()`)
- `lib/permissions.ts` - Already uses `RECEPTIONIST` in `ROLE_PERMISSIONS`
- `lib/unified-staff-service.ts` - Updated role mappings to use uppercase

### 4. UI Components
**Files:**
- `components/settings/user-settings-fixed.tsx` - Updated role ID from "receptionist" to "RECEPTIONIST"
- `components/protected-nav.tsx` - Already has case-insensitive check
- `app/dashboard/pos/page.tsx` - Already has case-insensitive check

### 5. Legacy Files
**File:** `fix-user-settings-comprehensive-clean.js`
- Updated for consistency (though this appears to be a legacy/backup file)

## Migration Script

A migration script has been created to update existing database records:

**Script:** `scripts/standardize-receptionist-role.ts`

**Run with:**
```bash
npm run fix:receptionist-role
```

This script will:
1. Find all users with receptionist role (any case variation)
2. Update them to use uppercase "RECEPTIONIST"
3. Report the number of records updated

## Safety Measures

### Case-Insensitive Comparisons
Even though the stored role is now standardized, the codebase maintains case-insensitive comparisons as a safety measure:

```typescript
// Example from lib/auth-provider.tsx
if (user.role.toUpperCase() === 'RECEPTIONIST' && permission === PERMISSIONS.VIEW_POS) {
  return true
}
```

This ensures the system works correctly even if:
- Legacy data exists with different casing
- Manual database updates use different casing
- Future integrations provide roles in different formats

## Receptionist Permissions

The receptionist role has the following default permissions (defined in `lib/permissions.ts`):

- **Dashboard:** View dashboard
- **Appointments:** View, create, edit appointments
- **Clients:** View, create, edit clients
- **Services:** View services
- **Staff:** View staff and schedules
- **Inventory:** View, create inventory
- **POS:** View POS, create sales ✅
- **Chat:** View, send messages, product requests, help requests
- **Gift Cards:** View, create, redeem gift cards
- **Memberships:** View, create memberships

## Calendar View Filtering

Receptionists are excluded from appearing as bookable staff in calendar views:

**Files updated:**
- `components/scheduling/appointment-calendar.tsx`
- `components/scheduling/salon-calendar-view.tsx`
- `components/scheduling/enhanced-salon-calendar.tsx`
- `app/client-portal/appointments/book/page.tsx`

**Filter logic:**
```typescript
availableStaff = availableStaff.filter((staff: StaffMember) => {
  const role = (staff.role || "").toUpperCase();
  return role !== "ADMIN" && 
         role !== "MANAGER" && 
         role !== "SUPER_ADMIN" && 
         role !== "RECEPTIONIST";
});
```

## Testing Checklist

After running the migration script, verify:

- [ ] Receptionist users can log in successfully
- [ ] Receptionist users can access the POS page
- [ ] Receptionist users can create appointments
- [ ] Receptionist users can create/edit clients
- [ ] Receptionist users do NOT appear in calendar booking views
- [ ] Receptionist users have correct permissions in Settings
- [ ] Navigation menu shows correct items for receptionist role

## Future Considerations

1. **Database Enum:** Consider creating a proper enum in the database schema for user roles to enforce valid values at the database level
2. **TypeScript Types:** Create a TypeScript enum or union type for user roles to get compile-time type checking
3. **Validation:** Add validation in API routes to reject invalid role values

## Related Files

- `lib/permissions.ts` - Permission definitions
- `lib/auth-provider.tsx` - Authentication and permission checking
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Database seed data

