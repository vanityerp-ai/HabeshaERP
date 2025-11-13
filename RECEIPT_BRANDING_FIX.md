# Receipt Branding and Bilingual Display Fix

## Issues Fixed

### Issue 1: Hardcoded Company Name
**Problem**: The receipt was displaying a hardcoded company name "Vanity Hub" instead of using the dynamic company branding settings configured in the Settings page.

**Expected Behavior**: The receipt should display the company name from the company branding settings (currently set to "Habesha").

### Issue 2: Duplicate Receipt Number
**Problem**: The receipt number appeared above the company name in the header, duplicating the Transaction ID that appears in the info section.

**Expected Behavior**: Remove the duplicate receipt number from the header, keeping only the Transaction ID in the info section.

### Issue 3: Duplicate Items (English/Arabic Listed Separately)
**Problem**: Each service/product item was listed twice - once in English, once in Arabic with the same English text repeated.

**Expected Behavior**: Each item should appear only once with English text on top and Arabic translation/transliteration below in the same row.

### Issue 4: Missing Arabic Transliteration
**Problem**: Client names, staff names, and location names were displayed in English in both the English and Arabic sections.

**Expected Behavior**: Use phonetic transliteration to convert English text to Arabic script in the Arabic sections.

---

## Changes Made

### 1. `components/accounting/receipt-printer.ts`

#### Change 1: Added SettingsStorage import (line 4)
**Added**:
```typescript
import { SettingsStorage } from "@/lib/settings-storage"
```

#### Change 2: Get company name from settings (lines 10-12)
**Added**:
```typescript
// Get company branding settings
const settings = SettingsStorage.getGeneralSettings()
const companyName = settings.branding?.companyName || settings.businessName || "Vanity Hub"
```

**Why**: This retrieves the company name from the branding settings with fallbacks:
1. First tries `settings.branding.companyName` (from Company Branding settings)
2. Falls back to `settings.businessName` (from General settings)
3. Falls back to "Vanity Hub" as a last resort

#### Change 3: Use 5-digit transaction number (lines 57-58)
**Added**:
```typescript
// Use transactionNumber (5-digit) if available, otherwise fall back to id
const displayTransactionId = transaction.transactionNumber || transaction.id;
```

**Why**: This ensures the receipt displays the 5-digit sequential transaction number (e.g., "10001") instead of the long UUID.

#### Change 4: Improved items display - Single row with bilingual text (lines 27-50)
**Before**:
```typescript
// Items were displayed as two separate rows - English row, then Arabic row
itemsHtml = transaction.items.map(function (item) {
  return `
    <div style="display: flex; font-size: 12px; border-bottom: 1px dashed #aaa;">
      <div style="flex: 2;">${item.name}</div>
      ...
    </div>
    <div style="display: flex; font-size: 11px; direction: rtl; border-bottom: 1px dashed #aaa;">
      <div style="flex: 2;">${toPhoneticArabic(item.name)}</div>
      ...
    </div>
  `;
}).join('');
```

**After**:
```typescript
// Items displayed as single row with English on top, Arabic below
itemsHtml = transaction.items.map(function (item) {
  return `
    <div style="border-bottom: 1px dashed #aaa; padding: 4px 0;">
      <div style="display: flex; font-size: 12px; margin-bottom: 2px;">
        <div style="flex: 2;">${item.name}</div>
        ...
      </div>
      <div style="display: flex; font-size: 10px; direction: rtl; color: #666;">
        <div style="flex: 2;">${toPhoneticArabic(item.name)}</div>
        ...
      </div>
    </div>
  `;
}).join('');
```

**Why**: This eliminates duplicate item listings and creates a cleaner, more compact receipt with English and Arabic in the same item block.

#### Change 5: Improved info section - Side-by-side bilingual display (lines 88-109)
**Before**:
```html
<div class="info">
  <div><span class="label">Transaction ID:</span> ${displayTransactionId}</div>
  <div class="label-ar">معرّف المعاملة: ${displayTransactionId}</div>
  <div><span class="label">Client:</span> ${transaction.clientName || '-'}</div>
  <div class="label-ar">العميل: ${transaction.clientName || '-'}</div>
  ...
</div>
```

**After**:
```html
<div class="info">
  <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
    <span><span class="label">Transaction ID:</span> ${displayTransactionId}</span>
    <span class="label-ar" style="direction: rtl;">معرّف المعاملة: ${displayTransactionId}</span>
  </div>
  <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
    <span><span class="label">Client:</span> ${transaction.clientName || '-'}</span>
    <span class="label-ar" style="direction: rtl;">العميل: ${transaction.clientName ? toPhoneticArabic(transaction.clientName) : '-'}</span>
  </div>
  ...
</div>
```

**Why**:
- Displays English and Arabic side-by-side instead of stacked
- Uses `toPhoneticArabic()` for client names, staff names, and locations
- Creates a more compact, professional receipt layout

#### Change 6: Improved table headers - Combined bilingual headers (lines 110-128)
**Before**:
```html
<div style="display: flex; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px;">
  <div style="flex: 2;">Item</div>
  ...
</div>
<div style="display: flex; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; direction: rtl; font-size: 11px;">
  <div style="flex: 2;">الصنف</div>
  ...
</div>
```

**After**:
```html
<div style="border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 2px;">
  <div style="display: flex; font-weight: bold; font-size: 12px;">
    <div style="flex: 2;">Item</div>
    ...
  </div>
  <div style="display: flex; font-weight: bold; font-size: 10px; direction: rtl; color: #666;">
    <div style="flex: 2;">الصنف</div>
    ...
  </div>
</div>
```

**Why**: Combines English and Arabic headers into a single header block, matching the item display style.

#### Change 7: Improved summary section - Side-by-side bilingual display (lines 129-150)
**Before**:
```html
<div class="summary">
  <div><span class="label">Payment Method:</span> ${transaction.paymentMethod || '-'}</div>
  <div class="label-ar">طريقة الدفع: ${transaction.paymentMethod || '-'}</div>
  ...
</div>
```

**After**:
```html
<div class="summary">
  <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
    <span><span class="label">Payment Method:</span> ${transaction.paymentMethod || '-'}</span>
    <span class="label-ar" style="direction: rtl;">طريقة الدفع: ${transaction.paymentMethod || '-'}</span>
  </div>
  ...
</div>
```

**Why**: Consistent side-by-side bilingual display throughout the receipt.

#### Change 9: Replace hardcoded company name in receipt HTML (line 82)
**Before**:
```html
<div class="title">Vanity Hub</div>
```

**After**:
```html
<div class="title">${companyName}</div>
```

#### Change 10: Use displayTransactionId in receipt (lines 63, 90-91)
**Before**:
```html
<title>Receipt - ${transaction.id}</title>
...
<div><span class="label">Transaction ID:</span> ${transaction.id}</div>
<div class="label-ar">معرّف المعاملة: ${transaction.id}</div>
```

**After**:
```html
<title>Receipt - ${displayTransactionId}</title>
...
<div><span class="label">Transaction ID:</span> ${displayTransactionId}</div>
<div class="label-ar">معرّف المعاملة: ${displayTransactionId}</div>
```

---

### 2. `app/dashboard/accounting/page.tsx`

#### Change 1: Added SettingsStorage import (line 46)
**Added**:
```typescript
import { SettingsStorage } from "@/lib/settings-storage"
```

#### Change 2: Get company name from settings in handlePrintReceipt (lines 92-95)
**Added**:
```typescript
// Get company branding settings
const settings = SettingsStorage.getGeneralSettings()
const companyName = settings.branding?.companyName || settings.businessName || "Vanity Hub"

// Use transactionNumber (5-digit) if available, otherwise fall back to id
const displayTransactionId = tx.transactionNumber || tx.id;
```

#### Change 3: Replace hardcoded company name in receipt HTML (line 148)
**Before**:
```html
<div class="title">Vanity Hub</div>
```

**After**:
```html
<div class="title">${companyName}</div>
```

#### Change 4: Use displayTransactionId in receipt (lines 125, 153-154)
**Before**:
```html
<title>Receipt - ${tx.id}</title>
...
<div><span class="label">Transaction ID:</span> ${tx.id}</div>
<div class="label-ar">معرّف المعاملة: ${tx.id}</div>
```

**After**:
```html
<title>Receipt - ${displayTransactionId}</title>
...
<div><span class="label">Transaction ID:</span> ${displayTransactionId}</div>
<div class="label-ar">معرّف المعاملة: ${displayTransactionId}</div>
```

---

### 3. `app/client-portal/dashboard/page.tsx`

#### Change: Dynamic company name in loyalty card (line 483)
**Before**:
```tsx
<p className="text-white/80 text-sm">Vanity Hub</p>
```

**After**:
```tsx
<p className="text-white/80 text-sm">{businessSettings?.branding?.companyName || businessSettings?.businessName || "Vanity Hub"}</p>
```

**Why**: The loyalty card in the client portal dashboard should also display the dynamic company name.

---

### 4. `app/client-portal/loyalty/page.tsx`

#### Change 1: Dynamic company name in loyalty card (line 367)
**Before**:
```tsx
<p className="text-white/80 text-sm">Vanity Hub</p>
```

**After**:
```tsx
<p className="text-white/80 text-sm">{businessSettings?.branding?.companyName || businessSettings?.businessName || "Vanity Hub"}</p>
```

#### Change 2: Dynamic company name in referral toast (lines 181-184)
**Before**:
```typescript
toast({
  title: "Referral sent!",
  description: "Your friend has been invited to join Vanity Hub. You'll earn 200 points when they book their first appointment.",
})
```

**After**:
```typescript
const companyName = businessSettings?.branding?.companyName || businessSettings?.businessName || "Vanity Hub"
toast({
  title: "Referral sent!",
  description: `Your friend has been invited to join ${companyName}. You'll earn 200 points when they book their first appointment.`,
})
```

**Why**: The referral message should use the dynamic company name.

---

## How Company Branding Settings Work

### Settings Storage Structure

The company branding settings are stored in `localStorage` via the `SettingsStorage` service:

```typescript
interface BrandingSettings {
  companyLogo: string | null;      // File path or URL to uploaded logo
  companyName: string;              // Company name (e.g., "Habesha")
  primaryBrandColor: string;        // Primary brand color (e.g., "#8b5cf6")
  logoAltText: string;              // Alt text for logo
  showCompanyNameWithLogo: boolean; // Whether to show name with logo
}

interface GeneralSettings {
  businessName: string;             // Business name (legacy field)
  // ... other fields
  branding: BrandingSettings;       // Branding settings
}
```

### Accessing Settings

To get the company name:
```typescript
const settings = SettingsStorage.getGeneralSettings()
const companyName = settings.branding?.companyName || settings.businessName || "Vanity Hub"
```

This provides a fallback chain:
1. **`settings.branding.companyName`** - From Company Branding settings (preferred)
2. **`settings.businessName`** - From General settings (legacy)
3. **`"Vanity Hub"`** - Hardcoded fallback (last resort)

### Updating Settings

Users can update the company name in:
- **Settings → Branding** tab
- Update the "Company Name" field
- Click "Save Changes"

---

## Testing Instructions

### 1. Verify Receipt Displays Correct Company Name

1. **Go to Settings → Branding**
2. **Verify** the company name is set to "Habesha" (or your desired name)
3. **Go to Accounting → Transactions**
4. **Click** the three-dot menu on any transaction
5. **Click** "Print Receipt"
6. **Verify** the receipt displays "Habesha" (not "Vanity Hub")

### 2. Verify Transaction ID is 5-Digit Format

1. **In the same receipt**, check the Transaction ID
2. **Verify** it shows a 5-digit number (e.g., "10001") instead of a long UUID
3. **Verify** the Arabic translation also shows the 5-digit number

### 3. Verify Loyalty Cards Display Correct Company Name

1. **Go to Client Portal → Dashboard** (as a client)
2. **Check** the Loyalty Card in the right column
3. **Verify** it displays "Habesha" (not "Vanity Hub")
4. **Go to Client Portal → Loyalty**
5. **Check** the Loyalty Card at the top
6. **Verify** it displays "Habesha" (not "Vanity Hub")

### 4. Verify Referral Message Uses Correct Company Name

1. **In Client Portal → Loyalty**
2. **Scroll** to the "Refer a Friend" section
3. **Enter** a friend's email
4. **Click** "Send Referral"
5. **Verify** the success toast says "Your friend has been invited to join Habesha..." (not "Vanity Hub")

---

## Summary

✅ **Receipt Company Name** - Now displays dynamic company name from settings
✅ **Transaction ID Format** - Now displays 5-digit sequential number
✅ **Bilingual Display** - English and Arabic displayed side-by-side (not duplicated)
✅ **Item Listing** - Each item appears once with English on top, Arabic below
✅ **Arabic Transliteration** - Client names, staff names, locations properly transliterated
✅ **Compact Layout** - Cleaner, more professional thermal-printer-friendly receipt
✅ **Loyalty Cards** - Now display dynamic company name
✅ **Referral Messages** - Now use dynamic company name
✅ **Fallback Chain** - Proper fallbacks ensure no errors if settings are missing
✅ **No Breaking Changes** - All existing functionality preserved

---

## Files Modified

1. `components/accounting/receipt-printer.ts` - Receipt printer utility
2. `app/dashboard/accounting/page.tsx` - Accounting page with inline receipt printer
3. `app/client-portal/dashboard/page.tsx` - Client portal dashboard
4. `app/client-portal/loyalty/page.tsx` - Client portal loyalty page

---

**The receipt and all other components now display the correct company name from your branding settings!** 🎉

