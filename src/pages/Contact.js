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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const response = await fetch('https://zocia.preciousadedokun.com.ng/f/pr2b4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-white via-slate-100 to-white dark:from-[#0f0f0f] dark:via-[#111] dark:to-[#0f0f0f] transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-12 tracking-tight">
            Let's Connect
          </h1>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Contact Info</h2>
              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                Have questions, suggestions, or just want to say hello? We're always here to help you make your events extraordinary.
              </p>

              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-4">
                  <FiMail className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Email</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@tickenten.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <FiPhone className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Phone</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <FiMapPin className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">Address</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      123 Event Street<br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="backdrop-blur-md bg-white/70 dark:bg-white/5 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-6 sm:p-8 transition-all duration-300">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">Send a Message</h2>

              {status === 'success' && (
                <div className="mb-4 p-3 rounded-md bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 text-sm font-medium">
                  ✅ Message sent successfully!
                </div>
              )}
              {status === 'error' && (
                <div className="mb-4 p-3 rounded-md bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 text-sm font-medium">
                  ❌ Something went wrong. Try again later.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-2 rounded-md bg-white dark:bg-[#111] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-2 rounded-md bg-white dark:bg-[#111] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-2 rounded-md bg-white dark:bg-[#111] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                  <textarea
                    name="message"
                    rows="4"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full mt-1 px-4 py-2 rounded-md bg-white dark:bg-[#111] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-60"
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
