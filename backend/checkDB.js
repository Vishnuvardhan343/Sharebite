require('dotenv').config({ path: 'd:/mini_proj/backend/.env' });
const mongoose = require('mongoose');
const fs = require('fs');
const Donation = require('./models/Donation');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const donations = await Donation.find().sort({ createdAt: -1 }).limit(3).lean();
    
    fs.writeFileSync('db_output.json', JSON.stringify(donations, null, 2));
    console.log("Written to db_output.json");
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}
checkDB();
