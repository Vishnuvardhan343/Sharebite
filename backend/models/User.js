const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['donor', 'ngo', 'volunteer', 'admin'],
    default: 'donor',
  },
  phone: { 
    type: String, 
    trim: true,
    required: [true, 'Phone number is required'],
    match: [/^\d{10}$/, 'Phone number must be exactly 10 digits']
  },
  address: { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
  },
  // NGO / Volunteer specific
  organisation: { type: String },
  isVerified: { type: Boolean, default: false }, // General verification (e.g. NGO docs)
  isActive:   { type: Boolean, default: true  },
  // Stats
  totalDonations: { type: Number, default: 0 },
  totalPickups:   { type: Number, default: 0 },
  mealsContributed: { type: Number, default: 0 },
  profilePic: { type: String, default: '' },
  fcmToken: { type: String, default: '' }, // push notifications
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    urgentPickupRequests: { type: Boolean, default: true }
  },
  emailVerified: { type: Boolean, default: false },
  emailOtp: { type: String, select: false },
  emailOtpExpires: { type: Date, select: false }
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
