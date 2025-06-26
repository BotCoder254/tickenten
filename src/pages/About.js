import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-10"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
              Welcome to <span className="text-primary-500">TickenTen</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Powering the future of events — one ticket at a time.
            </p>
          </div>

          {/* Section: Who We Are */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>Who We Are</h2>
            <p>
              TickenTen is not just a platform — it’s a movement. Built for creators, organizers, and communities,
              we make it easy to host events, sell tickets, and engage attendees in meaningful ways.
            </p>
            <p>
              From concerts to conferences, open mics to mega expos — we simplify the chaos so you can focus
              on what really matters: delivering unforgettable experiences.
            </p>
          </div>

          {/* Section: Our Journey */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>Our Journey</h2>
            <p>
              It all began in 2025 with a simple idea — make events smarter and simpler.
              After experiencing the hurdles of event planning firsthand, we built a tool that evolved
              into a full-fledged ticketing ecosystem.
            </p>
            <p>
              Today, TickenTen empowers creators across Nigeria and beyond to manage, promote, and scale
              their events with zero hassle and full confidence.
            </p>
          </div>

          {/* Section: Core Values */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>What We Believe</h2>
            <ul>
              <li><strong>Empowerment</strong> — We give creators the tools to own their success.</li>
              <li><strong>Transparency</strong> — No hidden fees, no surprises. Just clarity.</li>
              <li><strong>Speed</strong> — From setup to ticket sales, everything happens in minutes.</li>
              <li><strong>Community</strong> — We believe in connection, collaboration, and celebration.</li>
              <li><strong>Innovation</strong> — We push boundaries to build the future of events.</li>
            </ul>
          </div>

          {/* Section: Our Team */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2>The People Behind TickenTen</h2>
            <p>
              We’re a small, passionate team of builders, dreamers, and doers — united by our love for
              live experiences and technology. From devs and designers to support heroes and strategists,
              we’re here to make your event a success.
            </p>
          </div>

          {/* Section: Call to Action */}
          <div className="bg-primary-100 dark:bg-primary-900/20 rounded-xl p-6 shadow-inner text-center">
            <h3 className="text-xl font-semibold text-primary-700 dark:text-primary-300 mb-2">
              Ready to host your next event?
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Join thousands of creators using TickenTen to power impactful experiences.
            </p>
            <a
              href="/register"
              className="inline-block px-6 py-2 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
            >
              Get Started for Free
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
