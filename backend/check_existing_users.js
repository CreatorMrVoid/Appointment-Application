const { PrismaClient } = require('@prisma/client');

async function checkExistingUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking existing users in database...');
    
    const users = await prisma.users.findMany({
      select: { id: true, name: true, email: true, ssn: true, usertype: true }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, SSN: ${user.ssn}, Type: ${user.usertype}`);
    });
    
    // Check for duplicate names or emails
    const names = users.map(u => u.name);
    const emails = users.map(u => u.email);
    
    const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicateNames.length > 0) {
      console.log('⚠️  Duplicate names found:', duplicateNames);
    }
    
    if (duplicateEmails.length > 0) {
      console.log('⚠️  Duplicate emails found:', duplicateEmails);
    }
    
  } catch (error) {
    console.log('❌ Error checking users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingUsers();
