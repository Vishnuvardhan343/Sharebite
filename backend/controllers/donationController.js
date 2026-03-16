const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { findBestMatches } = require('../utils/matchingAlgorithm');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
// const sendSMS = require('../utils/sendSMS');
const Pickup = require('../models/Pickup');

// Helper to check and mark expired donations
const checkAndUpdateExpired = async (donations) => {
  const now = new Date();
  const updatedDonations = await Promise.all(donations.map(async (donation) => {
    // If it's already past expiry time and is NOT already expired/delivered/cancelled
    if (new Date(donation.expiryTime) < now && ['available', 'assigned'].includes(donation.status)) {
      const oldStatus = donation.status;
      donation.status = 'expired';
      await donation.save(); // Update in database

      // If it was assigned, we MUST fail the related pickup
      if (oldStatus === 'assigned') {
        try {
          const pickup = await Pickup.findOneAndUpdate(
            { donation: donation._id, status: { $in: ['pending', 'accepted', 'in-transit'] } },
            { status: 'failed', cancelReason: 'Donation expired before delivery' },
            { new: true }
          ).populate('volunteer');

          if (pickup) {
            // Notify volunteer
            await Notification.create({
              recipient: pickup.volunteer._id,
              type: 'pickup_failed',
              title: '⏰ Pickup Failed: Expired',
              message: `The donation for "${donation.foodName}" has expired and is no longer available.`,
              data: { donationId: donation._id, pickupId: pickup._id },
              channel: 'all',
            });
            
            if (pickup.volunteer.phone) {
              await sendSMS(pickup.volunteer.phone, `[Sharebite] Pickup for ${donation.foodName} failed: food expired.`);
            }
          }
        } catch (err) {
          console.error('[Expiry Cleanup Error]', err.message);
        }
      }
    }
    return donation;
  }));
  return updatedDonations;
};

// @route  POST /api/donations  — Create donation
const createDonation = async (req, res) => {
  try {
    const { foodName, foodType, quantity, expiryHours, location, description, image } = req.body;

    // Map frontend fields (location, expiryHours) to strict Schema fields (pickupLocation, expiryTime)
    const pickupLocation = {
      address: location?.address,
      coordinates: { 
        type: 'Point', 
        coordinates: [
          parseFloat(location?.coordinates?.lng) || 0, 
          parseFloat(location?.coordinates?.lat) || 0
        ] 
      }
    };
    
    const expiryTime = new Date(Date.now() + (parseInt(expiryHours) || 3) * 60 * 60 * 1000);

    const donation = await Donation.create({
      donor: req.user.id,
      foodName, foodType, quantity, expiryTime, pickupLocation, description,
      images: image ? [image] : [],
    });

    // Update donor stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { totalDonations: 1 } });

    // ✅ Send success response IMMEDIATELY — donation is saved
    res.status(201).json({ success: true, donation, message: 'Donation created successfully!' });

    // ── Fire-and-forget: notifications (errors here won't affect the response) ──
    try {
      const candidates = await User.find({
        role: { $in: ['ngo', 'volunteer'] },
        isActive: true,
      });

      const matches = findBestMatches(donation, candidates, 5);

      const notifyList = matches.slice(0, 3);
      for (const match of notifyList) {
        const { volunteer } = match;
        
        // Priority: Filter by notification settings
        if (!volunteer.notificationSettings?.emailNotifications) continue;

        // Calculate if urgent (e.g., expiry < 3 hours)
        const diffHours = (donation.expiryTime - Date.now()) / (1000 * 60 * 60);
        const isUrgent = diffHours < 3;

        // If urgent, check urgent setting. If not urgent, send anyway as it's a standard pickup request.
        if (isUrgent && !volunteer.notificationSettings?.urgentPickupRequests) continue;

        await Notification.create({
          recipient: volunteer._id,
          type: 'donation_posted',
          title: isUrgent ? '🚨 URGENT: New Donation Near You!' : '🍱 New Donation Near You!',
          message: `${isUrgent ? 'URGENT: ' : ''}${req.user.name} posted ${foodName} (${quantity.value} ${quantity.unit}). You're ${match.distanceKm} km away.`,
          data: { donationId: donation._id, distanceKm: match.distanceKm, isUrgent },
          channel: 'all',
        });

        if (volunteer.email) {
          const tmpl = emailTemplates.pickupRequest(
            req.user.name, 
            foodName, 
            `${quantity.value} ${quantity.unit}`, 
            pickupLocation.address,
            isUrgent
          );
          await sendEmail({ to: volunteer.email, ...tmpl });
        }
      }

      await sendEmail({
        to: req.user.email,
        ...emailTemplates.donationConfirmation(req.user.name, foodName),
      });

      await Donation.findByIdAndUpdate(donation._id, { notificationsSent: true });
    } catch (notifErr) {
      console.error('[Notification Error — donation already saved]', notifErr.message);
    }

  } catch (error) {
    console.error("🔥 Donation Creation CRITICAL Error 🔥");
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    if (error.errors) {
      console.error("Mongoose Validation Errors:", Object.keys(error.errors).map(k => `${k}: ${error.errors[k].message}`));
    }
    console.error("Stack:", error.stack);
    res.status(500).json({ message: error.message, details: error.errors });
  }
};

// @route  GET /api/donations  — Get all donations (admin / volunteer / NGO)
const getAllDonations = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, foodType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (foodType) filter.foodType = foodType;

    // Donors see only their own
    if (req.user.role === 'donor') filter.donor = req.user.id;

    let donations = await Donation.find(filter)
      .populate('donor', 'name email phone address')
      .populate('assignedTo', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Ensure expired status is accurate before returning
    donations = await checkAndUpdateExpired(donations);

    const total = await Donation.countDocuments(filter);

    res.json({ success: true, donations, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/donations/available  — Available donations for NGO/Volunteer
const getAvailableDonations = async (req, res) => {
  try {
    let donations = await Donation.find({ status: 'available' })
      .populate('donor')
      .sort({ expiryTime: 1 }); // soonest expiry first
    
    // Update expired and filter out newly expired ones from available view
    donations = await checkAndUpdateExpired(donations);
    donations = donations.filter(d => d.status === 'available');

    res.json({ success: true, donations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/donations/:id  — Single donation
const getDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone address')
      .populate('assignedTo', 'name email phone');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json({ success: true, donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/donations/:id  — Update donation (donor only)
const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const updated = await Donation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, donation: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  DELETE /api/donations/:id
const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can delete donations.' });
    }
    await donation.deleteOne();
    res.json({ success: true, message: 'Donation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/donations/my/history  — Donor donation history
const getMyDonations = async (req, res) => {
  try {
    let donations = await Donation.find({ donor: req.user.id })
      .populate('assignedTo', 'name phone')
      .sort({ createdAt: -1 });
    
    donations = await checkAndUpdateExpired(donations);

    res.json({ success: true, donations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createDonation, getAllDonations, getAvailableDonations, getDonation, updateDonation, deleteDonation, getMyDonations };
