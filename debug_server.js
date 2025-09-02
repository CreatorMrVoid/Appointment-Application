require('dotenv').config();

async function startServer() {
  try {
    console.log('Starting server...');
    console.log('Environment variables loaded');
    
    // Test database connection first
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    await prisma.$disconnect();
    
    // Now try to start the server
    console.log('Importing app...');
    const app = require('./dist/app.js').default;
    
    console.log('Starting Express server...');
    const PORT = process.env.PORT || 4000;
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
    
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
    
  } catch (error) {
    console.error('❌ Startup error:', error);
    console.error('Error stack:', error.stack);
  }
}

startServer();
