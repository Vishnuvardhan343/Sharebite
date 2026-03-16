const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../controllers/chatbotController');

// Chat with AI
router.post('/', chatWithAI);

module.exports = router;
