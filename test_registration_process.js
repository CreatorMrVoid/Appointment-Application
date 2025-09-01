const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function testRegistrationProcess() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing registration process step by step...');
    
    // Step 1: Test Prisma import
    console.log('✅ Prisma client imported successfully');
    
    // Step 2: Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Step 3: Test password hashing
    const password = 'password123';
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('✅ Password hashing successful');
    
    // Step 4: Test checking for existing user
    const testEmail = `test${Date.now()}@example.com`;
    const existing = await prisma.users.findUnique({ where: { email: testEmail } });
    console.log('✅ User existence check successful');
    
    // Step 5: Test user creation with proper SSN format (11 characters max)
    const user = await prisma.users.create({
      data: {
        name: `TestUser${Date.now()}`,
        email: testEmail,
        password: hashedPassword,
        phone: '1234567890',
        ssn: '12345678901', // Exactly 11 characters, no hyphens
        usertype: 'patient',
      },
      select: { id: true, name: true, email: true, phone: true, ssn: true, usertype: true, created_at: true }
    });
    console.log('✅ User creation successful!', user);
    
    // Clean up
    await prisma.users.delete({ where: { id: user.id } });
    console.log('✅ Test user deleted successfully!');
    
  } catch (error) {
    console.log('❌ Registration process failed!');
    console.log('Error:', error.message);
    console.log('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistrationProcess();
