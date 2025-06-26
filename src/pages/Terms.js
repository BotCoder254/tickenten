import React from 'react';
import { motion } from 'framer-motion';

const Terms = () => {
  return (
    <div className="pt-24 pb-20 min-h-screen bg-gradient-to-br from-white via-slate-100 to-white dark:from-[#0f0f0f] dark:via-[#111] dark:to-[#0f0f0f] transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              Terms of Service
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last updated: June 1, 2023</p>
          </div>

          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-lg shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl p-8 overflow-hidden prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed dark:text-gray-300 transition-all duration-300">
            <h2>1. Introduction</h2>
            <p>
              Welcome to TickenTen. These Terms of Service ("Terms") govern your access to and use of the TickenTen website,
              mobile applications, and services (collectively, the "Services"). By accessing or using our Services, you agree
              to be bound by these Terms and our Privacy Policy.
            </p>
            <p>
              If you do not agree to these Terms, please do not use our Services. If you are using the Services on behalf of
              an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>

            <h2>2. Account Registration</h2>
            <p>To access certain features of our Services, you may need to register for an account. When you register, you agree to:</p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly update your account information if it changes</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or that we determine, in our sole
              discretion, are inactive for an extended period.
            </p>

            <h2>3. User Conduct</h2>
            <p>When using our Services, you agree not to:</p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Use the Services for any illegal or unauthorized purpose</li>
              <li>Interfere with or disrupt the Services</li>
              <li>Attempt to gain unauthorized access to any part of the Services</li>
              <li>Use automated means to access or collect data from the Services</li>
              <li>Post or transmit harmful code or malware</li>
              <li>Impersonate any person or entity</li>
            </ul>

            <h2>4. Event Creation and Ticket Sales</h2>
            <p>If you create events or sell tickets through our platform:</p>
            <ul>
              <li>You are responsible for the accuracy of all event information</li>
              <li>You must comply with all applicable laws regarding ticket sales, refunds, and event management</li>
              <li>You agree to our fee structure for ticket sales</li>
              <li>You must honor all tickets sold through our platform</li>
              <li>You are responsible for any taxes associated with your ticket sales</li>
            </ul>

            <h2>5. Ticket Purchases</h2>
            <p>When purchasing tickets through our platform:</p>
            <ul>
              <li>All sales are final unless otherwise specified by the event organizer</li>
              <li>Refunds and exchanges are subject to the event organizer's policies</li>
              <li>We are not responsible for lost, stolen, or damaged tickets</li>
              <li>We do not guarantee entry to events if tickets are not presented as required</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <p>
              The Services and all content and materials included on the Services, including, but not limited to, text,
              graphics, logos, images, and software, are the property of TickenTen or our licensors and are protected by
              copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You may not use, reproduce, distribute, modify, create derivative works of, publicly display, or publicly
              perform any of the content or materials on the Services without our prior written consent.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, TickenTen and its officers, directors, employees, and agents shall
              not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits,
              arising out of or relating to your use of or inability to use the Services.
            </p>

            <h2>8. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless TickenTen and its officers, directors, employees, and agents from
              and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees,
              arising out of or in any way connected with your access to or use of the Services, your violation of these
              Terms, or your violation of any rights of another.
            </p>

            <h2>9. Modifications to Terms</h2>
            <p>
              We may modify these Terms at any time by posting the revised Terms on our website. Your continued use of the
              Services after any such changes constitutes your acceptance of the new Terms.
            </p>

            <h2>10. Termination</h2>
            <p>
              We may terminate or suspend your access to the Services at any time, with or without cause, and with or without
              notice. Upon termination, your right to use the Services will immediately cease.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard
              to its conflict of law provisions.
            </p>

            <h2>12. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <p>
              Email: <a href="mailto:legal@tickenten.com">legal@tickenten.com</a><br />
              Address: 123 Event Street, San Francisco, CA 94105, United States
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
