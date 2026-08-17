import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaPaperPlane, FaQuoteLeft } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const testimonials = [
    { name: 'Priya Sharma', location: 'Mumbai', rating: 5, text: 'Absolutely stunning! Best vacation ever!', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { name: 'Rahul Verma', location: 'Delhi', rating: 5, text: 'Booking was smooth, hotels were amazing!', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    { name: 'Anjali Patel', location: 'Bangalore', rating: 4, text: 'Beautiful islands with rich history!', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please provide a rating'); return; }
    setIsSubmitting(true);

    try {
      await axios.post('http://localhost:5000/api/feedback', { ...formData, rating });
      toast.success('Thank you for your feedback! 🎉');
      setFormData({ name: '', email: '', message: '' });
      setRating(0);
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 md:pt-36 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-sm font-semibold mb-4">FEEDBACK</span>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">Share Your <span className="gradient-text">Experience</span></h1>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Rate Your Experience</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-center gap-2 py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <FaStar size={40} className={`transition-colors ${star <= (hoverRating || rating) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} />
                  </motion.button>
                ))}
              </div>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Your Name" />
              <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="Your Email" />
              <textarea required rows="4" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="input-field resize-none" placeholder="Your feedback..." />
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'} <FaPaperPlane />
              </button>
            </form>
          </motion.div>

          {/* Testimonials */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What Others Say</h2>
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-6">
                <FaQuoteLeft className="text-3xl text-teal-500/20 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{t.name}</h4>
                    <p className="text-sm text-gray-500">{t.location}</p>
                  </div>
                  <div className="ml-auto flex">{[...Array(t.rating)].map((_, i) => <FaStar key={i} className="text-yellow-500" />)}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;