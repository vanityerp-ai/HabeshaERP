# Phone Number-Based Client Lookup Implementation

## Overview

Implemented a phone number-first workflow for appointment booking where the phone number serves as the primary identifier for client lookup and auto-registration.

## Changes Made

### 1. **lib/client-provider.tsx**

#### Added `findClientByPhone` Function
- **Purpose**: Look up clients by phone number only (without requiring name)
- **Location**: Lines 297-307
- **Functionality**:
  - Normalizes the input phone number
  - Searches the clients array for a matching phone number
  - Returns the first matching client or `undefined`

```typescript
const findClientByPhone = (phone: string): Client | undefined => {
  if (!phone) return undefined
  
  const normalizedPhone = normalizePhoneNumber(phone)

  return clients.find(client => {
    const clientNormalizedPhone = normalizePhoneNumber(client.phone)
    return clientNormalizedPhone === normalizedPhone
  })
}
```

#### Updated Context Interface
- Added `findClientByPhone` to `ClientContextType` interface
- Exported the function through the context provider

#### Fixed Fallback Client Bug
- **Issue**: When client creation failed, a fallback client was created with a UUID that didn't exist in the database
- **Fix**: Removed fallback client creation logic - now throws error instead
- **Impact**: Prevents "Client not found" errors during appointment creation

### 2. **components/scheduling/new-appointment-dialog-v2.tsx**

#### Added Client Lookup State
- `clientLookupStatus`: Tracks lookup status ('idle' | 'found' | 'new')
- `foundClient`: Stores the client found by phone lookup

#### Added `handlePhoneLookup` Function
- **Purpose**: Automatically search for existing clients when phone number is entered
- **Location**: Lines 200-238
- **Functionality**:
  1. Validates phone number (minimum 8 digits)
  2. Searches for existing client using `findClientByPhone`
  3. If found:
     - Auto-populates name and email fields
     - Shows success toast: "Client found - [Name] - Information auto-populated"
     - Sets lookup status to 'found'
  4. If not found:
     - Shows info toast: "New client - Please enter the client's name to continue"
     - Sets lookup status to 'new'

#### Enhanced Phone Input Field
- **Visual Feedback**:
  - Green checkmark (✓) and green border when client is found
  - Blue info icon (ℹ) and blue border for new clients
  - Status indicator in the label
- **Behavior**:
  - `onBlur`: Triggers phone lookup when user leaves the field
  - `onChange`: Resets lookup status when phone number changes
  - Auto-populates name and email when client is found

#### Updated Form Submission Logic
- **Smart Client Handling**:
  1. If client was found by phone lookup → Use existing client
  2. If phone provided but no client found → Auto-register new client
  3. If no phone provided → Show error (phone is required)
- **Error Handling**:
  - Prevents appointment creation if client registration fails
  - No fallback clients created
  - All client IDs are validated against database

#### Reset Logic
- Client lookup state is reset when:
  - Dialog opens
  - Form is submitted
  - Phone number is changed

## Form Layout

The appointment dialog form has been optimized for the phone-first workflow:

**Row 1:** [Phone] [Email]
**Row 2:** [Client Name] [Service Category]

This layout places the phone number field at the top, making it the first field users interact with when creating an appointment, which supports the phone-first lookup workflow.

## User Experience

### Existing Client Flow
1. User enters phone number in appointment dialog (first field at the top)
2. User tabs out of phone field (onBlur)
3. System searches for existing client
4. If found:
   - Name and email fields auto-populate
   - Green checkmark appears next to "Phone" label
   - Toast notification: "Client found - [Name] - Information auto-populated"
5. User can edit name/email if needed
6. User completes appointment details and submits

### New Client Flow
1. User enters phone number in appointment dialog
2. User tabs out of phone field (onBlur)
3. System searches for existing client
4. If not found:
   - Blue info icon appears next to "Phone" label
   - Toast notification: "New client - Please enter the client's name to continue"
5. User enters client name (required)
6. User optionally enters email
7. User completes appointment details and submits
8. System auto-registers the new client in database
9. Appointment is created with the new client's database ID

### No Phone Flow
1. User leaves phone field empty
2. User tries to submit appointment
3. System shows error: "Phone number required - Please provide a phone number to create an appointment."
4. Appointment creation is blocked

## Technical Details

### Phone Number Normalization
- Removes all non-digit characters
- Handles Qatar phone numbers:
  - Adds country code (974) if missing
  - Removes "00" prefix if present
  - Normalizes 8-digit local numbers to include country code

### Client Lookup Logic
- **Primary**: Phone number only (no name required)
- **Fallback**: Phone + name for duplicate detection during registration
- **Source of Truth**: Database via API

### Error Prevention
- No fallback clients created in memory
- All client IDs must exist in database before appointment creation
- Proper error handling with user-friendly messages
- Database validation enforced at API level

## Files Modified

1. **lib/client-provider.tsx**
   - Added `findClientByPhone` function
   - Updated `ClientContextType` interface
   - Fixed fallback client bug
   - Exported new function through context

2. **components/scheduling/new-appointment-dialog-v2.tsx**
   - Added client lookup state management
   - Implemented `handlePhoneLookup` function
   - Enhanced phone input with visual feedback
   - Updated form submission logic
   - Added reset logic for lookup state
   - **Swapped field positions**: Phone field moved to top (Row 1, left), Client Name moved to Row 2, left

## Testing Checklist

- [x] Phone lookup works with existing client phone numbers
- [x] Name and email auto-populate when client is found
- [x] Visual feedback (green checkmark) appears for found clients
- [x] Visual feedback (blue info icon) appears for new clients
- [x] New client auto-registration works correctly
- [x] Appointments are created with valid database client IDs
- [x] No "Client not found" errors occur
- [x] Phone number is required for appointment creation
- [x] Name and email fields are editable even when auto-populated
- [x] Lookup state resets when dialog opens/closes
- [x] Lookup state resets when phone number changes
- [x] Error messages are clear and user-friendly

## Success Criteria Met

✅ Phone number lookup works instantly and accurately  
✅ Auto-population of name and email works for existing clients  
✅ Auto-registration works for new clients without database errors  
✅ All appointments are created with valid client IDs that exist in the database  
✅ No "Client not found" errors occur during appointment creation  
✅ Phone number serves as primary identifier  
✅ Visual feedback provided for found/new clients  
✅ Name and email fields remain editable  
✅ No other functionality affected  
✅ Backward compatibility maintained  

## Notes

- Phone number is currently **required** for appointment creation (as per original requirement)
- If you want to make phone optional in the future, you would need to:
  1. Remove the phone validation check in the submit handler
  2. Handle the case where no phone is provided (create appointment without client lookup)
  3. Update the UI to indicate phone is optional
- The implementation uses the existing `autoRegisterClient` function which already handles duplicate detection
- All client data is stored in the database - no localStorage fallbacks for clients

