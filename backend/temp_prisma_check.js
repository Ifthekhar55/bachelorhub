require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const messages = await prisma.message.findMany({ take: 20 });
    console.log('message count:', messages.length);
    console.log(JSON.stringify(messages.slice(0, 5), null, 2));

    const convs = await prisma.conversation.findMany({ take: 20 });
    console.log('conversation count:', convs.length);
    console.log(JSON.stringify(convs.slice(0, 5), null, 2));
  } catch (error) {
    console.error('ERROR', error);
  } finally {
    await prisma.$disconnect();
  }
})();
