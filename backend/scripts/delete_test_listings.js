const { PrismaClient } = require('@prisma/client');

;(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.listing.deleteMany({ where: { title: 'Test Listing' } });
    console.log('Deleted count:', res.count);
  } catch (e) {
    console.error('Error deleting listings:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
