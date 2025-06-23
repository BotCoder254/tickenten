const nodemailer = require('nodemailer');

/**
 * Send email using nodemailer
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email content
 * @param {string} options.html - HTML email content
 * @returns {Promise} - Nodemailer send mail promise
 */
const sendEmail = async (options) => {
  // Create transporter
  let transporter;
  
  // Check if using OAuth2 or regular authentication
  if (process.env.EMAIL_USE_OAUTH === 'true') {
    // OAuth2 configuration
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USERNAME,
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
        accessToken: process.env.EMAIL_ACCESS_TOKEN,
      },
    });
  } else {
    // Regular authentication with Gmail requires an App Password
    // Make sure to generate an App Password in your Google Account settings
    // See: https://support.google.com/accounts/answer/185833
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME || 'telvivaztelvin@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'wyat thsy uhiy xvgv',
      },
    });
  }

  // Define mail options
  const mailOptions = {
    from: `"Tickenten" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME || 'noreply@tickenten.com'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || '',
    html: options.html || '',
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail; 