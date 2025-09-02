const axios = require('axios');

async function testRegistration() {
  const testData = {
    name: `TestUser${Date.now()}`, // Unique name to avoid conflicts
    email: `test${Date.now()}@example.com`, // Unique email
    password: 'password123',
    phone: '1234567890',
    ssn: '123-45-6789',
    usertype: 'patient'
  };

  try {
    console.log('Testing registration with data:', testData);
    
    const response = await axios.post('http://localhost:4000/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Registration failed!');
    console.log('Error status:', error.response?.status);
    console.log('Error data:', error.response?.data);
    console.log('Error message:', error.message);
  }
}

testRegistration();
