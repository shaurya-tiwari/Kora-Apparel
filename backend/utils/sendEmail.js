const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // If SMTP environment variables are missing, fallback to console.log for easy local development testing.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n' + '💠 '.repeat(20));
    console.log('📧  MOCK EMAIL (SMTP Not Configured):');
    console.log(`FROM:    ${process.env.FROM_NAME || 'Kora Apparel'} <${process.env.FROM_EMAIL || 'varunsoni8375@gmail.com'}>`);
    console.log(`TO:      ${options.email}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`OTP:     ${options.message.match(/\d{6}/)?.[0] || 'N/A'}`);
    console.log('💠 '.repeat(20) + '\n');
    return true;
  }

  const transporterConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // Gmail specific optimization
  if (process.env.SMTP_HOST.includes('gmail.com')) {
    delete transporterConfig.host;
    delete transporterConfig.port;
    transporterConfig.service = 'gmail';
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  const fromEmail = process.env.FROM_EMAIL || 'varunsoni8375@gmail.com';
  const fromName = process.env.FROM_NAME || 'Kora Apparel';

  const message = {
    from: `${fromName} <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(message);
  return info;
};

module.exports = sendEmail;
