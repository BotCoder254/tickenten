import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "What is TickenTen?",
      answer: "TickenTen is a modern ticketing platform that helps event organizers create, manage, and sell tickets to their events. For attendees, TickenTen provides an easy way to discover events and purchase tickets securely."
    },
    {
      question: "How do I create an event?",
      answer: "To create an event, sign in to your account, navigate to the Dashboard, and click on 'Create Event'. Follow the step-by-step process to add event details, set up ticket types, and customize your event page."
    },
    {
      question: "How do I purchase tickets?",
      answer: "Browse events on our platform, select the event you're interested in, choose your ticket type and quantity, and proceed to checkout. You can pay using various payment methods, and your tickets will be delivered to your email."
    },
    {
      question: "Can I get a refund for my tickets?",
      answer: "Refund policies are set by event organizers. Check the specific event's refund policy on the event page. If refunds are allowed, you can request one from your order history in your account."
    },
    {
      question: "How do I transfer tickets to someone else?",
      answer: "If the event organizer allows ticket transfers, you can do so from your account. Navigate to 'My Tickets', select the ticket you want to transfer, and enter the recipient's email address."
    },
    {
      question: "What fees does TickenTen charge?",
      answer: "For event organizers, we charge a small percentage of each ticket sale plus a fixed fee per ticket. For attendees, there may be a service fee added to the ticket price. All fees are transparently displayed during checkout."
    },
    {
      question: "How do I contact event organizers?",
      answer: "Each event page has a 'Contact Organizer' button that allows you to send a message directly to the event organizer. They will receive your message via email and can respond to you."
    },
    {
      question: "Is my payment information secure?",
      answer: "Yes, we use industry-standard security measures to protect your payment information. We do not store your full credit card details on our servers. All payment processing is handled by secure payment processors."
    },
    {
      question: "How do I access my tickets?",
      answer: "Your tickets are delivered to your email after purchase. You can also access them anytime by logging into your account and going to 'My Tickets'. For entry to events, you can show the digital ticket on your phone or print it out."
    },
    {
      question: "What if an event is canceled?",
      answer: "If an event is canceled, you will be notified via email. The event organizer's cancellation policy will determine if you receive a refund automatically or need to request one. Check the event page or your email notification for specific instructions."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">Frequently Asked Questions</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Find answers to common questions about using TickenTen for event management and ticket purchasing.
          </p>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="card overflow-hidden"
              >
                <button
                  className="flex justify-between items-center w-full p-6 text-left"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </h3>
                  {openIndex === index ? (
                    <FiChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
                
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6"
                  >
                    <p className="text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Still have questions?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Our support team is here to help you with any other questions you might have.
            </p>
            <a 
              href="/contact" 
              className="btn btn-primary"
            >
              Contact Support
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ; 