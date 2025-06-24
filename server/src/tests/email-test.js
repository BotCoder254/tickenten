/**
 * Email Test Script
 * 
 * This script tests the email sending functionality without requiring a database connection.
 */
const sendEmail = require('../utils/email');
require('dotenv').config();

// Test user information
const TEST_EMAIL = 'telvivaztelvin@gmail.com';

/**
 * Function to send a test email
 */
const sendTestEmail = async () => {
  console.log('\n===================================');
  console.log('🚀 EMAIL TEST STARTED');
  console.log('===================================\n');
  
  try {
    console.log(`Sending test email to ${TEST_EMAIL}...`);
    
    // Create a test HTML message
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">Tickenten Test Email</h1>
          <p style="font-size: 16px; color: #666;">This is a test email from the Tickenten app.</p>
        </div>
        
        <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Test Details</h2>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Test Message</h2>
          <p>This email confirms that your email sending functionality is working correctly.</p>
          <p>You should see this message in your inbox if everything is configured properly.</p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            This is a test email for verification purposes.
          </p>
        </div>
      </div>
    `;
    
    // Send the email
    await sendEmail({
      to: TEST_EMAIL,
      subject: '[TEST] Tickenten Email Verification',
      html: htmlContent,
    });
    
    console.log('\n✅✅✅ EMAIL SENT SUCCESSFULLY ✅✅✅');
    console.log(`Email has been sent to: ${TEST_EMAIL}`);
    console.log('\nPlease check your inbox to verify receipt.');
    return true;
  } catch (error) {
    console.error('\n❌❌❌ EMAIL TEST FAILED ❌❌❌');
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
};

// Run the test
sendTestEmail()
  .then(success => {
    console.log('\nTest completed.');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 