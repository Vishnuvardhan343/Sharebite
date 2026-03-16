require('dotenv').config({ path: 'd:/mini_proj/backend/.env' });
const mongoose = require('mongoose');
const Pickup = require('./models/Pickup');

async function fixDuplicates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const pickups = await Pickup.find().sort({ createdAt: 1 });
    
    const seenDonations = new Set();
    const dups = [];

    for (const p of pickups) {
      const donId = p.donation.toString();
      if (seenDonations.has(donId)) {
        dups.push(p._id);
      } else {
        seenDonations.add(donId);
      }
    }

    console.log(`Found ${dups.length} duplicate pickups.`);
    if (dups.length > 0) {
      await Pickup.deleteMany({ _id: { $in: dups } });
      console.log('Duplicates deleted successfully.');
    }
    
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
}
fixDuplicates();
