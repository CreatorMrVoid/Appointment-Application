const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function simpleTest() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing simple user creation...');
    
    const password = 'password123';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const testEmail = `test${Date.now()}@example.com`;
    const testName = `TestUser${Date.now()}`;
    
    const user = await prisma.users.create({
      data: {
        name: testName,
        email: testEmail,
        password: hashedPassword,
        usertype: 'patient',
        // Don't include SSN or phone for now
      },
      select: { id: true, name: true, email: true, usertype: true, created_at: true }
    });
    
    console.log('✅ User creation successful!', user);
    
    // Clean up
    await prisma.users.delete({ where: { id: user.id } });
    console.log('✅ Test user deleted successfully!');
    
  } catch (error) {
    console.log('❌ User creation failed!');
    console.log('Error:', error.message);
    console.log('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleTest();
