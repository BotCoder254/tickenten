const https = require('https');

/**
 * Send an SMS notification via VasPro
 * @param {string} phoneNumber - The recipient's phone number
 * @param {string} message - The SMS message to send
 * @returns {Promise} - A promise that resolves with the API response
 */
const sendSMSNotification = async (phoneNumber, message) => {
  try {
    // Format phone number to ensure it starts with 254
    let formattedPhone = phoneNumber.toString().trim();
    formattedPhone = formattedPhone.replace(/^\+|^0+|\s+/g, "");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    // Try a different approach using token instead of apiKey
    const data = JSON.stringify({
      token: 'f9e412887a42ff4938baa34971e0b096',
      shortCode: 'VasPro',
      recipient: formattedPhone,
      enqueue: 1,
      message: message,
      callbackURL: ''
    });

    console.log('API Request Payload:', data);

    const options = {
      hostname: 'api.vaspro.co.ke',
      port: 443,
      path: '/v3/BulkSMS/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    return new Promise((resolve, reject) => {
      const smsReq = https.request(options, (smsRes) => {
        let responseData = '';

        smsRes.on('data', (chunk) => {
          responseData += chunk;
        });

        smsRes.on('end', () => {
          console.log('SMS sent successfully:', responseData);
          resolve(responseData);
        });
      });

      smsReq.on('error', (error) => {
        console.error('Error sending SMS:', error);
        reject(error);
      });

      smsReq.write(data);
      smsReq.end();
    });
  } catch (error) {
    console.error('SMS sending error:', error);
    throw error;
  }
};

module.exports = sendSMSNotification; 