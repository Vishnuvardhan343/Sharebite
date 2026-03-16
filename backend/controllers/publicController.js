const User = require('../models/User');
const Pickup = require('../models/Pickup');

// @route  GET /api/public/stats
const getPublicStats = async (req, res) => {
  try {
    const mealsSaved = await Pickup.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$mealsDelivered' } } },
    ]);

    // Include isActive: true if that exists, or just role
    const activeDonors = await User.countDocuments({ role: 'donor' });
    const ngoPartners = await User.countDocuments({ role: 'ngo' });
    const volunteers = await User.countDocuments({ role: 'volunteer' });

    res.json({
      success: true,
      stats: {
        mealsSaved: mealsSaved[0]?.total || 0,
        activeDonors,
        ngoPartners,
        volunteers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPublicStats };
