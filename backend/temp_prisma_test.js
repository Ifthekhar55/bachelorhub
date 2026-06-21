require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.communityPost.findMany({ take: 1 })
  .then(result => {
    console.log('SUCCESS', result.length);
    return prisma.$disconnect();
  })
  .catch(err => {
    console.error('PRISMA_ERROR');
    console.error(err);
    prisma.$disconnect().then(() => process.exit(1));
  });
