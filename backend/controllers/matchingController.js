const Donation = require('../models/Donation');
const User = require('../models/User');
const { findBestMatches, getDistanceKm } = require('../utils/matchingAlgorithm');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to check and mark expired donations
const checkAndUpdateExpired = async (donations) => {
  const now = new Date();
  const updatedDonations = await Promise.all(donations.map(async (donation) => {
    if (new Date(donation.expiryTime) < now && donation.status === 'available') {
      donation.status = 'expired';
      await donation.save();
    }
    return donation;
  }));
  return updatedDonations;
};

// @route  GET /api/matching/:donationId  — Get AI matches for a donation
const getMatches = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const candidates = await User.find({
      role: { $in: ['ngo', 'volunteer'] },
      isActive: true,
    });

    const matches = findBestMatches(donation, candidates, 10);

    res.json({
      success: true,
      donation: {
        id: donation._id,
        foodName: donation.foodName,
        hoursLeft: donation.hoursUntilExpiry,
        location: donation.pickupLocation.address,
      },
      matches: matches.map(m => ({
        id: m.volunteer._id,
        name: m.volunteer.name,
        role: m.volunteer.role,
        phone: m.volunteer.phone,
        email: m.volunteer.email,
        distanceKm: m.distanceKm,
        etaMinutes: m.etaMinutes,
        matchScore: m.score,
        totalPickups: m.volunteer.totalPickups,
        isVerified: m.volunteer.isVerified,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/matching/nearby  — Get nearby donations for a volunteer/NGO
const getNearbyDonations = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query; // radius in km
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required' });

    let donations = await Donation.find({ status: 'available' })
      .populate('donor', 'name phone');

    donations = await checkAndUpdateExpired(donations);
    donations = donations.filter(d => d.status === 'available');

    const nearby = donations
      .map(d => {
        const coords = d.pickupLocation.coordinates.coordinates;
        const dist = getDistanceKm([parseFloat(lng), parseFloat(lat)], coords);
        return { ...d.toObject(), distanceKm: parseFloat(dist.toFixed(2)) };
      })
      .filter(d => d.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({ success: true, donations: nearby, count: nearby.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/matching/ai-insight  — Gemini AI analysis of a donation food item
const getAiInsight = async (req, res) => {
  try {
    const { foodName, quantity, unit, expiryHours, address, category, description } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
      return res.status(503).json({ message: 'GEMINI_API_KEY not configured in .env' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an AI assistant for a food redistribution platform called ShareBite.

A volunteer is considering picking up this food donation:
- Food: ${foodName}
- Quantity: ${quantity} ${unit}
- Category: ${category || 'General'}
- Description: ${description || 'Not specified'}
- Hours Until Expiry: ${expiryHours ? parseFloat(expiryHours).toFixed(1) + ' hrs' : 'Unknown'}
- Pickup Area: ${address || 'Not specified'}

Return ONLY a valid JSON object (no markdown, no explanation) with these keys:
{
  "urgencyLevel": "low|medium|high|critical",
  "urgencyReason": "one concise sentence",
  "safetyTips": ["tip 1", "tip 2", "tip 3"],
  "nutritionHighlight": "1 sentence about nutritional value",
  "handlingAdvice": "1 sentence on safe transport/handling",
  "communityImpact": "1 enthusiastic sentence about potential community impact"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/```json|```/g, '').trim();

    let parsed;
    try { parsed = JSON.parse(text); } catch { return res.status(200).json({ raw: text, parsed: null }); }

    res.json({ success: true, insight: parsed });
  } catch (error) {
    console.error('Gemini AI error:', error.message);
    res.status(500).json({ message: 'AI analysis failed: ' + error.message });
  }
};

module.exports = { getMatches, getNearbyDonations, getAiInsight };
