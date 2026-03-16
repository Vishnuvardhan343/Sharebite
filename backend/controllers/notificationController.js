const Notification = require('../models/Notification');
const User = require('../models/User');
// const sendSMS = require('../utils/sendSMS');
const { sendEmail } = require('../utils/sendEmail');

// @route  GET /api/notifications  — My notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/notifications/:id/read
const markRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/notifications/send  — Admin: send manual notification
const sendManual = async (req, res) => {
  try {
    const { recipientId, title, message, channel } = req.body;
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'User not found' });

    const notification = await Notification.create({
      recipient: recipientId, type: 'system', title, message, channel,
    });

    if ((channel === 'email' || channel === 'all') && recipient.email && recipient.notificationSettings?.emailNotifications !== false) {
      const result = await sendEmail({ to: recipient.email, subject: title, text: message });
      await Notification.findByIdAndUpdate(notification._id, { emailSent: result.success });
    }

    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications, markRead, markAllRead, sendManual };
