const express = require('express');
const router = express.Router();
const { getMatches, getNearbyDonations, getAiInsight } = require('../controllers/matchingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ai-insight',   protect, getAiInsight);
router.get('/nearby',        protect, getNearbyDonations);
router.get('/:donationId',   protect, getMatches);

module.exports = router;
