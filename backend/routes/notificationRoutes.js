const express = require('express');
const router = express.Router();
const { getNotifications, markRead, markAllRead, sendManual } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

router.get('/',            protect, getNotifications);
router.put('/read-all',    protect, markAllRead);
router.put('/:id/read',    protect, markRead);
router.post('/send',       protect, roleCheck('admin'), sendManual);

module.exports = router;
