# PostgreSQL Migration Testing Checklist

## Pre-Migration Testing

- [ ] **Backup Created**
  - [ ] SQLite database backed up (`prisma/dev.db.backup`)
  - [ ] SQL dump created (`sqlite_backup.sql`)
  - [ ] Backup verified and accessible

- [ ] **Environment Prepared**
  - [ ] PostgreSQL instance running
  - [ ] Database and user created
  - [ ] Connection string verified
  - [ ] Network connectivity confirmed

- [ ] **Code Review**
  - [ ] Prisma schema reviewed
  - [ ] No SQLite-specific features used
  - [ ] All migrations reviewed
  - [ ] No hardcoded database paths

## Migration Execution Testing

- [ ] **Schema Migration**
  - [ ] `npm run db:setup:prod` completed successfully
  - [ ] All tables created in PostgreSQL
  - [ ] Indexes created correctly
  - [ ] Constraints applied properly

- [ ] **Data Migration**
  - [ ] `npm run db:export:sqlite` completed
  - [ ] Export file created and valid
  - [ ] `npm run db:import:postgres` completed
  - [ ] No import errors or warnings

- [ ] **Verification**
  - [ ] `npm run db:verify-migration` passed
  - [ ] Row counts match between SQLite and PostgreSQL
  - [ ] Foreign key relationships intact
  - [ ] No orphaned records

## Application Functionality Testing

### Authentication & Users
- [ ] Login with existing credentials works
- [ ] User roles preserved (ADMIN, STAFF, CLIENT)
- [ ] User profiles display correctly
- [ ] Password authentication works
- [ ] Session management works

### Client Management
- [ ] All clients display in list
- [ ] Client details show correctly
- [ ] Client search works
- [ ] Create new client works
- [ ] Update client information works
- [ ] Delete client works (if applicable)
- [ ] Client phone numbers preserved
- [ ] Client preferences preserved

### Staff Management
- [ ] All staff members display
- [ ] Staff profiles complete
- [ ] Staff schedules preserved
- [ ] Staff specialties preserved
- [ ] Staff locations assigned correctly
- [ ] Staff services assigned correctly
- [ ] Create new staff member works
- [ ] Update staff information works

### Services & Products
- [ ] All services display with correct pricing
- [ ] Service categories preserved
- [ ] Service descriptions intact
- [ ] All products display
- [ ] Product categories correct
- [ ] Product pricing preserved
- [ ] Product inventory levels correct
- [ ] Create new service works
- [ ] Create new product works

### Appointments & Bookings
- [ ] All appointments display in calendar
- [ ] Appointment dates correct
- [ ] Appointment times correct
- [ ] Appointment status preserved
- [ ] Appointment notes preserved
- [ ] Appointment services linked correctly
- [ ] Create new appointment works
- [ ] Update appointment status works
- [ ] Cancel appointment works
- [ ] Appointment history preserved

### Booking Summary
- [ ] Calendar view displays correctly
- [ ] Summary view displays correctly
- [ ] Bookings filtered by status correctly
- [ ] Status transitions work (pending → confirmed → arrived → service-started → completed)
- [ ] Payment processing works
- [ ] Payment status saved correctly
- [ ] Booking details display completely

### Locations
- [ ] All locations display
- [ ] Location details correct
- [ ] Location staff assignments preserved
- [ ] Location services preserved
- [ ] Location products preserved

### Transactions & Payments
- [ ] All transactions display
- [ ] Transaction amounts correct
- [ ] Payment methods preserved
- [ ] Transaction dates correct
- [ ] Create new transaction works
- [ ] Payment processing works

### Reports & Analytics
- [ ] Revenue reports generate correctly
- [ ] Appointment reports accurate
- [ ] Staff performance reports work
- [ ] Client reports work
- [ ] Date range filtering works
- [ ] Export to PDF works
- [ ] Export to Excel works

### Inventory Management
- [ ] Product stock levels correct
- [ ] Stock transfers work
- [ ] Batch tracking preserved
- [ ] Inventory audits preserved
- [ ] Low stock alerts work

### Loyalty & Memberships
- [ ] Loyalty programs preserved
- [ ] Membership data intact
- [ ] Points calculations work
- [ ] Rewards redemption works

## Performance Testing

- [ ] **Query Performance**
  - [ ] Calendar loads within 2 seconds
  - [ ] Client list loads within 1 second
  - [ ] Appointment search fast
  - [ ] Reports generate within 5 seconds

- [ ] **Connection Pooling**
  - [ ] Multiple concurrent users work
  - [ ] No connection timeout errors
  - [ ] Connection pool properly configured

- [ ] **Database Size**
  - [ ] PostgreSQL database size reasonable
  - [ ] No unexpected data duplication
  - [ ] Indexes properly created

## Data Integrity Testing

- [ ] **Referential Integrity**
  - [ ] No orphaned appointments
  - [ ] No orphaned clients
  - [ ] No orphaned staff records
  - [ ] All foreign keys valid

- [ ] **Data Types**
  - [ ] Dates formatted correctly
  - [ ] Decimals (prices) precise
  - [ ] Strings not truncated
  - [ ] JSON fields parsed correctly

- [ ] **Constraints**
  - [ ] Unique constraints enforced
  - [ ] Not null constraints enforced
  - [ ] Check constraints working
  - [ ] Default values applied

## Security Testing

- [ ] **Connection Security**
  - [ ] SSL/TLS enabled for PostgreSQL
  - [ ] Connection string not exposed
  - [ ] Credentials properly managed

- [ ] **Data Security**
  - [ ] Passwords hashed correctly
  - [ ] Sensitive data encrypted
  - [ ] Audit logs preserved

- [ ] **Access Control**
  - [ ] Role-based access works
  - [ ] Permissions enforced
  - [ ] Admin functions restricted

## Rollback Testing

- [ ] **Rollback Procedure**
  - [ ] `npm run db:rollback:sqlite` works
  - [ ] SQLite database restored
  - [ ] Prisma schema reverted
  - [ ] Application works with SQLite again

- [ ] **Data Recovery**
  - [ ] All data recovered from backup
  - [ ] No data loss during rollback
  - [ ] Application stable after rollback

## Production Deployment Testing

- [ ] **Environment Variables**
  - [ ] DATABASE_URL set correctly
  - [ ] NODE_ENV set to production
  - [ ] All secrets configured

- [ ] **Build Process**
  - [ ] `npm run build` succeeds
  - [ ] No build errors
  - [ ] Prisma client generated

- [ ] **Deployment**
  - [ ] Application deploys successfully
  - [ ] No deployment errors
  - [ ] Application starts correctly

- [ ] **Post-Deployment**
  - [ ] Application accessible
  - [ ] All features working
  - [ ] Logs show no errors
  - [ ] Monitoring alerts configured

## Sign-Off

- [ ] **Testing Complete**
  - [ ] All tests passed
  - [ ] No critical issues
  - [ ] Performance acceptable
  - [ ] Data integrity verified

- [ ] **Approval**
  - [ ] QA approved
  - [ ] Product owner approved
  - [ ] Ready for production

---

**Migration Date**: _______________
**Tested By**: _______________
**Approved By**: _______________
**Notes**: _______________________________________________

