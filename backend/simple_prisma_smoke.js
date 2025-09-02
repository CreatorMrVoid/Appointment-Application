require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    console.log('DB ok:', result);
    process.exit(0);
  } catch (e) {
    console.error('DB error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


