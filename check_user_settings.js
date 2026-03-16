const mongoose = require('mongoose');
const User = require('./backend/models/User');
require('dotenv').config({ path: './backend/.env' });

async function checkUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'shivasoleti2023@gmail.com' });
  console.log(JSON.stringify(user, null, 2));
  await mongoose.disconnect();
}

checkUser();
