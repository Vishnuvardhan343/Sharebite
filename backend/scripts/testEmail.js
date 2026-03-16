require('dotenv').config({ path: '../.env' });
const nodemailer = require('nodemailer');

const testEmail = async () => {
    console.log('Testing email configuration...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP connection successful');
        
        const info = await transporter.sendMail({
            from: `"Sharebite Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Sharebite OTP Test',
            text: 'This is a test email to verify SMTP configuration.',
        });
        console.log('✅ Test email sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error:', error.message);
        if (error.message.includes('Invalid login')) {
            console.log('Tip: Ensure you are using an "App Password" for Gmail if 2FA is enabled.');
        }
    }
};

testEmail();
