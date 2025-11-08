# Testing Guide - Database Migration

## 🎯 Purpose
This guide will help you verify that the localStorage to database migration is working correctly and that data now persists across browsers and devices.

## ✅ Pre-Test Checklist

- [x] Dev server is running on http://localhost:3001
- [x] Database schema updated (Prisma)
- [x] All API routes created
- [x] All client-side code updated

## 🧪 Test Scenarios

### Test 1: Appointment Creation & Cross-Browser Persistence

**Objective:** Verify appointments are saved to database and visible across browsers

**Steps:**

1. **Open Browser 1 (e.g., Chrome)**
   - Navigate to: http://localhost:3001/client-portal/appointments/book
   - Create a new appointment:
     - Select a service
     - Choose a staff member
     - Pick a date and time
     - Fill in client details
     - Complete the booking
   - Note the booking reference number

2. **Open Browser 2 (e.g., Firefox or Edge)**
   - Navigate to: http://localhost:3001/dashboard/appointments
   - Login if required
   - **Expected Result:** The appointment you just created should be visible in the appointments list

3. **Verify in Browser 1**
   - Navigate to: http://localhost:3001/client-portal/appointments
   - **Expected Result:** Your appointment should be listed

**✅ Success Criteria:**
- Appointment appears in both browsers
- Booking reference matches
- All details are correct (service, staff, date, time)

**❌ If Failed:**
- Check browser console for errors
- Check Network tab for failed API calls
- Verify `/api/appointments` endpoint is working

---

### Test 2: Transaction Creation & Persistence

**Objective:** Verify transactions are saved to database

**Steps:**

1. **In Browser 1**
   - Navigate to: http://localhost:3001/dashboard/pos
   - Create a transaction:
     - Add a service or product
     - Complete the sale
     - Note the transaction ID

2. **In Browser 2**
   - Navigate to: http://localhost:3001/dashboard/analytics
   - **Expected Result:** The transaction should appear in the analytics dashboard
   - Check the transactions list

3. **Refresh Browser 1**
   - Navigate to: http://localhost:3001/dashboard/analytics
   - **Expected Result:** Transaction is still visible after refresh

**✅ Success Criteria:**
- Transaction appears in both browsers
- Transaction persists after page refresh
- Transaction amount is correct

**❌ If Failed:**
- Check browser console for errors
- Check `/api/transactions` endpoint
- Verify transaction provider is loading from API

---

### Test 3: Order Creation & Status Updates

**Objective:** Verify orders are saved to database and status updates persist

**Steps:**

1. **In Browser 1**
   - Navigate to: http://localhost:3001/dashboard/shop
   - Create an order:
     - Add products to cart
     - Complete checkout
     - Note the order number

2. **In Browser 2**
   - Navigate to: http://localhost:3001/dashboard/orders
   - **Expected Result:** The order should be visible
   - Update the order status to "Processing"

3. **In Browser 1**
   - Refresh the orders page
   - **Expected Result:** Order status should show "Processing"

**✅ Success Criteria:**
- Order appears in both browsers
- Status update is visible in both browsers
- Order details are correct

**❌ If Failed:**
- Check `/api/orders` endpoint
- Verify order management service is using API

---

### Test 4: Time-Off Request Creation

**Objective:** Verify time-off requests are saved to database

**Steps:**

1. **In Browser 1**
   - Navigate to: http://localhost:3001/dashboard/staff
   - Create a time-off request for a staff member
   - Note the request details

2. **In Browser 2**
   - Navigate to: http://localhost:3001/dashboard/staff
   - **Expected Result:** The time-off request should be visible

3. **Update the request status**
   - In Browser 2, approve or reject the request

4. **In Browser 1**
   - Refresh the page
   - **Expected Result:** Status update should be visible

**✅ Success Criteria:**
- Time-off request appears in both browsers
- Status updates are synchronized
- Request details are correct

**❌ If Failed:**
- Check `/api/time-off` endpoint
- Verify schedule provider is using API

---

### Test 5: Data Persistence After Browser Restart

**Objective:** Verify data persists even after closing and reopening browser

**Steps:**

1. **Create test data**
   - Create 1 appointment
   - Create 1 transaction
   - Create 1 order
   - Note all IDs/references

2. **Close all browsers completely**
   - Close all browser windows
   - Wait 10 seconds

3. **Reopen browser**
   - Navigate to: http://localhost:3001/dashboard
   - Check appointments, transactions, and orders

**✅ Success Criteria:**
- All data is still visible
- No data loss occurred
- All details are intact

**❌ If Failed:**
- Data is only in localStorage, not database
- API endpoints may not be saving correctly

---

### Test 6: Concurrent Updates

**Objective:** Verify concurrent updates don't cause conflicts

**Steps:**

1. **In Browser 1 and Browser 2**
   - Both navigate to: http://localhost:3001/dashboard/appointments

2. **In Browser 1**
   - Create a new appointment

3. **In Browser 2**
   - Refresh the page
   - **Expected Result:** New appointment appears

4. **In Browser 2**
   - Update the appointment status

5. **In Browser 1**
   - Refresh the page
   - **Expected Result:** Status update is visible

**✅ Success Criteria:**
- Changes from one browser appear in the other
- No data conflicts or duplicates
- Updates are synchronized

---

## 🔍 Debugging Tips

### Check Browser Console
```javascript
// Open browser console (F12) and run:
console.log('Appointments:', localStorage.getItem('vanity_appointments'))
console.log('Transactions:', localStorage.getItem('vanity_transactions'))
console.log('Orders:', localStorage.getItem('salon_orders'))
```

### Check API Endpoints
Open these URLs directly in browser:
- http://localhost:3001/api/appointments
- http://localhost:3001/api/transactions
- http://localhost:3001/api/orders
- http://localhost:3001/api/time-off

**Expected:** JSON response with data

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Perform an action (create appointment, etc.)
4. Look for API calls to `/api/appointments`, `/api/transactions`, etc.
5. Check if they return 200 OK or errors

### Check Database
```bash
# Open Prisma Studio to view database directly
npx prisma studio
```

This will open http://localhost:5555 where you can see all database tables and data.

---

## 📊 Test Results Template

Use this template to record your test results:

```
## Test Results - [Date]

### Test 1: Appointment Creation
- [ ] Appointment created successfully
- [ ] Visible in Browser 2
- [ ] Persists after refresh
- Notes: _______________

### Test 2: Transaction Creation
- [ ] Transaction created successfully
- [ ] Visible in Browser 2
- [ ] Persists after refresh
- Notes: _______________

### Test 3: Order Creation
- [ ] Order created successfully
- [ ] Visible in Browser 2
- [ ] Status updates work
- Notes: _______________

### Test 4: Time-Off Request
- [ ] Request created successfully
- [ ] Visible in Browser 2
- [ ] Status updates work
- Notes: _______________

### Test 5: Data Persistence
- [ ] Data persists after browser restart
- [ ] No data loss
- Notes: _______________

### Test 6: Concurrent Updates
- [ ] Updates synchronized across browsers
- [ ] No conflicts or duplicates
- Notes: _______________

## Overall Result
- [ ] All tests passed ✅
- [ ] Some tests failed ❌ (see notes)

## Issues Found
1. _______________
2. _______________
3. _______________
```

---

## 🚨 Common Issues & Solutions

### Issue: "Failed to fetch" errors in console
**Solution:** 
- Check if dev server is running
- Verify API routes exist
- Check for CORS issues

### Issue: Data appears in one browser but not another
**Solution:**
- Check if API calls are succeeding (Network tab)
- Verify database is being updated (Prisma Studio)
- Check for caching issues (clear browser cache)

### Issue: Duplicate data appearing
**Solution:**
- Check deduplication logic in transaction provider
- Verify unique constraints in database
- Clear localStorage and reload from database

### Issue: Old data from localStorage interfering
**Solution:**
```javascript
// Clear all localStorage (in browser console)
localStorage.clear()
// Then refresh the page
location.reload()
```

---

## ✅ Final Verification

After all tests pass, verify:

1. **No Breaking Changes**
   - All existing features work as before
   - No UI changes occurred
   - User experience is the same

2. **Cross-Device Sync**
   - Data is visible across different browsers
   - Data persists after browser restart
   - Updates are synchronized

3. **Performance**
   - Page load times are acceptable
   - No noticeable lag when creating/updating data
   - API responses are fast (< 500ms)

4. **Data Integrity**
   - No data loss
   - No duplicate data
   - All fields are saved correctly

---

## 📝 Next Steps After Testing

If all tests pass:
1. ✅ Mark migration as complete
2. 📝 Document any issues found
3. 🚀 Consider deploying to production
4. 📊 Monitor performance in production

If tests fail:
1. 📝 Document the failures
2. 🔍 Debug using the tips above
3. 🛠️ Fix the issues
4. 🔄 Re-run the tests

