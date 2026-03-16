/**
 * AI Smart Matching Algorithm
 * Scores and ranks NGOs/Volunteers for a given donation
 * based on: distance, availability, past performance, food type preference
 */

// Calculate distance between two [lng, lat] coordinates (Haversine formula)
const getDistanceKm = (coord1, coord2) => {
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Calculate ETA in minutes (avg speed 20 km/h)
const getETA = (distanceKm) => Math.ceil((distanceKm / 20) * 60);

/**
 * Score a volunteer/NGO against a donation
 * Higher score = better match
 */
const scoreMatch = (volunteer, donation) => {
  let score = 100;

  // Distance penalty (up to 50 points)
  const donationCoords = donation.pickupLocation.coordinates.coordinates;
  const volunteerCoords = volunteer.location.coordinates;
  const distance = getDistanceKm(volunteerCoords, donationCoords);
  const distancePenalty = Math.min(50, distance * 5); // -5 pts per km
  score -= distancePenalty;

  // Urgency bonus: if expiry < 2 hrs, prefer closest volunteer
  const hoursLeft = donation.hoursUntilExpiry;
  if (hoursLeft < 2 && distance < 2) score += 20;
  if (hoursLeft < 1 && distance < 1) score += 30;

  // Activity bonus: more pickups = more reliable
  score += Math.min(20, volunteer.totalPickups * 0.5);

  // Verified NGO bonus
  if (volunteer.isVerified) score += 10;

  return {
    volunteer,
    score: Math.max(0, Math.round(score)),
    distanceKm: parseFloat(distance.toFixed(2)),
    etaMinutes: getETA(distance),
  };
};

/**
 * Main matching function
 * @param {Object} donation - Donation document
 * @param {Array}  candidates - Array of User documents (NGO/Volunteer)
 * @param {Number} maxResults - How many top matches to return
 */
const findBestMatches = (donation, candidates, maxResults = 5) => {
  if (!candidates || candidates.length === 0) return [];

  const scored = candidates
    .filter(c => c.isActive)
    .map(c => scoreMatch(c, donation))
    .filter(r => r.distanceKm <= 15) // Only within 15 km
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults);
};

module.exports = { findBestMatches, getDistanceKm, getETA };
