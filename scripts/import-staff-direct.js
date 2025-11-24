const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use non-pooling connection for migrations
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL
    }
  }
});

// Real staff data (22 staff members, excluding manager Tsedey)
const realStaffData = [
  { empNo: '9101', name: 'Mekdes Bekele', email: 'mekdes@habeshasalon.com', phone: '33481527', role: 'Stylist', homeService: true, qid: '28623003433', passport: 'EP7832122', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9102', name: 'Aster Tarekegn', email: 'aster@habeshasalon.com', phone: '66868083', role: 'Stylist', homeService: true, qid: '29023002985', passport: 'EP6586158', qidValidity: '26-08-26', passportValidity: '13-07-26', medicalValidity: '01-01-26' },
  { empNo: '9103', name: 'Gelila Asrat', email: 'gelila@habeshasalon.com', phone: '51101385', role: 'Nail Artist', homeService: true, qid: '30023001427', passport: 'EQ2036945', qidValidity: '07-05-26', passportValidity: '17-02-30', medicalValidity: '01-01-26' },
  { empNo: '9104', name: 'Samrawit Tufa', email: 'samri@habeshasalon.com', phone: '50579597', role: 'Nail Artist', homeService: true, qid: '29423002678', passport: 'EP6949093', qidValidity: '21-01-26', passportValidity: '08-03-27', medicalValidity: '01-01-26' },
  { empNo: '9105', name: 'Vida Agbali', email: 'Vida@habeshasalon.com', phone: '31407033', role: 'Stylist', homeService: true, qid: '29228801597', passport: 'G2323959', qidValidity: '21-04-26', passportValidity: '21-01-31', medicalValidity: '01-01-26' },
  { empNo: '9106', name: 'Genet Yifru', email: 'genet@habeshasalon.com', phone: '50085617', role: 'Pedecurist', homeService: true, qid: '28023003513', passport: 'EP7405867', qidValidity: '25-02-26', passportValidity: '13-12-27', medicalValidity: '01-01-26' },
  { empNo: '9107', name: 'Woynshet Tilahun', email: 'Woyni@habeshasalon.com', phone: '33378522', role: 'Stylist', homeService: true, qid: '28723005500', passport: 'EP', qidValidity: '17-09-25', passportValidity: '20-10-27', medicalValidity: '01-01-26' },
  { empNo: '9108', name: 'Habtamua Wana', email: 'habtam@habeshasalon.com', phone: '59996537', role: 'Stylist', homeService: true, qid: '28923005645', passport: 'EP6217793', qidValidity: '25-02-26', passportValidity: '18-10-25', medicalValidity: '01-01-26' },
  { empNo: '9109', name: 'Yerusalem Hameso', email: 'Jeri@habeshasalon.com', phone: '70365925', role: 'Stylist', homeService: true, qid: '29023004807', passport: 'EP8743913', qidValidity: '09-07-25', passportValidity: '17-03-29', medicalValidity: '01-01-26' },
  { empNo: '9110', name: 'Bethlehem', email: 'beti@habeshasalon.com', phone: '66830977', role: 'Stylist', homeService: true, qid: '', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9111', name: 'Haymanot Tadesse', email: 'Ruth@habeshasalon.com', phone: '50227010', role: 'Beautician', homeService: false, qid: '28923005561', passport: 'EP6757286', qidValidity: '28-02-26', passportValidity: '22-10-26', medicalValidity: '01-01-26' },
  { empNo: '9112', name: 'Elsabeth Melaku', email: 'Elsa@habeshasalon.com', phone: '50104456', role: 'Stylist and Nail technician', homeService: false, qid: '27923002347', passport: 'EP7085203', qidValidity: '11-07-27', passportValidity: '19-06-27', medicalValidity: '01-01-26' },
  { empNo: '9113', name: 'Tirhas Leakemaryam', email: 'Titi@habeshasalon.com', phone: '59991432', role: 'Stylist', homeService: true, qid: '28723007773', passport: 'EP6197364', qidValidity: '13-03-26', passportValidity: '19-08-25', medicalValidity: '01-01-26' },
  { empNo: '9114', name: 'Etifwork Aschalew', email: 'Yenu@habeshasalon.com', phone: '30614686', role: 'Beautician', homeService: false, qid: '28023003515', passport: 'EP7979493', qidValidity: '14-05-26', passportValidity: '01-04-28', medicalValidity: '01-01-26' },
  { empNo: '9115', name: 'Frehiwot Bahru', email: 'frie@habeshasalon.com', phone: '51179966', role: 'Beautician', homeService: true, qid: '29123003741', passport: 'EP7212333', qidValidity: '15-01-26', passportValidity: '17-07-27', medicalValidity: '01-01-26' },
  { empNo: '9116', name: 'Zewdu Teklay', email: 'zed@habeshasalon.com', phone: '50764570', role: 'Stylist', homeService: true, qid: '29523002064', passport: 'EP8133993', qidValidity: '12-10-25', passportValidity: '07-10-28', medicalValidity: '01-01-26' },
  { empNo: '9117', name: 'Zufan Thomas', email: 'beti@habeshasalon.com', phone: '30732501', role: 'Stylist', homeService: true, qid: '29123002832', passport: 'EP6689476', qidValidity: '02-05-26', passportValidity: '13-09-26', medicalValidity: '01-01-26' },
  { empNo: '9118', name: 'Hintsa Gebrezgi', email: 'maya@habeshasalon.com', phone: '51337449', role: 'Stylist', homeService: true, qid: '222025002506', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9119', name: 'Tirhas Tajebe', email: 'tirhas@habeshasalon.com', phone: '', role: 'Nail Artist', homeService: true, qid: '382025419997', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9120', name: 'Tsigereda Esayas', email: 'tsigereda@habeshasalon.com', phone: '55849079', role: 'Stylist', homeService: true, qid: '382024482060', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9121', name: 'Siyamili Kuna', email: 'shalom@habeshasalon.com', phone: '551011295', role: 'Beautician', homeService: true, qid: '29135634320', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9122', name: 'Samrawit Legese', email: 'samrawit@habeshasalon.com', phone: '33462505', role: 'Sales', homeService: true, qid: '', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
];

async function importStaff() {
  console.log('🌱 IMPORTING REAL STAFF DATA\n');
  console.log('='.repeat(60));
  
  try {
    // Delete all non-manager staff
    console.log('\n1️⃣  REMOVING OLD STAFF (except manager 9100)');
    const deleted = await prisma.staffMember.deleteMany({
      where: {
        employeeNumber: { notIn: ['9100'] }
      }
    });
    console.log(`✅ Deleted ${deleted.count} old staff members`);
    
    // Import new staff
    console.log('\n2️⃣  IMPORTING NEW STAFF');
    let createdCount = 0;
    
    for (const staffData of realStaffData) {
      // Create or get user
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
      await prisma.staffMember.create({
        data: {
          userId: user.id,
          name: staffData.name,
          phone: staffData.phone || '',
          jobRole: staffData.role,
          employeeNumber: staffData.empNo,
          qidNumber: staffData.qid || null,
          passportNumber: staffData.passport || null,
          qidValidity: staffData.qidValidity || null,
          passportValidity: staffData.passportValidity || null,
          medicalValidity: staffData.medicalValidity || null,
          homeService: staffData.homeService,
          status: 'ACTIVE',
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }
      });
      
      createdCount++;
      console.log(`  ✅ ${staffData.empNo}: ${staffData.name}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ IMPORT COMPLETE\n');
    console.log(`Created: ${createdCount} staff members`);
    console.log(`Manager (9100) preserved`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importStaff();

