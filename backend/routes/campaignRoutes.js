const express = require('express');
const { getCampaigns, createCampaign } = require('../controllers/campaignController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Route to get all active campaigns (Public)
router.get('/', getCampaigns);

// Route to create a new campaign (Admin only)
router.post('/', protect, authorize('admin'), createCampaign);

module.exports = router;
