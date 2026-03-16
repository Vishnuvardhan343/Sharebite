const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, upgradeToVolunteer, forgotPasswordSendOtp, verifyForgotPasswordOtp, resetPasswordWithOtp, verifyEmailOTP, resendEmailOTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login',    login);
router.post('/verify-email-otp', verifyEmailOTP);
router.post('/resend-email-otp', resendEmailOTP);
router.get('/me',        protect, getMe);
router.put('/profile',   protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/volunteer-upgrade', protect, upgradeToVolunteer);

// Forgot Password
router.post('/forgot-password/send-otp', forgotPasswordSendOtp);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);

module.exports = router;
