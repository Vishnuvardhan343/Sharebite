async function testAuth() {
  try {
    // 1. Register new user
    console.log('--- Registering ---');
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Fixed NGO',
        email: 'fixedngo@example.com',
        password: 'password123',
        role: 'ngo',
        phone: '9999999999',
        address: 'Test City',
        organisation: 'NGO Inc Fixed'
      })
    });
    const regData = await regRes.json();
    console.log('Register:', regData.success, regData.message || '');

    // 2. Login as the same user
    console.log('--- Logging In ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'fixedngo@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData.success, loginData.message || '');
    if (loginData.token) {
        console.log('Token Received:', loginData.token.substring(0, 20) + '...');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();
