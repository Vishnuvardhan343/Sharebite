const User = require('../models/User');
const Donation = require('../models/Donation');
const Pickup = require('../models/Pickup');
const Notification = require('../models/Notification');

// @route  GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalDonations, totalPickups, deliveredPickups] = await Promise.all([
      User.countDocuments(),
      Donation.countDocuments(),
      Pickup.countDocuments(),
      Pickup.countDocuments({ status: 'delivered' }),
    ]);

    const mealsSavedAgg = await Pickup.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$mealsDelivered' } } },
    ]);
    const totalMealsServed = mealsSavedAgg[0]?.total || 0;

    // byRole — matches what the frontend reads
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const recentDonations = await Donation.find()
      .populate('donor', 'name organisationName')
      .sort({ createdAt: -1 })
      .limit(5);

    // byStatus — matches what the frontend reads
    const byStatus = await Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // byFoodType for the food type chart
    const byFoodType = await Donation.aggregate([
      { $group: { _id: '$foodType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Last 7 days daily donations
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyDonations = await Donation.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const pickupSuccessRate = totalPickups > 0 ? Math.round((deliveredPickups / totalPickups) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalUsers, totalDonations, totalPickups, deliveredPickups,
        totalMealsServed,
        byRole, byStatus, byFoodType, dailyDonations, recentDonations,
        pickupSuccessRate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1).skip((page - 1) * limit);
    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['donor', 'volunteer', 'ngo', 'admin'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    // Prevent an admin from accidentally demoting themselves
    if (req.params.id === req.user.id && role !== 'admin') {
      return res.status(403).json({ message: 'You cannot demote your own admin account.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, message: `User role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    // ── KPI Summary ───────────────────────────────────────────
    const [
      totalDonations, totalPickups, totalUsers,
      deliveredPickups, cancelledPickups, expiredDonations
    ] = await Promise.all([
      Donation.countDocuments(),
      Pickup.countDocuments(),
      User.countDocuments(),
      Pickup.countDocuments({ status: 'delivered' }),
      Pickup.countDocuments({ status: 'cancelled' }),
      Donation.countDocuments({ status: 'expired' }),
    ]);

    const totalMealsAgg = await Pickup.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$mealsDelivered' } } },
    ]);
    const totalMeals = totalMealsAgg[0]?.total || 0;

    // meals from estimatedMeals when mealsDelivered is 0
    const estimatedMealsAgg = await Donation.aggregate([
      { $match: { status: { $in: ['delivered', 'picked', 'assigned'] } } },
      { $group: { _id: null, total: { $sum: '$estimatedMeals' } } },
    ]);
    const estimatedMeals = estimatedMealsAgg[0]?.total || 0;
    const mealsServed = totalMeals > 0 ? totalMeals : estimatedMeals;

    const pickupSuccessRate = totalPickups > 0
      ? Math.round((deliveredPickups / totalPickups) * 100) : 0;
    const cancellationRate = totalPickups > 0
      ? Math.round((cancelledPickups / totalPickups) * 100) : 0;
    const expiryRate = totalDonations > 0
      ? Math.round((expiredDonations / totalDonations) * 100) : 0;

    // ── Active Volunteers ─────────────────────────────────────
    const activeVolunteers = await User.countDocuments({
      role: { $in: ['volunteer', 'ngo'] },
      isActive: true,
    });

    // ── Donations by Status ───────────────────────────────────
    const byStatus = await Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Pickups by Status ─────────────────────────────────────
    const pickupsByStatus = await Pickup.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── Weekly (last 14 days) donation chart ──────────────────
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const weeklyDonations = await Donation.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, meals: { $sum: '$estimatedMeals' } } },
      { $sort: { _id: 1 } },
    ]);

    // ── Monthly Summary (last 6 months) ───────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyStats = await Donation.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
          meals: { $sum: '$estimatedMeals' },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // ── User Registration Growth (last 6 months) ──────────────
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Role Distribution ─────────────────────────────────────
    const byRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // ── Donations by Food Type ────────────────────────────────
    const donationsByType = await Donation.aggregate([
      { $group: { _id: '$foodType', count: { $sum: 1 }, totalQty: { $sum: '$quantity.value' }, meals: { $sum: '$estimatedMeals' } } },
      { $sort: { count: -1 } },
    ]);

    // ── Top Donors (from Donation collection, always correct) ─
    const topDonors = await Donation.aggregate([
      { $group: { _id: '$donor', totalDonations: { $sum: 1 }, totalMeals: { $sum: '$estimatedMeals' } } },
      { $sort: { totalDonations: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: {
        _id: '$user._id',
        name: '$user.name',
        email: '$user.email',
        organisationName: '$user.organisationName',
        role: '$user.role',
        totalDonations: 1,
        totalMeals: 1,
      }},
    ]);

    // ── Top Volunteers (by pickups delivered) ─────────────────
    const topVolunteers = await Pickup.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: '$volunteer', deliveredPickups: { $sum: 1 }, mealsDelivered: { $sum: '$mealsDelivered' } } },
      { $sort: { deliveredPickups: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: {
        _id: '$user._id',
        name: '$user.name',
        organisationName: '$user.organisationName',
        role: '$user.role',
        deliveredPickups: 1,
        mealsDelivered: 1,
      }},
    ]);

    // ── Donor Retention ───────────────────────────────────────
    const donorCounts = await Donation.aggregate([
      { $group: { _id: '$donor', count: { $sum: 1 } } },
    ]);
    const returningDonors = donorCounts.filter(d => d.count > 1).length;
    const donorRetention = donorCounts.length > 0
      ? Math.round((returningDonors / donorCounts.length) * 100) : 0;

    res.json({
      success: true,
      kpi: {
        totalDonations, totalPickups, totalUsers, mealsServed,
        deliveredPickups, cancelledPickups, expiredDonations, activeVolunteers,
        pickupSuccessRate, cancellationRate, expiryRate, donorRetention,
      },
      weeklyDonations,
      monthlyStats,
      userGrowth,
      byRole,
      byStatus,
      pickupsByStatus,
      donationsByType,
      topDonors,
      topVolunteers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats, getAllUsers, toggleUserStatus, updateUserRole, deleteUser, getReports };

