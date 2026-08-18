const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // ลบข้อมูลการจองทั้งหมดก่อน (เพราะเป็น Foreign Key)
    const deletedAppointments = await prisma.appointment.deleteMany({});
    // ลบข้อมูลลูกค้า
    const deletedLeads = await prisma.lead.deleteMany({});

    console.log(`Deleted ${deletedAppointments.count} appointments.`);
    console.log(`Deleted ${deletedLeads.count} leads.`);
    console.log('✅ ล้างข้อมูลขยะจากการทดสอบทั้งหมดเรียบร้อยแล้ว!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
