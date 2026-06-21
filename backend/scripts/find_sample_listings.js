const { PrismaClient } = require('@prisma/client');

;(async () => {
  const prisma = new PrismaClient();
  try {
    const matches = await prisma.listing.findMany({
      where: {
        OR: [
          { title: { contains: 'test', mode: 'insensitive' } },
          { title: { contains: 'sample', mode: 'insensitive' } },
          { title: { contains: 'mock', mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, createdAt: true },
    });
    console.log('Matches:', matches.length);
    console.table(matches);
  } catch (e) {
    console.error('Error querying listings:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
