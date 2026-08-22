import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaPaperPlane, FaLock } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, session, profile } = useAuth();

  // Pre-fill name/email when user logs in
  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || profile.full_name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user, profile]);

  const contactInfo = [
    { icon: FaPhone, title: 'Phone', details: ['+91 1234 554321', '+91 4321 123455'], color: 'from-green-500 to-emerald-500' },
    { icon: FaEnvelope, title: 'Email', details: ['nicomantourism.myth520@silomails.com'], color: 'from-blue-500 to-cyan-500' },
    { icon: FaMapMarkerAlt, title: 'Address', details: ['Port Blair, A&N Islands'], color: 'from-purple-500 to-pink-500' },
    { icon: FaClock, title: 'Working Hours', details: ['Mon-Fri: 9AM-5PM'], color: 'from-orange-500 to-red-500' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const headers = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const payload = {
        ...formData,
        user_id: user?.id || null,
      };
      await axios.post('/api/contact', payload, { headers });
      toast.success('Message sent successfully! 🎉');
      setFormData(prev => ({
        ...prev,
        subject: '',
        message: '',
      }));
    } catch (error) {
      toast.error('Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-sm font-semibold mb-4">CONTACT US</span>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">Get In <span className="gradient-text">Touch</span></h1>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((info, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-6 text-center group">
              <div className={`inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-r ${info.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <info.icon className="text-2xl" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{info.title}</h3>
              {info.details.map((d, idx) => <p key={idx} className="text-gray-600 dark:text-gray-400 text-sm">{d}</p>)}
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form — only visible when signed in */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="card p-8">
            {!user ? (
              /* Auth gate */
              <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-teal-500/30">
                  <FaLock className="text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Sign in to Send a Message</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
                  We want to know who we're talking to. Please sign in so we can get back to you.
                </p>
                <a href="/auth" className="btn-primary inline-flex items-center gap-2">
                  Sign In / Create Account
                </a>
              </div>
            ) : (
              /* Contact form */
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Your Name" />
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="Your Email" />
                  <input type="text" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="input-field" placeholder="Subject" />
                  <textarea required rows="5" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="input-field resize-none" placeholder="Your Message" />
                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                    {isSubmitting ? 'Sending...' : 'Send Message'} <FaPaperPlane />
                  </button>
                </form>
              </>
            )}
          </motion.div>

          {/* Map */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="card overflow-hidden" style={{ minHeight: '400px' }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125238.5615039569!2d92.64858!3d11.6234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3088946c176b5e5d%3A0x5c164e2a9b5b58c!2sPort%20Blair!5e0!3m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '400px' }}
              allowFullScreen=""
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;