const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// 144 Real services data
const realServiceData = [
  // BRAIDING SERVICES (28)
  { name: 'Box Braid With Extension (Small)', category: 'Braiding', duration: 240, price: 520 },
  { name: 'Box Braid With Extension (Medium)', category: 'Braiding', duration: 180, price: 430 },
  { name: 'Box Braid With Own Ext (Small)', category: 'Braiding', duration: 210, price: 400 },
  { name: 'Box Braid With Own Ext (Medium)', category: 'Braiding', duration: 150, price: 350 },
  { name: 'Twist With Extension (Small)', category: 'Braiding', duration: 270, price: 550 },
  { name: 'Twist With Extension (Medium)', category: 'Braiding', duration: 210, price: 450 },
  { name: 'Knotless Braid Small (No Extensions)', category: 'Braiding', duration: 180, price: 450 },
  { name: 'Knotless Braid Medium (No Extensions)', category: 'Braiding', duration: 150, price: 400 },
  { name: 'Knotless Braid Large (No Extensions)', category: 'Braiding', duration: 120, price: 350 },
  { name: 'Knotless Braid With Extension (Small)', category: 'Braiding', duration: 300, price: 600 },
  { name: 'Knotless Braid With Extension (Medium)', category: 'Braiding', duration: 240, price: 550 },
  { name: 'Knotless Braid With Extension (Large)', category: 'Braiding', duration: 180, price: 450 },
  { name: 'Natural Hair Box Braid (Medium)', category: 'Braiding', duration: 120, price: 250 },
  { name: 'Natural Hair Box Braid (Long)', category: 'Braiding', duration: 150, price: 350 },
  { name: 'Cornrow Half Box Braid', category: 'Braiding', duration: 180, price: 450 },
  { name: 'Cornrow With Extension', category: 'Braiding', duration: 90, price: 250 },
  { name: 'Cornrow Ponytail With Extension', category: 'Braiding', duration: 75, price: 280 },
  { name: 'Cornrow Natural Hair (Small)', category: 'Braiding', duration: 90, price: 200 },
  { name: 'Cornrow Natural Hair (Medium)', category: 'Braiding', duration: 60, price: 150 },
  { name: 'Kids Cornrow Natural Hair (2 To 6 Yrs)', category: 'Braiding', duration: 45, price: 100 },
  { name: 'Kids Cornrow Natural Hair (6 To 10 Yrs)', category: 'Braiding', duration: 60, price: 130 },
  { name: 'Kids Cornrow With Ext (2 To 6 Yrs)', category: 'Braiding', duration: 75, price: 190 },
  { name: 'Kids Cornrow With Ext (6 To 10 Yrs)', category: 'Braiding', duration: 90, price: 250 },
  { name: 'Crochet Single Braids', category: 'Braiding', duration: 150, price: 400 },
  { name: 'Crochet Cornrow Braids', category: 'Braiding', duration: 90, price: 250 },
  { name: 'Pick And Drop', category: 'Braiding', duration: 180, price: 450 },
  { name: 'Faux Locks Medium', category: 'Braiding', duration: 360, price: 750 },
  { name: 'Faux Locks Large', category: 'Braiding', duration: 300, price: 600 },
  // HAIR EXTENSION SERVICES (11)
  { name: 'Sewing (Weave) Bundle', category: 'Hair Extension', duration: 120, price: 150 },
  { name: 'Sewing (Weave) Bundle With Closure', category: 'Hair Extension', duration: 150, price: 180 },
  { name: 'Sewing (Weave) Bundle & Closure With Glue', category: 'Hair Extension', duration: 180, price: 250 },
  { name: 'Lace Wig Sewing', category: 'Hair Extension', duration: 90, price: 150 },
  { name: 'Lace Wig With Glue', category: 'Hair Extension', duration: 120, price: 250 },
  { name: 'Apply Tape In Extension 20 Pcs (With Own Extension)', category: 'Hair Extension', duration: 90, price: 200 },
  { name: 'Apply Tape In Extension 40 Pcs (With Own Extension)', category: 'Hair Extension', duration: 150, price: 400 },
  { name: 'Apply Tape In Extension 60 Pcs (With Own Extension)', category: 'Hair Extension', duration: 210, price: 550 },
  { name: 'Micro Ring Extension Full Head (With Own Extension)', category: 'Hair Extension', duration: 240, price: 650 },
  { name: 'Micro Ring Extension Half Head (With Own Extension)', category: 'Hair Extension', duration: 150, price: 450 },
  { name: 'Micro Ring Extension 1/4 Head (With Own Extension)', category: 'Hair Extension', duration: 90, price: 250 },
  // HAIR STYLING SERVICES (20)
  { name: 'Hair Extension Removing', category: 'Hair Styling', duration: 30, price: 50 },
  { name: 'Cornrows Removing', category: 'Hair Styling', duration: 30, price: 50 },
  { name: 'Box Braids Removing', category: 'Hair Styling', duration: 60, price: 150 },
  { name: 'Hair Washing', category: 'Hair Styling', duration: 30, price: 50 },
  { name: 'Hair Extension Washing', category: 'Hair Styling', duration: 45, price: 50 },
  { name: 'Hair Trimming', category: 'Hair Styling', duration: 30, price: 50 },
  { name: 'Hair Cut Style', category: 'Hair Styling', duration: 60, price: 150 },
  { name: 'Blow Dry', category: 'Hair Styling', duration: 45, price: 100 },
  { name: 'Flat Iron (Medium)', category: 'Hair Styling', duration: 45, price: 150 },
  { name: 'Flat Iron (Long)', category: 'Hair Styling', duration: 60, price: 180 },
  { name: 'Flat Iron (Extra Long)', category: 'Hair Styling', duration: 75, price: 200 },
  { name: 'Hair Curling (Medium)', category: 'Hair Styling', duration: 60, price: 150 },
  { name: 'Hair Curling (Long)', category: 'Hair Styling', duration: 75, price: 180 },
  { name: 'Hair Curling (Extra Long)', category: 'Hair Styling', duration: 90, price: 200 },
  { name: 'Weaving Hair Style (Medium)', category: 'Hair Styling', duration: 90, price: 200 },
  { name: 'Weaving Hair Style (Long)', category: 'Hair Styling', duration: 120, price: 250 },
  { name: 'Curls Roller Set', category: 'Hair Styling', duration: 90, price: 120 },
  { name: 'Silk Press', category: 'Hair Styling', duration: 120, price: 180 },
  { name: 'Bridal Hair Style', category: 'Hair Styling', duration: 180, price: 500 },
  { name: 'Occasional Hair Style', category: 'Hair Styling', duration: 120, price: 400 },
  // HAIR TREATMENT SERVICES (10)
  { name: 'Deep Condition Detangling', category: 'Hair Treatment', duration: 60, price: 75 },
  { name: 'Hot Oil Treatment', category: 'Hair Treatment', duration: 45, price: 150 },
  { name: 'Hair Mask Treatment - 30 Mins', category: 'Hair Treatment', duration: 30, price: 150 },
  { name: 'Aloe Vera Treatment - 30 Mins', category: 'Hair Treatment', duration: 30, price: 150 },
  { name: 'Brazilian Keratin Treatment (Medium)', category: 'Hair Treatment', duration: 180, price: 600 },
  { name: 'Brazilian Keratin Treatment (Long)', category: 'Hair Treatment', duration: 240, price: 750 },
  { name: 'Brazilian Keratin Treatment (Extra Long)', category: 'Hair Treatment', duration: 300, price: 900 },
  { name: 'Short Hair Perm (Permanent Curly 3 To 6 Months)', category: 'Hair Treatment', duration: 150, price: 650 },
  { name: 'Medium Hair Perm (Permanent Curly 3 To 6 Months)', category: 'Hair Treatment', duration: 180, price: 850 },
  { name: 'Long Hair Perm (Permanent Curly 3 To 6 Months)', category: 'Hair Treatment', duration: 240, price: 1200 },
  // HAIR COLOR SERVICES (14)
  { name: 'Hair Color & Highlight Extra Long Hair', category: 'Hair Color', duration: 240, price: 600 },
  { name: 'Hair Color & Highlights Long Hair', category: 'Hair Color', duration: 180, price: 500 },
  { name: 'Hair Color & Highlights Medium Hair', category: 'Hair Color', duration: 150, price: 400 },
  { name: 'Hair Color Highlights Short Hair', category: 'Hair Color', duration: 120, price: 300 },
  { name: 'Hair Color Weave Extensions', category: 'Hair Color', duration: 120, price: 350 },
  { name: 'Hair Color Extra Long Hair', category: 'Hair Color', duration: 180, price: 400 },
  { name: 'Hair Color (Short)', category: 'Hair Color', duration: 90, price: 200 },
  { name: 'Hair Color (Medium)', category: 'Hair Color', duration: 120, price: 250 },
  { name: 'Hair Color (Long)', category: 'Hair Color', duration: 150, price: 350 },
  { name: 'Hair Color Roots', category: 'Hair Color', duration: 60, price: 150 },
  { name: 'Hair Bleaching', category: 'Hair Color', duration: 150, price: 350 },
  { name: 'Hair Relaxer Product From Salon', category: 'Hair Color', duration: 90, price: 200 },
  { name: 'Hair Relaxer (Own Product)', category: 'Hair Color', duration: 75, price: 150 },
  { name: 'Hair Relaxer Retouch', category: 'Hair Color', duration: 60, price: 150 },
  // NAIL SERVICES (10)
  { name: 'Pedicure', category: 'Nail', duration: 60, price: 80 },
  { name: 'Manicure', category: 'Nail', duration: 45, price: 60 },
  { name: 'Pedicure With Gel Polish', category: 'Nail', duration: 90, price: 130 },
  { name: 'Manicure With Gel Polish', category: 'Nail', duration: 75, price: 110 },
  { name: 'Normal Polish', category: 'Nail', duration: 20, price: 25 },
  { name: 'Gel Polish', category: 'Nail', duration: 45, price: 80 },
  { name: 'Acrylic Extension', category: 'Nail', duration: 120, price: 250 },
  { name: 'Gel Extension', category: 'Nail', duration: 120, price: 250 },
  { name: 'Acrylic And Gel Extension Refill', category: 'Nail', duration: 90, price: 150 },
  { name: 'Acrylic And Gel Extension Removing', category: 'Nail', duration: 30, price: 50 },
  // EYELASH & THREADING SERVICES (11)
  { name: 'Classic Eyelash', category: 'Eyelash & Threading', duration: 90, price: 150 },
  { name: 'Volume Eyelash', category: 'Eyelash & Threading', duration: 120, price: 200 },
  { name: 'Mega Volume Eyelash', category: 'Eyelash & Threading', duration: 150, price: 250 },
  { name: 'Eyebrows Threading', category: 'Eyelash & Threading', duration: 15, price: 25 },
  { name: 'Eyebrows & Color', category: 'Eyelash & Threading', duration: 30, price: 50 },
  { name: 'Full Face Threading', category: 'Eyelash & Threading', duration: 45, price: 80 },
  { name: 'Half Face Threading', category: 'Eyelash & Threading', duration: 25, price: 40 },
  { name: 'Upper Lip Threading', category: 'Eyelash & Threading', duration: 10, price: 20 },
  { name: 'Full Face & Eyebrow Color', category: 'Eyelash & Threading', duration: 60, price: 105 },
  { name: 'Full Face Bleaching', category: 'Eyelash & Threading', duration: 30, price: 50 },
  { name: 'Eyebrow Bleaching', category: 'Eyelash & Threading', duration: 15, price: 20 },
  // WAXING SERVICES (11)
  { name: 'Full Body Wax', category: 'Waxing', duration: 120, price: 220 },
  { name: 'Full Body Wax With Bikini', category: 'Waxing', duration: 150, price: 300 },
  { name: 'Full Leg Wax', category: 'Waxing', duration: 45, price: 80 },
  { name: 'Full Hand Wax', category: 'Waxing', duration: 30, price: 60 },
  { name: 'Half Leg Wax', category: 'Waxing', duration: 30, price: 50 },
  { name: 'Half Hand Wax', category: 'Waxing', duration: 20, price: 40 },
  { name: 'Under Arm Wax', category: 'Waxing', duration: 15, price: 20 },
  { name: 'Bikini Wax', category: 'Waxing', duration: 30, price: 80 },
  { name: 'Full Back Wax', category: 'Waxing', duration: 30, price: 80 },
  { name: 'Half Back Wax', category: 'Waxing', duration: 20, price: 50 },
  { name: 'Stomach Wax', category: 'Waxing', duration: 20, price: 50 },
  // HENNA SERVICES (14)
  { name: 'Up To Wrist One Side - 2 Hands', category: 'Henna', duration: 45, price: 50 },
  { name: 'Up To Wrist Two Sides - 2 Hands', category: 'Henna', duration: 75, price: 100 },
  { name: '1/4 Of Forearm One Side - 2 Hands', category: 'Henna', duration: 60, price: 60 },
  { name: '1/4 Of Forearm Two Sides - 2 Hands', category: 'Henna', duration: 90, price: 120 },
  { name: '3/4 Of Forearm One Side - 2 Hands', category: 'Henna', duration: 75, price: 80 },
  { name: '3/4 Of Forearm Two Sides - 2 Hands', category: 'Henna', duration: 120, price: 150 },
  { name: 'Up Elbow One Side - 2 Hands', category: 'Henna', duration: 90, price: 100 },
  { name: 'Up Elbow Two Sides - 2 Hands', category: 'Henna', duration: 150, price: 200 },
  { name: 'Full Leg One Side - 2 Leg', category: 'Henna', duration: 120, price: 200 },
  { name: 'Full Leg Two Sides - 2 Leg', category: 'Henna', duration: 180, price: 300 },
  { name: 'Half Leg One Side - 2 Leg', category: 'Henna', duration: 90, price: 150 },
  { name: 'Half Leg Two Sides - 2 Leg', category: 'Henna', duration: 150, price: 250 },
  { name: 'Up To Ankle - 2 Leg', category: 'Henna', duration: 60, price: 100 },
  { name: 'Classy Feet - 2 Leg', category: 'Henna', duration: 45, price: 80 },
  // MASSAGE AND SPA SERVICES (15)
  { name: 'Full Body Massage - 1/2 Hour', category: 'Massage And Spa', duration: 30, price: 75 },
  { name: 'Full Body Massage - 1 Hour', category: 'Massage And Spa', duration: 60, price: 150 },
  { name: 'Full Body Massage - 90 Mins', category: 'Massage And Spa', duration: 90, price: 200 },
  { name: 'Full Body Stone Massage - 1 Hour', category: 'Massage And Spa', duration: 60, price: 200 },
  { name: 'Full Body Stone Massage - 90 Mins', category: 'Massage And Spa', duration: 90, price: 275 },
  { name: 'Leg Massage - 1/2 Hour', category: 'Massage And Spa', duration: 30, price: 50 },
  { name: 'Leg Massage - 15 Mins', category: 'Massage And Spa', duration: 15, price: 35 },
  { name: 'Back And Neck Massage - 1/2 Hour', category: 'Massage And Spa', duration: 30, price: 50 },
  { name: 'Head And Neck Massage - 1/2 Hour', category: 'Massage And Spa', duration: 30, price: 50 },
  { name: 'Head Massage - 15 Mins', category: 'Massage And Spa', duration: 15, price: 35 },
  { name: 'Moroccan Bath - 1 Hour', category: 'Massage And Spa', duration: 60, price: 150 },
  { name: 'Moroccan Bath - 90 Mins', category: 'Massage And Spa', duration: 90, price: 200 },
  { name: 'Special Moroccan Bath', category: 'Massage And Spa', duration: 120, price: 250 },
  { name: 'Woyba Treatment', category: 'Massage And Spa', duration: 60, price: 150 },
  { name: 'Woyba Treatment With 20 Mins Steam', category: 'Massage And Spa', duration: 80, price: 200 },
];

// Real staff data (excluding admin and super admin)
const realStaffData = [
  { name: 'Tsedey Asefa', email: 'tsedey@habeshasalon.com', phone: '77798124', role: 'Manager', empNo: '9100', qid: '28623000532', passport: 'ep6252678', qidValidity: '01-12-25', passportValidity: '22-11-25', medicalValidity: '01-01-26', dob: '10-05-86', homeService: true },
  { name: 'Mekdes Bekele', email: 'mekdes@habeshasalon.com', phone: '33481527', role: 'Stylist', empNo: '9101', qid: '28623003433', passport: 'EP7832122', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26', dob: '23-02-86', homeService: true },
  { name: 'Aster Bekele', email: 'aster@habeshasalon.com', phone: '33481528', role: 'Stylist', empNo: '9102', qid: '28623003434', passport: 'EP7832123', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26', dob: '15-03-88', homeService: false },
  { name: 'Almaz Tekle', email: 'almaz@habeshasalon.com', phone: '33481529', role: 'Stylist', empNo: '9103', qid: '28623003435', passport: 'EP7832124', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26', dob: '20-07-90', homeService: true },
  { name: 'Hiwot Abebe', email: 'hiwot@habeshasalon.com', phone: '33481530', role: 'Colorist', empNo: '9104', qid: '28623003436', passport: 'EP7832125', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26', dob: '12-09-87', homeService: false },
];

async function resetServicesAndStaff() {
  console.log('🔄 RESETTING SERVICES AND STAFF\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Delete all demo services
    console.log('\n1️⃣  REMOVING DEMO SERVICES');
    const deletedServices = await prisma.service.deleteMany({
      where: { isActive: true }
    });
    console.log(`✅ Deleted ${deletedServices.count} demo services`);
    
    // 2. Seed 144 real services
    console.log('\n2️⃣  SEEDING 144 REAL SERVICES');
    let createdCount = 0;
    
    for (const serviceData of realServiceData) {
      const service = await prisma.service.create({
        data: {
          name: serviceData.name,
          description: `Professional ${serviceData.name.toLowerCase()} service`,
          duration: serviceData.duration,
          price: serviceData.price,
          category: serviceData.category,
          isActive: true,
          showPricesToClients: true,
        }
      });
      createdCount++;
    }
    console.log(`✅ Created ${createdCount} real services`);
    
    // 3. Assign services to all locations
    console.log('\n3️⃣  ASSIGNING SERVICES TO LOCATIONS');
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    });
    const services = await prisma.service.findMany({
      where: { isActive: true }
    });
    
    let assignmentCount = 0;
    for (const service of services) {
      for (const location of locations) {
        await prisma.locationService.upsert({
          where: {
            locationId_serviceId: {
              locationId: location.id,
              serviceId: service.id
            }
          },
          update: { isActive: true },
          create: {
            locationId: location.id,
            serviceId: service.id,
            price: service.price,
            isActive: true
          }
        });
        assignmentCount++;
      }
    }
    console.log(`✅ Created ${assignmentCount} service-location assignments`);
    
    // 4. Remove old staff (except admin and super admin)
    console.log('\n4️⃣  REMOVING OLD STAFF');
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });
    
    const adminIds = adminUsers.map(u => u.id);
    const deletedStaff = await prisma.staffMember.deleteMany({
      where: {
        userId: { notIn: adminIds }
      }
    });
    console.log(`✅ Deleted ${deletedStaff.count} old staff members`);
    
    // 5. Seed new staff
    console.log('\n5️⃣  SEEDING NEW STAFF');
    let staffCount = 0;
    
    for (const staffData of realStaffData) {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: staffData.email }
      });
      
      if (!user) {
        const hashedPassword = await bcrypt.hash('Staff123#', 10);
        user = await prisma.user.create({
          data: {
            email: staffData.email,
            password: hashedPassword,
            role: 'STAFF',
            isActive: true
          }
        });
      }
      
      // Create staff member
      const staff = await prisma.staffMember.create({
        data: {
          userId: user.id,
          name: staffData.name,
          phone: staffData.phone,
          jobRole: staffData.role,
          employeeNumber: staffData.empNo,
          qidNumber: staffData.qid,
          passportNumber: staffData.passport,
          qidValidity: staffData.qidValidity,
          passportValidity: staffData.passportValidity,
          medicalValidity: staffData.medicalValidity,
          homeService: staffData.homeService,
          status: 'ACTIVE',
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }
      });
      staffCount++;
    }
    console.log(`✅ Created ${staffCount} staff members`);
    
    // 6. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ RESET COMPLETE\n');
    console.log('Summary:');
    console.log(`  - Removed: ${deletedServices.count} demo services`);
    console.log(`  - Created: ${createdCount} real services`);
    console.log(`  - Service-Location assignments: ${assignmentCount}`);
    console.log(`  - Removed: ${deletedStaff.count} old staff`);
    console.log(`  - Created: ${staffCount} new staff`);
    console.log(`  - Admin/Super Admin users: PRESERVED`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetServicesAndStaff();

