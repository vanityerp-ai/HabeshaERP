const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Real staff data from the provided list (excluding manager Tsedey)
const realStaffData = [
  { empNo: '9101', nickname: 'Mekdes', name: 'Mekdes Bekele', dob: '23-02-86', email: 'mekdes@habeshasalon.com', phone: '33481527', role: 'Stylist', locations: ['D-Ring Road'], status: 'Active', homeService: true, qid: '28623003433', passport: 'EP7832122', qidValidity: '01-12-25', passportValidity: '24-05-28', medicalValidity: '01-01-26' },
  { empNo: '9102', nickname: 'Aster', name: 'Aster Tarekegn', dob: '04-09-90', email: 'aster@habeshasalon.com', phone: '66868083', role: 'Stylist', locations: ['D-Ring Road'], status: 'Active', homeService: true, qid: '29023002985', passport: 'EP6586158', qidValidity: '26-08-26', passportValidity: '13-07-26', medicalValidity: '01-01-26' },
  { empNo: '9103', nickname: 'Gelila', name: 'Gelila Asrat', dob: '28-01-00', email: 'gelila@habeshasalon.com', phone: '51101385', role: 'Nail Artist', locations: ['D-Ring Road'], status: 'Active', homeService: true, qid: '30023001427', passport: 'EQ2036945', qidValidity: '07-05-26', passportValidity: '17-02-30', medicalValidity: '01-01-26' },
  { empNo: '9104', nickname: 'Samri', name: 'Samrawit Tufa', dob: '07-08-94', email: 'samri@habeshasalon.com', phone: '50579597', role: 'Nail Artist', locations: ['D-Ring Road'], status: 'Active', homeService: true, qid: '29423002678', passport: 'EP6949093', qidValidity: '21-01-26', passportValidity: '08-03-27', medicalValidity: '01-01-26' },
  { empNo: '9105', nickname: 'Vida', name: 'Vida Agbali', dob: '25-10-92', email: 'Vida@habeshasalon.com', phone: '31407033', role: 'Stylist', locations: ['D-Ring Road'], status: 'Active', homeService: true, qid: '29228801597', passport: 'G2323959', qidValidity: '21-04-26', passportValidity: '21-01-31', medicalValidity: '01-01-26' },
  { empNo: '9106', nickname: 'Genet', name: 'Genet Yifru', dob: '19-07-80', email: 'genet@habeshasalon.com', phone: '50085617', role: 'Pedecurist', locations: ['D-Ring Road'], status: 'Active', homeService: true, qid: '28023003513', passport: 'EP7405867', qidValidity: '25-02-26', passportValidity: '13-12-27', medicalValidity: '01-01-26' },
  { empNo: '9107', nickname: 'Woyni', name: 'Woynshet Tilahun', dob: '12-07-87', email: 'Woyni@habeshasalon.com', phone: '33378522', role: 'Stylist', locations: ['Medinat Khalifa'], status: 'Active', homeService: true, qid: '28723005500', passport: 'EP', qidValidity: '17-09-25', passportValidity: '20-10-27', medicalValidity: '01-01-26' },
  { empNo: '9108', nickname: 'Habtam', name: 'Habtamua Wana', dob: '20-09-89', email: 'habtam@habeshasalon.com', phone: '59996537', role: 'Stylist', locations: ['Medinat Khalifa'], status: 'Active', homeService: true, qid: '28923005645', passport: 'EP6217793', qidValidity: '25-02-26', passportValidity: '18-10-25', medicalValidity: '01-01-26' },
  { empNo: '9109', nickname: 'Jeri', name: 'Yerusalem Hameso', dob: '20-10-90', email: 'Jeri@habeshasalon.com', phone: '70365925', role: 'Stylist', locations: ['Medinat Khalifa'], status: 'Active', homeService: true, qid: '29023004807', passport: 'EP8743913', qidValidity: '09-07-25', passportValidity: '17-03-29', medicalValidity: '01-01-26' },
  { empNo: '9110', nickname: 'Beti-Mk', name: 'Bethlehem', dob: '', email: 'beti@habeshasalon.com', phone: '66830977', role: 'Stylist', locations: ['Medinat Khalifa'], status: 'Active', homeService: true, qid: '', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9111', nickname: 'Ruth', name: 'Haymanot Tadesse', dob: '18-07-89', email: 'Ruth@habeshasalon.com', phone: '50227010', role: 'Beautician', locations: ['Muaither'], status: 'Active', homeService: false, qid: '28923005561', passport: 'EP6757286', qidValidity: '28-02-26', passportValidity: '22-10-26', medicalValidity: '01-01-26' },
  { empNo: '9112', nickname: 'Elsa', name: 'Elsabeth Melaku', dob: '10-11-79', email: 'Elsa@habeshasalon.com', phone: '50104456', role: 'Stylist and Nail technician', locations: ['Muaither'], status: 'Active', homeService: false, qid: '27923002347', passport: 'EP7085203', qidValidity: '11-07-27', passportValidity: '19-06-27', medicalValidity: '01-01-26' },
  { empNo: '9113', nickname: 'Titi', name: 'Tirhas Leakemaryam', dob: '09-10-87', email: 'Titi@habeshasalon.com', phone: '59991432', role: 'Stylist', locations: ['Muaither'], status: 'Active', homeService: true, qid: '28723007773', passport: 'EP6197364', qidValidity: '13-03-26', passportValidity: '19-08-25', medicalValidity: '01-01-26' },
  { empNo: '9114', nickname: 'Yenu', name: 'Etifwork Aschalew', dob: '22-02-80', email: 'Yenu@habeshasalon.com', phone: '30614686', role: 'Beautician', locations: ['Muaither'], status: 'Active', homeService: false, qid: '28023003515', passport: 'EP7979493', qidValidity: '14-05-26', passportValidity: '01-04-28', medicalValidity: '01-01-26' },
  { empNo: '9115', nickname: 'Frie', name: 'Frehiwot Bahru', dob: '29-01-91', email: 'frie@habeshasalon.com', phone: '51179966', role: 'Beautician', locations: ['Muaither'], status: 'Active', homeService: true, qid: '29123003741', passport: 'EP7212333', qidValidity: '15-01-26', passportValidity: '17-07-27', medicalValidity: '01-01-26' },
  { empNo: '9116', nickname: 'Zed', name: 'Zewdu Teklay', dob: '16-05-95', email: 'zed@habeshasalon.com', phone: '50764570', role: 'Stylist', locations: ['Muaither'], status: 'Active', homeService: true, qid: '29523002064', passport: 'EP8133993', qidValidity: '12-10-25', passportValidity: '07-10-28', medicalValidity: '01-01-26' },
  { empNo: '9117', nickname: 'Beti', name: 'Zufan Thomas', dob: '12-09-91', email: 'beti@habeshasalon.com', phone: '30732501', role: 'Stylist', locations: ['Muaither'], status: 'Active', homeService: true, qid: '29123002832', passport: 'EP6689476', qidValidity: '02-05-26', passportValidity: '13-09-26', medicalValidity: '01-01-26' },
  { empNo: '9118', nickname: 'Maya', name: 'Hintsa Gebrezgi', dob: '', email: 'maya@habeshasalon.com', phone: '51337449', role: 'Stylist', locations: ['Muaither'], status: 'Active', homeService: true, qid: '222025002506', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9119', nickname: 'Tirhas', name: 'Tirhas Tajebe', dob: '', email: 'tirhas@habeshasalon.com', phone: '', role: 'Nail Artist', locations: ['Muaither'], status: 'Active', homeService: true, qid: '382025419997', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9120', nickname: 'Tsigereda', name: 'Tsigereda Esayas', dob: '', email: 'tsigereda@habeshasalon.com', phone: '55849079', role: 'Stylist', locations: ['Muaither'], status: 'Active', homeService: true, qid: '382024482060', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9121', nickname: 'Shalom', name: 'Siyamili Kuna', dob: '', email: 'shalom@habeshasalon.com', phone: '551011295', role: 'Beautician', locations: ['Muaither'], status: 'Active', homeService: true, qid: '29135634320', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
  { empNo: '9122', nickname: 'Samrawit', name: 'Samrawit Legese', dob: '', email: 'samrawit@habeshasalon.com', phone: '33462505', role: 'Sales', locations: ['Online store'], status: 'Active', homeService: true, qid: '', passport: '', qidValidity: '', passportValidity: '', medicalValidity: '01-01-26' },
];

async function importRealStaff() {
  console.log('🌱 IMPORTING REAL STAFF DATA\n');
  console.log('='.repeat(60));
  
  try {
    // Delete all non-manager staff
    console.log('\n1️⃣  REMOVING OLD STAFF (except manager)');
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
      console.log(`\nProcessing: ${staffData.name} (${staffData.empNo})`);
      
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
        console.log(`  ✅ Created user`);
      } else {
        console.log(`  ℹ️  User exists`);
      }
      
      // Create staff member
      const staff = await prisma.staffMember.create({
        data: {
          userId: user.id,
          name: staffData.name,
          phone: staffData.phone,
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
      console.log(`  ✅ Created staff member`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ IMPORT COMPLETE\n');
    console.log(`Created: ${createdCount} staff members`);
    console.log(`Manager preserved: Tsedey Asefa (9100)`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importRealStaff();

