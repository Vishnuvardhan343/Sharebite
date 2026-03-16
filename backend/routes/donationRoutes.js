const express = require('express');
const router = express.Router();
const { createDonation, getAllDonations, getAvailableDonations, getDonation, updateDonation, deleteDonation, getMyDonations } = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

router.get('/available',  protect, getAvailableDonations);
router.get('/my/history', protect, roleCheck('donor', 'volunteer', 'admin'), getMyDonations);
router.get('/',           protect, getAllDonations);
router.post('/',          protect, roleCheck('donor', 'volunteer', 'admin'), createDonation);
router.get('/:id',        protect, getDonation);
router.put('/:id',        protect, updateDonation);
router.delete('/:id',     protect, deleteDonation);

module.exports = router;
