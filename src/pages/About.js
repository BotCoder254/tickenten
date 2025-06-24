import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">About TickenTen</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p>
              TickenTen is a modern ticketing platform designed to make event management simple and accessible for everyone. 
              Our mission is to connect people through memorable experiences by providing powerful tools for event creators 
              and a seamless experience for attendees.
            </p>
            
            <h2>Our Story</h2>
            <p>
              Founded in 2023, TickenTen was born from a simple observation: event management should be straightforward 
              and stress-free. Our founders, having organized numerous events themselves, understood the challenges that 
              come with ticketing, attendee management, and promotion.
            </p>
            <p>
              What started as a solution to their own problems quickly grew into a comprehensive platform serving 
              event organizers of all sizes, from small community gatherings to large-scale conferences.
            </p>
            
            <h2>Our Values</h2>
            <ul>
              <li><strong>Simplicity</strong> - We believe in making complex processes simple and intuitive.</li>
              <li><strong>Accessibility</strong> - Events should be accessible to everyone, and so should our platform.</li>
              <li><strong>Innovation</strong> - We continuously improve our platform with cutting-edge technology.</li>
              <li><strong>Community</strong> - We foster connections and build communities through shared experiences.</li>
              <li><strong>Security</strong> - We prioritize the security of our users' data and transactions.</li>
            </ul>
            
            <h2>Our Team</h2>
            <p>
              Our diverse team brings together expertise in event management, software development, design, and customer support. 
              We're united by our passion for creating meaningful experiences and our commitment to excellence.
            </p>
            
            <h2>Join Us</h2>
            <p>
              Whether you're organizing your first event or your hundredth, TickenTen is here to support you every step of the way. 
              Join our growing community of event creators and attendees, and let's make your next event unforgettable.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About; 