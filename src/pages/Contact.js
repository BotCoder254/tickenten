import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('https://formspree.io/f/mjvnnzna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-10">Contact Us</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Get in Touch</h2>
              <p className="text-gray-600 dark:text-gray-400">
                We'd love to hear from you. Whether it's feedback, a question, or just a hello — drop us a message.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <FiMail className="text-primary-600 dark:text-primary-400 w-6 h-6" />
                  <span className="text-gray-800 dark:text-gray-300">support@tickenten.com</span>
                </div>
                <div className="flex items-center space-x-4">
                  <FiPhone className="text-primary-600 dark:text-primary-400 w-6 h-6" />
                  <span className="text-gray-800 dark:text-gray-300">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-start space-x-4">
                  <FiMapPin className="text-primary-600 dark:text-primary-400 w-6 h-6" />
                  <span className="text-gray-800 dark:text-gray-300">
                    123 Event Street, San Francisco, CA 94105
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-md border dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Send a Message</h2>

              {status === 'success' ? (
                <div className="bg-green-100 text-green-800 p-4 rounded-md dark:bg-green-900/30 dark:text-green-300">
                  🎉 Message sent successfully!
                </div>
              ) : status === 'error' ? (
                <div className="bg-red-100 text-red-800 p-4 rounded-md dark:bg-red-900/30 dark:text-red-300">
                  ❌ Something went wrong. Please try again.
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input mt-1 w-full"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input mt-1 w-full"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="input mt-1 w-full"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="input mt-1 w-full"
                  ></textarea>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="btn btn-primary w-full"
                  >
                    {status === 'sending' ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
