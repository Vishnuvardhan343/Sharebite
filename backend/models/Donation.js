const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  foodName: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
  },
  foodType: {
    type: String,
    enum: ['Cooked Meal', 'Raw Vegetables', 'Bakery Items', 'Fruits', 'Dairy Products', 'Packaged Food', 'Beverages', 'Other'],
    default: 'Cooked Meal',
  },
  quantity: {
    value: { type: Number, required: true, min: 0.1 },
    unit:  { type: String, enum: ['kg', 'litres', 'portions', 'items'], default: 'kg' },
  },
  expiryTime: {
    type: Date,
    required: [true, 'Expiry time is required'],
  },
  hoursUntilExpiry: { type: Number }, // computed on save
  pickupLocation: {
    address: { type: String, required: true },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },
  description: { type: String, default: '' },
  images: [{ type: String }],
  status: {
    type: String,
    enum: ['available', 'assigned', 'picked', 'delivered', 'expired', 'cancelled'],
    default: 'available',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedAt: { type: Date },
  pickedAt:   { type: Date },
  deliveredAt:{ type: Date },
  estimatedMeals: { type: Number, default: 0 },
  aiMatchScore: { type: Number, default: 0 }, // AI matching confidence
  aiSuggestion: { type: String, default: '' }, // AI tip for this donation
  notificationsSent: { type: Boolean, default: false },
}, { timestamps: true });

donationSchema.index({ 'pickupLocation.coordinates': '2dsphere' });
donationSchema.index({ status: 1 });
donationSchema.index({ donor: 1 });
donationSchema.index({ expiryTime: 1 });

// Auto-calculate hours until expiry before save
donationSchema.pre('save', function () {
  const now = new Date();
  const diff = (this.expiryTime - now) / (1000 * 60 * 60);
  this.hoursUntilExpiry = Math.max(0, parseFloat(diff.toFixed(2)));
  // Estimate meals from quantity
  if (this.quantity.unit === 'kg') {
    this.estimatedMeals = Math.floor(this.quantity.value * 4);
  } else if (this.quantity.unit === 'portions') {
    this.estimatedMeals = this.quantity.value;
  }
});

module.exports = mongoose.model('Donation', donationSchema);
