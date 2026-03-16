const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['donation_posted', 'pickup_assigned', 'pickup_accepted', 'pickup_completed',
           'expiry_alert', 'new_volunteer', 'system', 'email_sent'],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }, // reference IDs etc.
  isRead: { type: Boolean, default: false },
  channel: {
    type: String,
    enum: ['in-app', 'email', 'all'],
    default: 'in-app',
  },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
