const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const resetOtps = new Map(); // In-memory store for OTPs: email -> { otp, expiresAt }
// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// @route  POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, address, organisation } = req.body;

    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin registration is restricted. Please contact an existing administrator.' });
    }

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword, role, phone, address, organisation });

    // Send welcome email
    await sendEmail({
      to: email,
      subject: '🌱 Welcome to Sharebite!',
      html: `<h2>Welcome, ${name}!</h2><p>Your ${role} account is active. Start making a difference today!</p>`,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        phone: user.phone, 
        notificationSettings: user.notificationSettings 
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        phone: user.phone, 
        notificationSettings: user.notificationSettings 
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fields = ['name', 'phone', 'address', 'organisation', 'location', 'notificationSettings'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) {
        user[f] = req.body[f];
        if (f === 'notificationSettings') {
          user.markModified('notificationSettings');
        }
      }
    });

    await user.save();
    
    // Return full updated user object
    res.json({ 
      success: true, 
      user: user.toObject()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.matchPassword(oldPassword))) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  PUT /api/auth/volunteer-upgrade
const upgradeToVolunteer = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Only upgrade if they are currently just a donor
    if (user.role === 'donor') {
      user.role = 'volunteer';
      await user.save();
    }
    
    // Return updated user payload
    res.json({
      success: true,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        phone: user.phone, 
        notificationSettings: user.notificationSettings 
      },
      message: 'Successfully upgraded to Volunteer role'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/auth/forgot-password/send-otp
const forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found with this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    resetOtps.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min expiry
    console.log(`[DEV] OTP for ${email}: ${otp}`);

    await sendEmail({
      to: email,
      subject: 'Password Reset OTP — Sharebite',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f0fff4;padding:32px;border-radius:12px;">
          <h2 style="color:#1B4332;">Password Reset OTP 🔐</h2>
          <p>Hello ${user.name},</p>
          <p>Your OTP to reset your password is:</p>
          <div style="background:#fff;padding:15px;border-radius:8px;border:2px solid #52B788;text-align:center;font-size:24px;letter-spacing:8px;font-weight:bold;color:#1B4332;">
            ${otp}
          </div>
          <p style="margin-top:20px;font-size:14px;color:#666;">This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'OTP sent to email successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/auth/forgot-password/verify-otp  — Check OTP only (before new password step)
const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = resetOtps.get(email);

    if (!stored) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (Date.now() > stored.expiresAt) {
      resetOtps.delete(email);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }
    if (stored.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });

    // OTP is valid — do NOT delete it yet, the reset endpoint will consume it
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route  POST /api/auth/forgot-password/reset
const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const stored = resetOtps.get(email);
    if (!stored) return res.status(400).json({ message: 'No OTP requested for this email, or it has expired' });
    
    if (stored.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    
    if (Date.now() > stored.expiresAt) {
      resetOtps.delete(email);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();
    
    resetOtps.delete(email);

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword, upgradeToVolunteer, forgotPasswordSendOtp, verifyForgotPasswordOtp, resetPasswordWithOtp };
