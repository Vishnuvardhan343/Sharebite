const express = require('express');
const router = express.Router();
const { acceptPickup, updatePickupStatus, getMyPickups, getAllPickups, ratePickup, cancelPickup } = require('../controllers/pickupController');
const { protect } = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

router.get('/',                protect, roleCheck('admin'), getAllPickups);
router.get('/my',              protect, getMyPickups);
router.post('/:donationId/accept', protect, roleCheck('ngo','volunteer','admin'), acceptPickup);
router.put('/:id/status',      protect, updatePickupStatus);
router.post('/:id/rate',       protect, ratePickup);
router.post('/:id/cancel',     protect, cancelPickup);

module.exports = router;

