const Pickup = require('../models/Pickup');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
// const sendSMS = require('../utils/sendSMS');

// @route  POST /api/pickups/:donationId/accept
const acceptPickup = async (req, res) => {
  try {
    // ATOMIC UPDATE: Find the donation ONLY if it's currently 'available' AND update it immediately
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.donationId, status: 'available' },
      { 
        status: 'assigned', 
        assignedTo: req.user.id, 
        assignedAt: new Date() 
      },
      { new: true, populate: 'donor' } // Return the updated document, populated
    );

    // If donation is null, it was either not found or its status was NOT 'available' (meaning someone else just took it or this is a duplicate request)
    if (!donation) {
      return res.status(400).json({ message: 'Donation is no longer available or does not exist.' });
    }

    // Prevent volunteer from accepting their own donation
    if (donation.donor._id.toString() === req.user.id.toString()) {
      // Revert the atomic update since the user shouldn't have taken it
      await Donation.findByIdAndUpdate(donation._id, { status: 'available', $unset: { assignedTo: 1, assignedAt: 1 } });
      return res.status(403).json({ message: 'You cannot accept your own donation.' });
    }

    // Create pickup record now that we have exclusively locked this donation
    const pickup = await Pickup.create({
      donation: donation._id,
      volunteer: req.user.id,
      donor: donation.donor._id,
      status: 'accepted',
      pickupAddress: donation.pickupLocation.address,
      acceptedAt: new Date(),
      estimatedETA: req.body.estimatedETA || 30,
    });

    // Update volunteer stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalPickups: 1 } });

    // Notify donor
    await Notification.create({
      recipient: donation.donor._id,
      type: 'pickup_accepted',
      title: '🚴 Pickup Accepted!',
      message: `${req.user.name} has accepted your ${donation.foodName} donation. ETA: ${pickup.estimatedETA} mins.`,
      data: { pickupId: pickup._id },
      channel: 'all',
    });

    // if (donation.donor.phone) {
    //   await sendSMS(donation.donor.phone,
    //     `[Sharebite] ${req.user.name} accepted your ${donation.foodName} pickup. ETA ~${pickup.estimatedETA} minutes.`
    //   );
    // }

    if (donation.donor.email && donation.donor.notificationSettings?.emailNotifications !== false) {
      await sendEmail({
        to: donation.donor.email,
        ...emailTemplates.pickupConfirmed(req.user.name, donation.foodName, pickup.estimatedETA),
      });
    }

    res.status(201).json({ success: true, pickup });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/pickups/:id/status  — Update pickup status
const updatePickupStatus = async (req, res) => {
  try {
    const { status, deliveryAddress, mealsDelivered } = req.body;
    const pickup = await Pickup.findById(req.params.id).populate('donation donor volunteer');

    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
    if (pickup.volunteer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = { status };
    if (status === 'in-transit') updates.pickedAt = new Date();
    if (status === 'delivered') {
      updates.deliveredAt = new Date();
      if (deliveryAddress) updates.deliveryAddress = deliveryAddress;
      
      const finalMeals = mealsDelivered || pickup.donation.estimatedMeals || 0;
      updates.mealsDelivered = finalMeals;

      // Update donation to delivered
      await Donation.findByIdAndUpdate(pickup.donation._id, {
        status: 'delivered', deliveredAt: new Date(),
      });

      // Handle handover details if provided
      if (req.body.handoverDetails) {
        updates.handoverDetails = {
          ...req.body.handoverDetails,
          confirmedAt: new Date()
        };
      }

      // Update volunteer meals stat
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { mealsContributed: mealsDelivered || pickup.donation.estimatedMeals || 0 },
      });

      // Notify donor of successful delivery
      await Notification.create({
        recipient: pickup.donor._id,
        type: 'pickup_completed',
        title: '✅ Food Delivered!',
        message: `Your donation of ${pickup.donation.foodName} was successfully delivered. ${mealsDelivered || 0} meals served!`,
        data: { pickupId: pickup._id },
        channel: 'all',
      });

      // Send Email Notification
      if (pickup.donor.email && pickup.donor.notificationSettings?.emailNotifications !== false) {
        await sendEmail({
          to: pickup.donor.email,
          ...emailTemplates.deliveryNotification(
            pickup.donor.name,
            pickup.donation.foodName,
            req.body.handoverDetails?.receiverName || 'Community Member',
            mealsDelivered,
            req.body.handoverDetails?.handoverPhoto
          )
        });
      }
    }

    const updated = await Pickup.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('donation volunteer donor');
    res.json({ success: true, pickup: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/pickups/my  — Get my pickups (volunteer/NGO)
const getMyPickups = async (req, res) => {
  try {
    const pickups = await Pickup.find({ volunteer: req.user.id })
      .populate('donation')
      .populate('donor', 'name phone address organisationName')
      .sort({ createdAt: -1 });
    res.json({ success: true, pickups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/pickups  — All pickups (admin)
const getAllPickups = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const pickups = await Pickup.find(filter)
      .populate('donation', 'foodName quantity expiryTime')
      .populate('volunteer', 'name phone email')
      .populate('donor', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1).skip((page - 1) * limit);
    const total = await Pickup.countDocuments(filter);
    res.json({ success: true, pickups, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/pickups/:id/rate
const ratePickup = async (req, res) => {
  try {
    const { rating, ratingFor } = req.body; // ratingFor: 'donor' or 'volunteer'
    const update = ratingFor === 'donor'
      ? { donorRating: rating }
      : { volunteerRating: rating };
    const pickup = await Pickup.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, pickup });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/pickups/:id/cancel
const cancelPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('donation donor volunteer');

    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

    // Only the volunteer who accepted it, or an admin, can cancel
    if (pickup.volunteer._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this pickup' });
    }

    // Can only cancel if not yet delivered
    if (['delivered', 'cancelled'].includes(pickup.status)) {
      return res.status(400).json({ message: `Cannot cancel a pickup that is already ${pickup.status}` });
    }

    // 1. Mark pickup as cancelled
    await Pickup.findByIdAndUpdate(req.params.id, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: req.body.reason || 'Cancelled by volunteer',
    });

    // 2. Restore donation to 'available' so it shows back on the Available Donations page
    await Donation.findByIdAndUpdate(pickup.donation._id, {
      status: 'available',
      $unset: { assignedTo: 1, assignedAt: 1 },
    });

    // 3. Decrement volunteer total pickups
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalPickups: -1 } });

    // 4. Notify the donor
    await Notification.create({
      recipient: pickup.donor._id,
      type: 'pickup_cancelled',
      title: '⚠️ Pickup Cancelled',
      message: `The volunteer cancelled the pickup for your "${pickup.donation?.foodName}" donation. It is now available for others to accept.`,
      data: { donationId: pickup.donation._id },
      channel: 'in-app',
    });

    res.json({ success: true, message: 'Pickup cancelled. Donation is now available again.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { acceptPickup, updatePickupStatus, getMyPickups, getAllPickups, ratePickup, cancelPickup };
