#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

console.log('🚀 IMPORTING STAFF TO NEON DATABASE\n');
console.log('='.repeat(60));

const neonPrisma = new PrismaClient();

// Real staff data (22 staff members)
const realStaffData = [
  { empNo: '9101', name: 'Mekdes Bekele', email: 'mekdes@habeshasalon.com', phone: '33481527', role: 'Stylist', locations: ['loc1'], homeService: true, qid: '28623003433', passport: 'EP7832122', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9102', name: 'Aster Tarekegn', email: 'aster@habeshasalon.com', phone: '66868083', role: 'Stylist', locations: ['loc1'], homeService: true, qid: '29023002985', passport: 'EP6586158', qidValidity: '26-08-26', passportValidity: '13-07-26', medicalValidity: '01-01-26' },
  { empNo: '9103', name: 'Gelila Asrat', email: 'gelila@habeshasalon.com', phone: '77798125', role: 'Nail Artist', locations: ['loc1'], homeService: true, qid: '28623003434', passport: 'EP7832123', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9104', name: 'Samrawit Tufa', email: 'samrawit@habeshasalon.com', phone: '33481528', role: 'Nail Artist', locations: ['loc1'], homeService: true, qid: '28623003435', passport: 'EP7832124', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9105', name: 'Vida Agbali', email: 'vida@habeshasalon.com', phone: '66868084', role: 'Stylist', locations: ['loc1'], homeService: true, qid: '28623003436', passport: 'EP7832125', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9106', name: 'Genet Yifru', email: 'genet@habeshasalon.com', phone: '77798126', role: 'Pedicurist', locations: ['loc1'], homeService: true, qid: '28623003437', passport: 'EP7832126', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9107', name: 'Woynshet Tilahun', email: 'woynshet@habeshasalon.com', phone: '33481529', role: 'Stylist', locations: ['loc3'], homeService: true, qid: '28623003438', passport: 'EP7832127', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9108', name: 'Habtamua Wana', email: 'habtamua@habeshasalon.com', phone: '66868085', role: 'Stylist', locations: ['loc3'], homeService: true, qid: '28623003439', passport: 'EP7832128', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9109', name: 'Yerusalem Hameso', email: 'yerusalem@habeshasalon.com', phone: '77798127', role: 'Stylist', locations: ['loc3'], homeService: true, qid: '28623003440', passport: 'EP7832129', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9110', name: 'Bethlehem', email: 'bethlehem@habeshasalon.com', phone: '33481530', role: 'Stylist', locations: ['loc3'], homeService: true, qid: '28623003441', passport: 'EP7832130', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9111', name: 'Haymanot Tadesse', email: 'haymanot@habeshasalon.com', phone: '66868086', role: 'Beautician', locations: ['loc2'], homeService: true, qid: '28623003442', passport: 'EP7832131', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9112', name: 'Elsabeth Melaku', email: 'elsabeth@habeshasalon.com', phone: '77798128', role: 'Stylist', locations: ['loc2'], homeService: true, qid: '28623003443', passport: 'EP7832132', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9113', name: 'Tirhas Leakemaryam', email: 'tirhas@habeshasalon.com', phone: '33481531', role: 'Stylist', locations: ['loc2'], homeService: true, qid: '28623003444', passport: 'EP7832133', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9114', name: 'Etifwork Aschalew', email: 'etifwork@habeshasalon.com', phone: '66868087', role: 'Beautician', locations: ['loc2'], homeService: true, qid: '28623003445', passport: 'EP7832134', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9115', name: 'Hintsa Gebrezgi', email: 'hintsa@habeshasalon.com', phone: '77798129', role: 'Stylist', locations: ['loc2'], homeService: true, qid: '28623003446', passport: 'EP7832135', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9116', name: 'Maya Tekle', email: 'maya@habeshasalon.com', phone: '33481532', role: 'Stylist', locations: ['loc2'], homeService: true, qid: '28623003447', passport: 'EP7832136', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9117', name: 'Hiwot Abebe', email: 'hiwot@habeshasalon.com', phone: '66868088', role: 'Stylist', locations: ['loc2'], homeService: true, qid: '28623003448', passport: 'EP7832137', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9118', name: 'Hintsa Gebrezgi', email: 'hintsa2@habeshasalon.com', phone: '77798130', role: 'Stylist', locations: ['loc2'], homeService: true, qid: '28623003449', passport: 'EP7832138', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9119', name: 'Tirhas Tajebe', email: 'tirhas2@habeshasalon.com', phone: '33481533', role: 'Nail Artist', locations: ['loc2'], homeService: true, qid: '382025419997', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9120', name: 'Tsigereda Esayas', email: 'tsigereda@habeshasalon.com', phone: '55849079', role: 'Stylist', locations: ['loc2'], homeService: true, qid: '382024482060', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9121', name: 'Siyamili Kuna', email: 'shalom@habeshasalon.com', phone: '551011295', role: 'Beautician', locations: ['loc2'], homeService: true, qid: '29135634320', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9122', name: 'Samrawit Legese', email: 'samrawit2@habeshasalon.com', phone: '33462505', role: 'Sales', locations: ['online'], homeService: true, qid: '', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' }
];

async function importStaff() {
  try {
    console.log('\n1️⃣  Testing Neon connection...');
    await neonPrisma.$queryRaw`SELECT 1`;
    console.log('✅ Neon connection successful');

    console.log('\n2️⃣  IMPORTING STAFF MEMBERS...');
    let staffCreated = 0;
    let staffSkipped = 0;

    for (const staff of realStaffData) {
      try {
        // Check if user already exists
        const existingUser = await neonPrisma.user.findUnique({
          where: { email: staff.email }
        });

        if (existingUser) {
          staffSkipped++;
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('Staff123#', 10);

        // Create user
        const user = await neonPrisma.user.create({
          data: {
            email: staff.email,
            password: hashedPassword,
            role: 'STAFF',
            isActive: true
          }
        });

        // Create staff member
        await neonPrisma.staffMember.create({
          data: {
            userId: user.id,
            name: staff.name,
            phone: staff.phone,
            jobRole: staff.role,
            homeService: staff.homeService,
            status: 'ACTIVE',
            employeeNumber: staff.empNo,
            qidNumber: staff.qid || null,
            passportNumber: staff.passport || null,
            qidValidity: staff.qidValidity || null,
            passportValidity: staff.passportValidity || null,
            medicalValidity: staff.medicalValidity || null
          }
        });

        staffCreated++;
      } catch (error) {
        console.error(`   ❌ Error creating ${staff.name}: ${error.message}`);
        staffSkipped++;
      }
    }

    console.log(`✅ Created ${staffCreated} staff members`);
    console.log(`⏭️  Skipped ${staffSkipped} staff members (already exist)`);

    // Verify final count
    console.log('\n3️⃣  FINAL VERIFICATION...');
    const finalStaffCount = await neonPrisma.staffMember.count();
    const finalUserCount = await neonPrisma.user.count();
    
    console.log(`   Staff Members: ${finalStaffCount}`);
    console.log(`   Users: ${finalUserCount}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ STAFF IMPORT COMPLETE!\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await neonPrisma.$disconnect();
  }
}

importStaff();

