const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Donation = require('../models/Donation');
const Pickup = require('../models/Pickup');

async function fixStats() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    // 1. Fix Pickups where mealsDelivered is 0 but status is 'delivered'
    console.log('Checking for delivered pickups with 0 meals...');
    const pickupsToFix = await Pickup.find({ status: 'delivered', mealsDelivered: 0 }).populate('donation');
    console.log(`Found ${pickupsToFix.length} pickups to fix.`);

    for (const p of pickupsToFix) {
      if (p.donation) {
        const meals = p.donation.estimatedMeals || 0;
        p.mealsDelivered = meals;
        await p.save();
        console.log(`Updated pickup ${p._id} with ${meals} meals.`);
      }
    }

    // 2. Fix expired donations that were assigned but not marked failed
    console.log('Checking for expired donations with active pickups...');
    const expiredDonations = await Donation.find({ status: 'expired' });
    for (const d of expiredDonations) {
      const activePickup = await Pickup.findOneAndUpdate(
        { donation: d._id, status: { $in: ['accepted', 'pending', 'in-transit'] } },
        { status: 'failed', notes: 'Corrected: Expired before delivery' }
      );
      if (activePickup) {
        console.log(`Marked pickup ${activePickup._id} as failed (associated donation ${d._id} was expired).`);
      }
    }

    // 3. Recalculate User Stats
    console.log('Recalculating volunteer stats...');
    const volunteers = await User.find({ role: { $in: ['volunteer', 'ngo'] } });
    for (const v of volunteers) {
      const stats = await Pickup.aggregate([
        { $match: { volunteer: v._id, status: 'delivered' } },
        { $group: { _id: null, total: { $sum: 1 }, meals: { $sum: '$mealsDelivered' } } }
      ]);

      const totalPickups = stats[0]?.total || 0;
      const mealsContributed = stats[0]?.meals || 0;

      v.totalPickups = totalPickups;
      v.mealsContributed = mealsContributed;
      await v.save();
      console.log(`Updated user ${v.name}: ${totalPickups} pickups, ${mealsContributed} meals.`);
    }

    console.log('Correction complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixStats();
