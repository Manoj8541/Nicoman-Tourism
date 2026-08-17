import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaEnvelope, FaMapMarkerAlt, FaHeart, FaArrowUp } from 'react-icons/fa';
import { GiIsland } from 'react-icons/gi';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialLinks = [
    { icon: FaFacebook, href: '#', color: 'hover:bg-blue-600' },
    { icon: FaTwitter, href: '#', color: 'hover:bg-sky-500' },
    { icon: FaInstagram, href: '#', color: 'hover:bg-pink-600' },
    { icon: FaYoutube, href: '#', color: 'hover:bg-red-600' },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-visible">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Scroll to Top Button - Positioned above footer */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-30">
        <motion.button
          onClick={scrollToTop}
          whileHover={{ scale: 1.15, y: -3 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full shadow-2xl shadow-teal-500/50 hover:shadow-teal-400/70 transition-all duration-300 border-4 border-gray-900"
          aria-label="Scroll to top"
        >
          <FaArrowUp className="text-white text-xl" />
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="text-4xl text-teal-400">
                <GiIsland />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Andaman</h3>
                <p className="text-xs text-gray-400 tracking-widest">TOURISM</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Discover paradise on earth. Crystal clear waters, pristine beaches, and unforgettable adventures await you in the Andaman & Nicobar Islands.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.2, y: -3 }}
                  className={`p-3 bg-gray-800 rounded-xl transition-colors ${social.color}`}
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-xl font-bold mb-6 gradient-text">Explore</h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Home' },
                { to: '/tourist-places', label: 'Tourist Places' },
                { to: '/hotels', label: 'Hotels & Resorts' },
                { to: '/ship-schedule', label: 'Ship Schedule' },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-teal-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-2 h-2 bg-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-6 gradient-text">Support</h3>
            <ul className="space-y-3">
              {[
                { to: '/feedback', label: 'Give Feedback' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/route-map', label: 'Route Map' },
                { to: '/contact', label: 'FAQs' },
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-teal-400 transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-2 h-2 bg-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-6 gradient-text">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="p-2 bg-teal-500/20 rounded-lg flex-shrink-0">
                  <FaMapMarkerAlt className="text-teal-400" />
                </div>
                <div>
                  <p className="text-gray-400"> <a href="https://maps.google.com/?q=Port+Blair,+Andaman+and+Nicobar+Islands"
                  className="text-gray-400 hover:text-teal-400 transition-colors text-sm break-all">
                    Port Blair, Andaman & Nicobar Islands, India </a> </p>
                </div>
              </li>
              <li className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500/20 rounded-lg flex-shrink-0">
                  <FaPhone className="text-teal-400" />
                </div>
                <p className="text-gray-400"> <a href="tel:+911234554321"
                className="text-gray-400 hover:text-teal-400 transition-colors text-sm break-all">
                    +91 12345 54321
                </a></p>
              </li>
              <li className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500/20 rounded-lg flex-shrink-0">
                  <FaEnvelope className="text-teal-400" />
                </div>
                <p className="text-gray-400 text-sm break-all"> <a 
                   href="https://mail.google.com/mail/?view=cm&fs=1&to=info@andamantourism.gov.in&su=Tourism Inquiry&body=Hello,%0A%0A%0A%0AThank you."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-teal-400 transition-colors text-sm break-all"
                  >
                  info@andamantourism.gov.in
                </a></p>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 flex items-center gap-2 text-center md:text-left">
               2026 Modern Demonstration Andaman-Nicobar Tourism WebPage. Made with <FaHeart className="text-red-500 animate-pulse" /> in India
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-teal-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;