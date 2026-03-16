const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleCheck');

// Get a public profile of any user
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// List all NGOs / Volunteers (for donor info)
router.get('/', protect, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role, isActive: true } : { isActive: true };
    const users = await User.find(filter).select('name role email phone organisation isVerified totalPickups');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
