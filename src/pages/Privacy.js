import React from 'react';
import { motion } from 'framer-motion';

const Privacy = () => {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: June 1, 2023</p>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              TickenTen ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using our platform, you acknowledge that you have read, 
              understood, and agree to be bound by all the terms outlined in this policy.
            </p>
            
            <h2>Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide to us when you:</p>
            <ul>
              <li>Create an account</li>
              <li>Purchase tickets</li>
              <li>Create or manage events</li>
              <li>Contact our support team</li>
              <li>Subscribe to our newsletter</li>
              <li>Participate in promotions or surveys</li>
            </ul>
            <p>This information may include:</p>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Billing information</li>
              <li>Profile information</li>
            </ul>
            
            <h3>Automatically Collected Information</h3>
            <p>When you access our platform, we may automatically collect certain information about your device, including:</p>
            <ul>
              <li>IP address</li>
              <li>Browser type</li>
              <li>Operating system</li>
              <li>Device information</li>
              <li>Usage data</li>
              <li>Cookies and similar technologies</li>
            </ul>
            
            <h2>How We Use Your Information</h2>
            <p>We may use the information we collect for various purposes, including to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative information, such as updates or security alerts</li>
              <li>Respond to inquiries and provide customer support</li>
              <li>Send marketing communications</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Protect against fraudulent or unauthorized transactions</li>
              <li>Comply with legal obligations</li>
            </ul>
            
            <h2>Disclosure of Your Information</h2>
            <p>We may share your information with:</p>
            <ul>
              <li>Event organizers (when you purchase tickets)</li>
              <li>Service providers who perform services on our behalf</li>
              <li>Business partners with your consent</li>
              <li>Legal authorities when required by law</li>
            </ul>
            
            <h2>Your Privacy Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul>
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to request deletion of your information</li>
              <li>The right to restrict or object to processing</li>
              <li>The right to data portability</li>
            </ul>
            
            <h2>Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information. 
              However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot 
              guarantee absolute security.
            </p>
            
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated version will be indicated by an updated 
              "Last Updated" date. We encourage you to review this Privacy Policy periodically.
            </p>
            
            <h2>Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <p>
              Email: privacy@tickenten.com<br />
              Address: 123 Event Street, San Francisco, CA 94105, United States
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy; 