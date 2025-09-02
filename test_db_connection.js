const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const userCount = await prisma.users.count();
    console.log(`✅ Database query successful! Found ${userCount} users.`);
    
    // Test creating a user
    const testUser = await prisma.users.create({
      data: {
        name: `TestUser${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        password: 'hashedpassword',
        usertype: 'patient'
      }
    });
    console.log('✅ User creation successful!', testUser);
    
    // Clean up - delete the test user
    await prisma.users.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Test user deleted successfully!');
    
  } catch (error) {
    console.log('❌ Database connection failed!');
    console.log('Error:', error.message);
    console.log('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
