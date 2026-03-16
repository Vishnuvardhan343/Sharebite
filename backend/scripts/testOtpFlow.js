const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testFlow = async () => {
  const timestamp = Date.now();
  const testEmail = `testuser_${timestamp}@example.com`;
  const userData = {
    name: 'Test User',
    email: testEmail,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    role: 'donor',
    phone: '1234567890',
    address: 'Test Address'
  };

  try {
    console.log('1. Registering user...');
    const regRes = await axios.post(`${BASE_URL}/auth/register`, userData);
    console.log('Registration Success:', regRes.data.message);

    // In a real scenario, we'd check the OTP in the console/email.
    // For this test script, we might need a way to bypass or read from DB.
    // But we can test wrong OTP directly.

    console.log('\n2. Verifying with wrong OTP...');
    try {
      await axios.post(`${BASE_URL}/auth/verify-email-otp`, {
        email: testEmail,
        otp: '000000'
      });
    } catch (err) {
      console.log('Wrong OTP correctly rejected:', err.response.data.message);
    }

    console.log('\n3. Testing resend OTP...');
    const resendRes = await axios.post(`${BASE_URL}/auth/resend-email-otp`, {
      email: testEmail
    });
    console.log('Resend Success:', resendRes.data.message);

    console.log('\nNote: To test successful verification, please check the backend console for the printed OTP and run a manual verify call.');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
};

testFlow();
