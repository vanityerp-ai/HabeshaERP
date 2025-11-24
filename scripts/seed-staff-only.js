const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Real staff data (excluding admin and super admin)
const realStaffData = [
  { name: 'Tsedey Asefa', email: 'tsedey@habeshasalon.com', phone: '77798124', role: 'Manager', empNo: '9100', qid: '28623000532', passport: 'ep6252678', qidValidity: '01-12-25', passportValidity: '22-11-25', medicalValidity: '01-01-26', dob: '10-05-86', homeService: true },
  { name: 'Mekdes Bekele', email: 'mekdes@habeshasalon.com', phone: '33481527', role: 'Stylist', empNo: '9101', qid: '28623003433', passport: 'EP7832122', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26', dob: '23-02-86', homeService: true },
  { name: 'Aster Bekele', email: 'aster@habeshasalon.com', phone: '33481528', role: 'Stylist', empNo: '9102', qid: '28623003434', passport: 'EP7832123', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26', dob: '15-03-88', homeService: false },
  { name: 'Almaz Tekle', email: 'almaz@habeshasalon.com', phone: '33481529', role: 'Stylist', empNo: '9103', qid: '28623003435', passport: 'EP7832124', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26', dob: '20-07-90', homeService: true },
  { name: 'Hiwot Abebe', email: 'hiwot@habeshasalon.com', phone: '33481530', role: 'Colorist', empNo: '9104', qid: '28623003436', passport: 'EP7832125', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26', dob: '12-09-87', homeService: false },
];

async function seedStaff() {
  console.log('🌱 SEEDING STAFF MEMBERS\n');
  console.log('='.repeat(60));
  
  try {
    let staffCount = 0;
    
    for (const staffData of realStaffData) {
      console.log(`\nProcessing: ${staffData.name}`);
      
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
        console.log(`  ✅ Created user: ${staffData.email}`);
      } else {
        console.log(`  ⏭️  User already exists: ${staffData.email}`);
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
      console.log(`  ✅ Created staff member: ${staffData.name}`);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ STAFF SEEDING COMPLETE\n');
    console.log(`Created ${staffCount} staff members`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedStaff();

