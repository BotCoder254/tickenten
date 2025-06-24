/**
 * SMS Test Script
 * 
 * This script tests the SMS sending functionality without requiring a database connection.
 */
const sendSMSNotification = require('../utils/sms');
require('dotenv').config();

// Test user information
const TEST_PHONE = '254792052669';

/**
 * Function to send a test SMS
 */
const sendTestSMS = async () => {
  console.log('\n===================================');
  console.log('🚀 SMS TEST STARTED');
  console.log('===================================\n');
  
  try {
    console.log(`Sending test SMS to ${TEST_PHONE}...`);
    
    // Create a test message
    const testMessage = `
🎫 TICKENTEN TEST MESSAGE 🎫

This is a test SMS from the Tickenten app.
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Thank you for using our service!
    `.trim();
    
    // Send the SMS
    const smsResponse = await sendSMSNotification(TEST_PHONE, testMessage);
    
    // Parse the response if it's a string
    let smsResult;
    try {
      smsResult = typeof smsResponse === 'string' ? JSON.parse(smsResponse) : smsResponse;
    } catch (e) {
      smsResult = smsResponse;
    }
    
    console.log('SMS API Response:', JSON.stringify(smsResult, null, 2));
    
    // Check for success based on VasPro API response format
    if (smsResult && (smsResult.code === 'Success' || smsResult.statusDescription === 'Success')) {
      console.log('\n✅✅✅ SMS SENT SUCCESSFULLY ✅✅✅');
      console.log(`SMS has been sent to: ${TEST_PHONE}`);
      console.log('\nPlease check the recipient device to verify receipt.');
      return true;
    } else {
      console.log('\n⚠️ SMS MAY NOT HAVE BEEN DELIVERED ⚠️');
      console.log('Check the API response above for details.');
      return false;
    }
  } catch (error) {
    console.error('\n❌❌❌ SMS TEST FAILED ❌❌❌');
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
};

// Run the test
sendTestSMS()
  .then(success => {
    console.log('\nTest completed.');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 