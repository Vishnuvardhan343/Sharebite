const mongoose = require('mongoose');
require('dotenv').config();
const Donation = require('./models/Donation');

const expireDonations = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Find up to 3 available donations and set their expiry to 1 hour ago
        const donations = await Donation.find({ status: 'available' }).limit(3);
        
        if (donations.length === 0) {
            console.log('No available donations found to expire.');
        } else {
            console.log(`Found ${donations.length} donations to expire.`);
            
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            for (let d of donations) {
                d.expiryTime = oneHourAgo;
                // Force save to trigger pre-save hooks if any, or just update directly
                await d.save();
                console.log(`Expired donation: ${d.foodName}`);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

expireDonations();
