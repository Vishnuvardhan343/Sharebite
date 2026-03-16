const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[EMAIL MOCK]', to, ':', subject);
    return { success: true, mock: true };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Sharebite 🌱" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || '',
      html: html || '',
    });
    console.log(`✅ Email sent to ${to}: MessageId=${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    return { success: false, error: error.message };
  }
};

// Pre-built email templates
const emailTemplates = {
  pickupRequest: (donorName, foodName, qty, address, isUrgent) => ({
    subject: isUrgent ? '🚨 URGENT Pickup Request — Sharebite' : '🍱 New Pickup Request — Sharebite',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:${isUrgent ? '#fff5f5' : '#f0fff4'};padding:32px;border-radius:12px;border:${isUrgent ? '2px solid #feb2b2' : 'none'};">
        <h2 style="color:${isUrgent ? '#c53030' : '#1B4332'};">${isUrgent ? '🚨 URGENT Pickup Available!' : '🌱 New Pickup Available!'}</h2>
        <p>Hello,</p>
        <p><strong>${donorName}</strong> has posted a food donation that needs pickup:</p>
        <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #52B788;">
          <p><strong>Food:</strong> ${foodName}</p>
          <p><strong>Quantity:</strong> ${qty}</p>
          <p><strong>Pickup Address:</strong> ${address}</p>
        </div>
        <p style="margin-top:20px;">Login to <a href="${process.env.CLIENT_URL}">Sharebite</a> to accept this pickup.</p>
        <p style="color:#52796F;font-size:12px;">Sharebite — Fighting Food Waste Together 🌍</p>
      </div>
    `,
  }),

  donationConfirmation: (name, foodName) => ({
    subject: '✅ Donation Posted Successfully — Sharebite',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f0fff4;padding:32px;border-radius:12px;">
        <h2 style="color:#1B4332;">Thank You, ${name}! 🙏</h2>
        <p>Your donation of <strong>${foodName}</strong> has been posted. Our AI is matching you with nearby NGOs and volunteers.</p>
        <p>You'll receive a confirmation once a pickup is assigned.</p>
        <p style="color:#52796F;font-size:12px;">Sharebite — Fighting Food Waste Together 🌍</p>
      </div>
    `,
  }),

  pickupConfirmed: (volunteerName, foodName, eta) => ({
    subject: '🚴 Pickup Confirmed — Sharebite',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f0fff4;padding:32px;border-radius:12px;">
        <h2 style="color:#1B4332;">Pickup Confirmed! 🎉</h2>
        <p><strong>${volunteerName}</strong> has accepted the pickup for <strong>${foodName}</strong>.</p>
        <p><strong>Estimated arrival:</strong> ${eta} minutes</p>
        <p style="color:#52796F;font-size:12px;">Sharebite — Fighting Food Waste Together 🌍</p>
      </div>
    `,
  }),

  deliveryNotification: (donorName, foodName, receiverName, meals, photo) => ({
    subject: `🍽️ Your donation has been delivered! — Sharebite`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f0fff4;padding:32px;border-radius:12px;">
        <h2 style="color:#1B4332;">Food Delivered Successfully! ✅</h2>
        <p>Hello ${donorName},</p>
        <p>Your donation of <strong>${foodName}</strong> has reached its destination.</p>
        <div style="background:#fff;padding:20px;border-radius:8px;border-left:4px solid #52B788;margin:20px 0;">
          <p><strong>Receiver:</strong> ${receiverName}</p>
          <p><strong>Impact:</strong> ${meals} meals served</p>
          ${photo ? `<div style="margin-top:15px;"><p><strong>Handover Proof:</strong></p><img src="${photo}" style="width:100%;max-width:300px;border-radius:8px;" alt="Delivery Proof"/></div>` : ''}
        </div>
        <p>Thank you for making a difference in the community!</p>
        <p style="color:#52796F;font-size:12px;">Sharebite — Fighting Food Waste Together 🌍</p>
      </div>
    `,
  }),

  verificationOTP: (name, otp) => ({
    subject: '🔐 Verify Your Email — Sharebite',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f0fff4;padding:32px;border-radius:12px;">
        <h2 style="color:#1B4332;">Welcome to Sharebite, ${name}! 🌱</h2>
        <p>To complete your registration, please verify your email address using the following code:</p>
        <div style="background:#fff;padding:15px;border-radius:8px;border:2px solid #52B788;text-align:center;font-size:24px;letter-spacing:8px;font-weight:bold;color:#1B4332;">
          ${otp}
        </div>
        <p style="margin-top:20px;font-size:14px;color:#666;">This code is valid for 10 minutes. If you didn't create an account, please ignore this email.</p>
        <p style="color:#52796F;font-size:12px;">Sharebite — Fighting Food Waste Together 🌍</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
