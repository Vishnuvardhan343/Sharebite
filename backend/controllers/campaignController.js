const Campaign = require('../models/Campaign');

// @desc    Get all active campaigns
// @route   GET /api/campaigns
// @access  Public
exports.getCampaigns = async (req, res, next) => {
    try {
        const Pickup = require('../models/Pickup');
        const campaigns = await Campaign.find({ active: true }).sort('-createdAt').lean();
        
        // Dynamically calculate the progress for each campaign based strictly on its time period
        const updatedCampaigns = await Promise.all(campaigns.map(async (camp) => {
            const startDate = camp.createdAt;
            let endDateObj = null;
            
            if (camp.endDate) {
                endDateObj = new Date(camp.endDate);
                if (!isNaN(endDateObj.getTime())) {
                    endDateObj.setHours(23, 59, 59, 999); // Include the whole end day
                }
            }

            const dateFilter = { $gte: startDate };
            if (endDateObj && !isNaN(endDateObj.getTime())) {
                dateFilter.$lte = endDateObj;
            }

            // Fetch pickups that were delivered inside the campaign's active window
            const pickupsInsidePeriod = await Pickup.find({
                status: 'delivered',
                deliveredAt: dateFilter
            }).populate('donation');

            let mealsInPeriod = 0;
            pickupsInsidePeriod.forEach(p => {
               mealsInPeriod += (p.mealsDelivered || (p.donation ? p.donation.estimatedMeals : 0) || 1);
            });

            return {
                ...camp,
                pickupCurrent: pickupsInsidePeriod.length,
                donationCurrent: mealsInPeriod
            };
        }));

        res.status(200).json({
            success: true,
            count: updatedCampaigns.length,
            data: updatedCampaigns
        });
    } catch (err) {
        console.error("Campaign fetch error:", err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new campaign
// @route   POST /api/campaigns
// @access  Private/Admin
exports.createCampaign = async (req, res, next) => {
    try {
        // Add user to req.body
        req.body.createdBy = req.user.id;

        const campaign = await Campaign.create(req.body);

        res.status(201).json({
            success: true,
            data: campaign
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
