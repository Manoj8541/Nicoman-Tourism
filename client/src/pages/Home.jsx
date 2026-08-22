import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, animate } from 'framer-motion';
import { FaUmbrellaBeach, FaHotel, FaShip, FaMapMarkedAlt, FaStar, FaChevronRight, FaPlay, FaQuoteLeft, FaChevronDown } from 'react-icons/fa';
import { GiIsland, GiWaves, GiPalmTree } from 'react-icons/gi';

const Counter = ({ value }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (!isInView) return;

    const match = value.match(/^([\d.]+)(.*)$/);
    if (!match) {
      setDisplayValue(value);
      return;
    }

    const targetNum = parseFloat(match[1]);
    const suffix = match[2] || '';
    const isFloat = match[1].includes('.');
    const decimals = isFloat ? (match[1].split('.')[1] || '').length : 0;

    const controls = animate(0, targetNum, {
      duration: 2,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(latest.toFixed(decimals) + suffix);
      }
    });

    return () => controls.stop();
  }, [isInView, value]);

  return <span ref={ref}>{displayValue}</span>;
};

const Home = () => {
  const videoRef = useRef(null);

  // Ensure video plays on load
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Video autoplay failed:', error);
      });
    }
  }, []);

  const features = [
    { icon: FaUmbrellaBeach, title: 'Pristine Beaches', desc: 'Crystal clear waters & white sand', link: '/tourist-places', color: 'from-blue-500 to-cyan-400', delay: 0 },
    { icon: FaHotel, title: 'Luxury Stays', desc: 'World-class resorts & hotels', link: '/hotels', color: 'from-purple-500 to-pink-400', delay: 0.1 },
    { icon: FaShip, title: 'Island Hopping', desc: 'Explore multiple islands easily', link: '/ship-schedule', color: 'from-teal-500 to-green-400', delay: 0.2 },
    { icon: FaMapMarkedAlt, title: 'Guided Tours', desc: 'Expert-led adventures', link: '/route-map', color: 'from-orange-500 to-yellow-400', delay: 0.3 },
  ];

  const stats = [
    { number: '800+', label: 'Islands', icon: GiIsland },
    { number: '50+', label: 'Beaches', icon: GiWaves },
    { number: '80+', label: 'Resorts', icon: GiPalmTree },
    { number: '4.3', label: 'Rating', icon: FaStar },
  ];

  const places = [
    { name: 'Radhanagar Beach', location: 'Havelock Island', image: '/radhanagar_beach.jpg', rating: 4.3 },
    { name: 'Cellular Jail', location: 'Port Blair', image: '/cellular.jpg', rating: 4.1 },
    { name: 'Elephant Beach', location: 'Havelock Island', image: '/elephant-beach.jpg', rating: 4.4 },
  ];

  const testimonials = [
    { name: 'Priya Sharma', role: 'Travel Blogger', image: 'user/user1.jpeg', text: 'Absolutely breathtaking! The beaches here are unlike anything I\'ve ever seen. A true paradise on Earth!' },
    { name: 'Rahul Verma', role: 'Photographer', image: 'user/user2.jpeg', text: 'Every corner is picture-perfect. The crystal clear waters and vibrant marine life are a photographer\'s dream.' },
    { name: 'Anjali Patel', role: 'Adventure Seeker', image: 'user/user3.jpeg', text: 'From scuba diving to kayaking, Andaman offers the best adventure experiences. Highly recommend!' },
  ];

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex flex-col">
        {/* Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/island.jpg"
            className="absolute w-full h-full object-cover scale-105 brightness-110 contrast-105"
          >
            {/* Local video sources from public folder */}
            <source
              src="/island drone view.mp4"
              type="video/mp4"
            />
            {/* Fallback for browsers that don't support video */}
            Your browser does not support the video tag.
          </video>

          {/* Lightened Overlay for text contrast without dimming the video */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />

          {/* Subtle Color Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/15 to-cyan-900/15 mix-blend-overlay" />
        </div>

        {/* Main Content - Centered */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-6xl mx-auto">

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-tight"
            >
              Discover{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Paradise
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Experience the magic of Andaman & Nicobar Islands... where turquoise waters meet pristine beaches and adventure awaits at every corner
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link to="/tourist-places" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl blur-lg opacity-70 group-hover:opacity-100 transition-opacity" />
                <button className="relative btn-primary flex items-center gap-2">
                  Explore Destinations
                  <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/hotels">
                <button className="flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-lg text-white rounded-xl font-bold text-lg border border-white/30 hover:bg-white/20 transition-all">
                  <FaPlay className="text-sm" />
                  Book Your Stay
                </button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator - Fixed at bottom with proper spacing */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="relative z-10 flex justify-center pb-16 md:pb-20"
        >
          <motion.button
            onClick={scrollToContent}
            className="flex flex-col items-center text-white/70 hover:text-white transition-colors cursor-pointer group"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm mb-3 font-medium tracking-wide">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-7 h-11 border-2 border-white/50 group-hover:border-white rounded-full flex justify-center pt-2"
            >
              <motion.div
                animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="w-1.5 h-2.5 bg-white/70 group-hover:bg-white rounded-full"
              />
            </motion.div>
            <motion.div
              animate={{ y: [0, 4, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="mt-2"
            >
              <FaChevronDown className="text-base" />
            </motion.div>
          </motion.button>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 z-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 text-teal-500 group-hover:scale-110 transition-transform">
                  <stat.icon className="text-3xl" />
                </div>
                <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                  <Counter value={stat.number} />
                </div>
                <div className="text-gray-500 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-sm font-semibold mb-4">
              WHY CHOOSE US
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Everything You Need for a
              <span className="gradient-text"> Perfect Trip</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From booking to exploring, we've got every aspect of your journey covered
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: feature.delay }}
              >
                <Link to={feature.link}>
                  <div className="group relative h-full">
                    <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`} />
                    <div className="relative card p-8 h-full text-center group-hover:border-teal-500/50 transition-colors">
                      <div className={`inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-r ${feature.color} text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <feature.icon className="text-3xl" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Places */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4"
          >
            <div>
              <span className="inline-block px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-sm font-semibold mb-4">
                POPULAR DESTINATIONS
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
                Must-Visit <span className="gradient-text">Places</span>
              </h2>
            </div>
            <Link to="/tourist-places" className="btn-secondary flex items-center gap-2">
              View All
              <FaChevronRight />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {places.map((place, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full">
                    <FaStar className="text-yellow-500" />
                    <span className="font-bold text-gray-900">{place.rating}</span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-teal-400 text-sm font-medium mb-2">{place.location}</p>
                    <h3 className="text-2xl font-bold text-white mb-4">{place.name}</h3>
                    <Link
                      to="/tourist-places"
                      className="inline-flex items-center gap-2 text-white font-semibold group-hover:gap-4 transition-all"
                    >
                      Explore
                      <FaChevronRight />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-sm font-semibold mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
              What Travelers <span className="gradient-text">Say</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-8"
              >
                <FaQuoteLeft className="text-4xl text-teal-500/20 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full object-cover ring-4 ring-teal-500/20"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600" />
            <div className="absolute inset-0 bg-[url('/home.webp')] bg-cover bg-center mix-blend-overlay opacity-30" />

            <div className="relative p-12 md:p-20 text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black text-white mb-6"
              >
                Ready for Your Adventure?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
              >
                Start planning your dream vacation to the Andaman Islands today. Unforgettable experiences await!
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to="/hotels">
                  <button className="px-10 py-4 bg-white text-teal-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl">
                    Book Now
                  </button>
                </Link>
                <Link to="/contact">
                  <button className="px-10 py-4 bg-white/20 text-white rounded-xl font-bold text-lg border-2 border-white/40 hover:bg-white/30 transition-colors">
                    Contact Us
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;