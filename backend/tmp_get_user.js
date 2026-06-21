const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('no-user');
      return;
    }
    console.log(JSON.stringify({ id: user.id, email: user.email, phone: user.phone }));
  } catch (err) {
    console.error('ERR', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
