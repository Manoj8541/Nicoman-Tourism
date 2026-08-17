import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import WarningBanner from './components/WarningBanner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import Home from './pages/Home';
import TouristPlaces from './pages/TouristPlaces';
import Hotels from './pages/Hotels';
import ShipSchedule from './pages/ShipSchedule';
import RouteMap from './pages/RouteMap';
import Feedback from './pages/Feedback';
import Contact from './pages/Contact';
import { ThemeProvider } from './context/ThemeContext';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
          {/* Demo Warning Banner */}
          <WarningBanner />
          
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tourist-places" element={<TouristPlaces />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/ship-schedule" element={<ShipSchedule />} />
            <Route path="/route-map" element={<RouteMap />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
          <ChatBot />
          <Toaster position="top-right" />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;