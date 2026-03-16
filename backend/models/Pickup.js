const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true,
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in-transit', 'delivered', 'failed', 'cancelled'],
    default: 'pending',
  },
  cancelledAt: { type: Date },
  cancelReason: { type: String, default: '' },
  pickupAddress: { type: String },
  deliveryAddress: { type: String },
  // Timeline
  acceptedAt:  { type: Date },
  pickedAt:    { type: Date },
  deliveredAt: { type: Date },
  // Tracking
  currentLocation: {
    coordinates: { type: [Number], default: [0, 0] },
  },
  distanceKm:   { type: Number, default: 0 },
  estimatedETA: { type: Number, default: 0 }, // minutes
  // Feedback
  donorRating:    { type: Number, min: 1, max: 5 },
  volunteerRating:{ type: Number, min: 1, max: 5 },
  notes: { type: String, default: '' },
  mealsDelivered: { type: Number, default: 0 },
  // Handover Confirmation
  handoverDetails: {
    receiverName: { type: String },
    signature: { type: String }, // Base64 signature image
    handoverPhoto: { type: String }, // Base64 handover photo
    confirmedAt: { type: Date }
  }
}, { timestamps: true });

pickupSchema.index({ donation: 1 });
pickupSchema.index({ volunteer: 1 });
pickupSchema.index({ status: 1 });

module.exports = mongoose.model('Pickup', pickupSchema);
