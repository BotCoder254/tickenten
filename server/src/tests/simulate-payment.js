/**
 * Payment Simulation Test Script
 * 
 * This script simulates a payment flow for testing the SMS and email functionality
 * without actually processing a payment.
 */
const mongoose = require('mongoose');
const Event = require('../models/event.model');
const Ticket = require('../models/ticket.model');
const sendEmail = require('../utils/email');
const sendSMSNotification = require('../utils/sms');
require('dotenv').config();

// Test user information
const TEST_EMAIL = 'telvivaztelvin@gmail.com';
const TEST_PHONE = '254792052669';
const TEST_NAME = 'Test User';

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tickenten');
    console.log('MongoDB connected');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

/**
 * Simulate a payment and ticket purchase
 */
const simulatePayment = async () => {
  console.log('Starting payment simulation...');
  
  try {
    // Find a random event with available tickets
    const event = await Event.findOne({
      'ticketTypes.quantity': { $gt: 0 },
      'ticketTypes.quantitySold': { $lt: '$ticketTypes.quantity' }
    });
    
    if (!event) {
      console.error('No events with available tickets found');
      return false;
    }
    
    console.log(`Found event: ${event.title}`);
    
    // Find a ticket type with available tickets
    const ticketType = event.ticketTypes.find(
      t => t.quantity > t.quantitySold
    );
    
    if (!ticketType) {
      console.error('No available ticket types found');
      return false;
    }
    
    console.log(`Using ticket type: ${ticketType.name}, Price: ${ticketType.price} ${ticketType.currency}`);
    
    // Simulate purchase data
    const purchaseData = {
      eventId: event._id,
      ticketTypeId: ticketType._id,
      quantity: 1,
      attendeeName: TEST_NAME,
      attendeeEmail: TEST_EMAIL,
      attendeePhone: TEST_PHONE,
      paymentMethod: 'TEST - Simulation',
      paymentReference: `TEST-${Date.now()}`,
      paymentCurrency: ticketType.currency || 'USD',
    };
    
    console.log('Creating test ticket...');
    
    // Create a test ticket
    const ticket = new Ticket({
      event: purchaseData.eventId,
      user: null, // Simulating guest purchase
      ticketType: purchaseData.ticketTypeId,
      ticketNumber: `TEST${Date.now()}${Math.floor(Math.random() * 1000)}`,
      purchaseDate: Date.now(),
      status: 'valid',
      attendeeName: purchaseData.attendeeName,
      attendeeEmail: purchaseData.attendeeEmail,
      attendeePhone: purchaseData.attendeePhone,
      paymentMethod: purchaseData.paymentMethod,
      paymentReference: purchaseData.paymentReference,
      paymentCurrency: purchaseData.paymentCurrency,
      guestPurchase: true,
    });
    
    await ticket.save();
    console.log(`Ticket created with number: ${ticket.ticketNumber}`);
    
    // Generate ticket information for email
    const ticketListItem = `
      <li style="margin-bottom: 10px;">
        <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px;">
          <p><strong>Ticket #:</strong> ${ticket.ticketNumber}</p>
          <p><strong>Attendee:</strong> ${ticket.attendeeName}</p>
          <div style="margin-top: 10px; text-align: center;">
            <p><strong>Scan QR code at the event:</strong></p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(ticket.qrCodeData)}&size=150x150" alt="Ticket QR Code" style="width: 150px; height: 150px;">
          </div>
        </div>
      </li>
    `;

    // Create an enhanced HTML email with ticket details and QR code
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333;">Ticket Confirmation</h1>
          <p style="font-size: 16px; color: #666;">Thank you for purchasing tickets for ${event.title}!</p>
        </div>
        
        <div style="margin-bottom: 30px; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
          <h2 style="color: #333; margin-top: 0;">Event Details</h2>
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${new Date(event.startDate).toLocaleDateString()} at ${new Date(event.startDate).toLocaleTimeString()}</p>
          <p><strong>Location:</strong> ${event.isVirtual ? 'Virtual Event' : `${event.location.venue}, ${event.location.city}, ${event.location.country}`}</p>
          ${event.isVirtual ? `<p><strong>Virtual Link:</strong> Will be sent before the event</p>` : ''}
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Purchase Summary</h2>
          <p><strong>Ticket Type:</strong> ${ticketType.name}</p>
          <p><strong>Quantity:</strong> 1</p>
          <p><strong>Price per Ticket:</strong> ${ticketType.price} ${ticketType.currency}</p>
          <p><strong>Total:</strong> ${ticketType.price * 1} ${ticketType.currency}</p>
          <p><strong>Payment Reference:</strong> ${purchaseData.paymentReference}</p>
          <p><strong>Payment Method:</strong> ${purchaseData.paymentMethod}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="color: #333;">Your Tickets</h2>
          <ul style="list-style-type: none; padding: 0;">
            ${ticketListItem}
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            Please keep this email as proof of purchase.
          </p>
          <p style="color: #666; font-size: 14px;">
            This is a test email for simulation purposes.
          </p>
        </div>
      </div>
    `;

    // Send email notification
    console.log(`Sending test email to ${TEST_EMAIL}...`);
    await sendEmail({
      to: TEST_EMAIL,
      subject: `[TEST] Your Tickets for ${event.title}`,
      html: emailHtml,
    });
    console.log('✅ Email sent successfully to ' + TEST_EMAIL);

    // Generate SMS message with ticket info
    const smsMessage = `
[TEST] Ticket Confirmation for ${event.title}
Date: ${new Date(event.startDate).toLocaleDateString()}
Time: ${new Date(event.startDate).toLocaleTimeString()}
Ticket(s): 1 x ${ticketType.name}
Total: ${ticketType.price * 1} ${ticketType.currency}
Ticket #: ${ticket.ticketNumber}
    `.trim();

    // Send SMS notification
    console.log(`Sending test SMS to ${TEST_PHONE}...`);
    const smsResult = await sendSMSNotification(TEST_PHONE, smsMessage);
    console.log('SMS API Response:', JSON.stringify(smsResult, null, 2));
    
    if (smsResult && (smsResult.success || smsResult.status === 'success')) {
      console.log('✅ SMS sent successfully to ' + TEST_PHONE);
    } else {
      console.log('⚠️ SMS may not have been delivered. Check the API response above for details.');
    }
    
    // Update ticket type quantity sold
    ticketType.quantitySold += 1;
    await event.save();
    console.log('✅ Event ticket inventory updated');
    
    console.log('\n====== TEST SUMMARY ======');
    console.log(`Event: ${event.title}`);
    console.log(`Ticket Type: ${ticketType.name}`);
    console.log(`Price: ${ticketType.price} ${ticketType.currency}`);
    console.log(`Ticket Number: ${ticket.ticketNumber}`);
    console.log(`Email Sent To: ${TEST_EMAIL}`);
    console.log(`SMS Sent To: ${TEST_PHONE}`);
    console.log('==========================\n');
    
    return true;
  } catch (error) {
    console.error('Error in payment simulation:', error);
    return false;
  }
};

/**
 * Main function to run the simulation
 */
const runSimulation = async () => {
  console.log('\n===================================');
  console.log('🚀 PAYMENT FLOW SIMULATION STARTED');
  console.log('===================================\n');
  
  // Connect to the database
  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to the database');
    process.exit(1);
  }
  
  // Run the simulation
  const success = await simulatePayment();
  
  if (success) {
    console.log('\n✅✅✅ PAYMENT SIMULATION COMPLETED SUCCESSFULLY ✅✅✅');
    console.log('Email and SMS notifications have been sent to:');
    console.log(`- Email: ${TEST_EMAIL}`);
    console.log(`- Phone: ${TEST_PHONE}`);
    console.log('\nPlease check the recipient devices to verify receipt.');
  } else {
    console.error('\n❌❌❌ PAYMENT SIMULATION FAILED ❌❌❌');
    console.error('Check the error messages above for more details.');
  }
  
  // Close the database connection
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
  
  process.exit(success ? 0 : 1);
};

// Run the simulation
runSimulation(); 