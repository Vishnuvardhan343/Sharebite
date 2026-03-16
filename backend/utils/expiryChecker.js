const Donation = require("../models/Donation");
const Notification = require("../models/Notification");
const { sendEmail } = require("./sendEmail");
const User = require("../models/User");

exports.checkExpiryAndNotify = async () => {
  try {
    const now = new Date();
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find donations expiring within 2 hours that are still available/matched/assigned/picked
    const expiringSoon = await Donation.find({
      status: { $in: ["available", "matched", "assigned", "picked"] },
      expiryTime: { $lte: in2Hours, $gt: now },
      isUrgent: false,
    }).populate("donor", "name phone email");

    for (const donation of expiringSoon) {
      const hoursLeft = Math.ceil((new Date(donation.expiryTime) - now) / (1000 * 60 * 60));

      // Mark as urgent
      donation.isUrgent = true;
      await donation.save();

      // Notify donor
      await Notification.create({
        recipient: donation.donor._id,
        type: "expiry_alert",
        title: `⚠️ Urgent: ${donation.foodName} expires in ${hoursLeft}h`,
        message: `Your donation "${donation.foodName}" expires soon. We're urgently looking for a volunteer. Please ensure the food is accessible.`,
        donation: donation._id,
        channels: { inApp: true, sms: true },
      });

      // Email donor
      if (donation.donor.email && donation.donor.notificationSettings?.emailNotifications !== false) {
        await sendEmail({
          to: donation.donor.email,
          subject: `⚠️ Urgent: ${donation.foodName} expires in ${hoursLeft}h`,
          text: `Your donation "${donation.foodName}" expires soon. We're urgently looking for a volunteer. Please ensure the food is accessible.`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff5f5;padding:32px;border-radius:12px;border:2px solid #feb2b2;">
              <h2 style="color:#c53030;">⚠️ Urgent: Expiry Alert</h2>
              <p>Hello ${donation.donor.name},</p>
              <p>Your donation of <strong>${donation.foodName}</strong> expires in about <strong>${hoursLeft} hours</strong>.</p>
              <p>We're urgently looking for a volunteer to pick it up. Please ensure the food is ready and accessible.</p>
              <p style="color:#52796F;font-size:12px;">Sharebite — Fighting Food Waste Together 🌍</p>
            </div>
          `
        });
      }
    }

    // Mark fully expired donations and associated pickups
    const fullyExpired = await Donation.find({ 
      status: { $in: ["available", "matched", "assigned", "picked"] }, 
      expiryTime: { $lte: now } 
    }).populate("donor volunteer");

    let statusUpdates = 0;
    for (const donation of fullyExpired) {
      const prevStatus = donation.status;
      donation.status = "expired";
      await donation.save();
      statusUpdates++;

      // If it was assigned or picked, mark the pickup as failed
      if (["assigned", "picked"].includes(prevStatus)) {
        const Pickup = require("../models/Pickup");
        const pickup = await Pickup.findOneAndUpdate(
          { donation: donation._id, status: { $ne: "delivered" } },
          { status: "failed", notes: "Expired before delivery" },
          { new: true }
        ).populate("volunteer donor");

        if (pickup) {
          // Notify volunteer
          await Notification.create({
            recipient: pickup.volunteer?._id,
            type: "pickup_failed",
            title: "❌ Pickup Failed: Expired",
            message: `The donation for "${donation.foodName}" has expired before it could be delivered. This has been marked as a failure.`,
            channel: "all",
          });

          // Notify donor
          await Notification.create({
            recipient: pickup.donor?._id,
            type: "pickup_failed",
            title: "⚠️ Donation Expired",
            message: `Your donation "${donation.foodName}" was not delivered on time and has expired.`,
            channel: "all",
          });
        }
      }
    }

    console.log(`[CRON] ${expiringSoon.length} urgent alerts sent, ${expired.modifiedCount} donations marked expired`);
  } catch (err) {
    console.error("[CRON ERROR]", err.message);
  }
};
