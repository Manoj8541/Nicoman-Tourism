import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Tourist Places Data with Real Images
const touristPlaces = [
  {
    id: 1,
    name: "Radhanagar Beach",
    location: "Havelock Island",
    description: "Ranked as Asia's best beach, famous for turquoise waters and white sand",
    image: "https://thumbs.dreamstime.com/b/radhanagar-beach-one-most-famous-attractions-havelock-island-andaman-nicobar-islands-radhanagar-beach-253126594.jpg",
    category: "Beach",
    rating: 4.8,
    bestTime: "October to May"
  },
  {
    id: 2,
    name: "Cellular Jail",
    location: "Port Blair",
    description: "Historic colonial prison, symbol of India's freedom struggle",
    image: "https://images.unsplash.com/photo-1721231564051-3b44b8058a9e?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Historical",
    rating: 4.7,
    bestTime: "Year Round"
  },
  {
    id: 3,
    name: "Neil Island",
    location: "Neil Island",
    description: "Peaceful island known for coral reefs and natural rock formations",
    image: "https://th.bing.com/th/id/R.07552f9c51f70af31487e175bb9c748b?rik=vVXUQWKcCxEV7Q&riu=http%3a%2f%2fwww.andamantourism.org%2fwp-content%2fuploads%2f2017%2f06%2fneils.jpg&ehk=pESrD8gGthu9ZWjDuijnutU8rLzFQGN6NOBPBShE4TM%3d&risl=&pid=ImgRaw&r=0",
    category: "Island",
    rating: 4.6,
    bestTime: "November to April"
  },
  {
    id: 4,
    name: "Ross Island",
    location: "Near Port Blair",
    description: "Former administrative headquarters with colonial ruins",
    image: "https://www.go2andaman.com/wp-content/uploads/2021/01/ross-island-go2andaman-port-blair1.jpeg",
    category: "Historical",
    rating: 4.5,
    bestTime: "October to May"
  },
  {
    id: 5,
    name: "Baratang Island",
    location: "Middle Andaman",
    description: "Famous for limestone caves and mud volcanoes",
    image: "https://tse3.mm.bing.net/th/id/OIP.l_vLrxJC-nsI45eAyOeiHAHaEK?rs=1&pid=ImgDetMain&o=7&rm=3",
    category: "Nature",
    rating: 4.4,
    bestTime: "November to March"
  },
  {
    id: 6,
    name: "Elephant Beach",
    location: "Havelock Island",
    description: "Perfect spot for snorkeling and water sports",
    image: "https://www.andamantourism.org/wp-content/uploads/2025/02/Elephant-beach-1-800x444.jpg",
    category: "Beach",
    rating: 4.7,
    bestTime: "October to May"
  }
];

// Hotels Data
const hotels = [
  {
    id: 1,
    name: "SeaShell Resort",
    location: "Havelock Island",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    price: 5500,
    rating: 4.5,
    amenities: ["WiFi", "Pool", "Beach Access", "Restaurant"],
    category: "Luxury"
  },
  {
    id: 2,
    name: "Peerless Resort",
    location: "Port Blair",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    price: 4200,
    rating: 4.3,
    amenities: ["WiFi", "Pool", "Gym", "Spa"],
    category: "Premium"
  },
  {
    id: 3,
    name: "Symphony Palms Beach Resort",
    location: "Havelock Island",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    price: 6800,
    rating: 4.7,
    amenities: ["WiFi", "Beach Access", "Restaurant", "Water Sports"],
    category: "Luxury"
  },
  {
    id: 4,
    name: "Coral Reef Resort",
    location: "Neil Island",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    price: 3500,
    rating: 4.2,
    amenities: ["WiFi", "Restaurant", "Garden"],
    category: "Budget"
  },
  {
    id: 5,
    name: "TSG Aura",
    location: "Port Blair",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    price: 3800,
    rating: 4.1,
    amenities: ["WiFi", "Restaurant", "Room Service"],
    category: "Budget"
  },
  {
    id: 6,
    name: "Taj Exotica Resort",
    location: "Havelock Island",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
    price: 15000,
    rating: 4.9,
    amenities: ["WiFi", "Pool", "Spa", "Beach Access", "Fine Dining", "Water Sports"],
    category: "Ultra Luxury"
  }
];

// Ship Routes with Nautical Miles
const shipRoutes = [
  {
    id: 1,
    from: "Chennai Port",
    fromState: "Tamil Nadu",
    to: "Port Blair",
    distance: 647,
    unit: "nautical miles",
    travelTime: "12-14 hours",
    frequency: "3-4 times/month"
  },
  {
    id: 2,
    from: "Kolkata Port",
    fromState: "West Bengal",
    to: "Port Blair",
    distance: 756,
    unit: "nautical miles",
    travelTime: "24-26 hours",
    frequency: "2-3 times/month"
  },
  {
    id: 3,
    from: "Visakhapatnam Port",
    fromState: "Andhra Pradesh",
    to: "Port Blair",
    distance: 684,
    unit: "nautical miles",
    travelTime: "18-22 hours",
    frequency: "2 times/month"
  }
];

// Ship Schedule
const shipSchedule = [
  {
    id: 1,
    shipName: "MV Swaraj Dweep",
    from: "Port Blair",
    to: "Havelock Island",
    departure: "06:00 AM",
    arrival: "08:30 AM",
    status: "On Time",
    days: ["Mon", "Wed", "Fri", "Sun"]
  },
  {
    id: 2,
    shipName: "MV Makruzz",
    from: "Port Blair",
    to: "Havelock Island",
    departure: "08:15 AM",
    arrival: "10:30 AM",
    status: "On Time",
    days: ["Daily"]
  },
  {
    id: 3,
    shipName: "MV Coastal Cruise",
    from: "Havelock Island",
    to: "Neil Island",
    departure: "11:00 AM",
    arrival: "12:00 PM",
    status: "On Time",
    days: ["Tue", "Thu", "Sat"]
  },
  {
    id: 4,
    shipName: "MV Green Ocean",
    from: "Port Blair",
    to: "Neil Island",
    departure: "06:30 AM",
    arrival: "09:00 AM",
    status: "Delayed 30 min",
    days: ["Mon", "Wed", "Fri"]
  },
  {
    id: 5,
    shipName: "MV Nautika",
    from: "Havelock Island",
    to: "Port Blair",
    departure: "04:00 PM",
    arrival: "06:30 PM",
    status: "On Time",
    days: ["Daily"]
  }
];

// API Routes
app.get('/api/tourist-places', (req, res) => {
  res.json(touristPlaces);
});

app.get('/api/hotels', (req, res) => {
  res.json(hotels);
});

app.get('/api/ship-routes', (req, res) => {
  res.json(shipRoutes);
});

app.get('/api/ship-schedule', (req, res) => {
  res.json(shipSchedule);
});

app.post('/api/hotel-booking', (req, res) => {
  const { hotelId, checkIn, checkOut, guests, name, email, phone } = req.body;
  
  // Simulate booking
  const bookingId = 'ANI' + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  res.json({
    success: true,
    bookingId,
    message: 'Booking confirmed successfully!',
    details: {
      hotelId,
      checkIn,
      checkOut,
      guests,
      name,
      email,
      phone
    }
  });
});

app.post('/api/feedback', (req, res) => {
  const { name, email, rating, message } = req.body;
  
  console.log('Feedback received:', { name, email, rating, message });
  
  res.json({
    success: true,
    message: 'Thank you for your feedback!'
  });
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  
  console.log('Contact form received:', { name, email, subject, message });
  
  res.json({
    success: true,
    message: 'We will get back to you soon!'
  });
});

// Chatbot API
app.post('/api/chatbot', (req, res) => {
  const { message } = req.body;
  const query = message.toLowerCase();
  
  let response = '';
  
  if (query.includes('hello') || query.includes('hi')) {
    response = 'Hello! Welcome to Andaman & Nicobar Tourism. How can I help you today?';
  } else if (query.includes('beach')) {
    response = 'Our top beaches include Radhanagar Beach (Asia\'s best!), Elephant Beach, and Corbyn\'s Cove. Would you like more details about any specific beach?';
  } else if (query.includes('hotel') || query.includes('stay')) {
    response = 'We have hotels ranging from budget (₹3,500/night) to ultra-luxury (₹15,000/night). Popular options include SeaShell Resort, Taj Exotica, and Symphony Palms. Visit our Hotels page for bookings!';
  } else if (query.includes('ship') || query.includes('ferry')) {
    response = 'Ships operate daily between Port Blair, Havelock, and Neil Island. Journey time: Port Blair to Havelock is 2.5 hours. Check our Ship Schedule page for timings.';
  } else if (query.includes('price') || query.includes('cost')) {
    response = 'Average costs: Hotels ₹3,500-15,000/night, Ferry ₹500-2,500, Activities ₹1,000-5,000. A 5-day trip costs around ₹30,000-50,000 per person.';
  } else if (query.includes('best time') || query.includes('when')) {
    response = 'Best time to visit: October to May. Weather is pleasant with clear skies, perfect for beaches and water sports. Avoid monsoons (June-September).';
  } else if (query.includes('cellular jail')) {
    response = 'Cellular Jail (Kala Pani) is a historic colonial prison in Port Blair. Light & Sound show at 6 PM. Entry: ₹30 for Indians. A must-visit for history enthusiasts!';
  } else if (query.includes('scuba') || query.includes('diving')) {
    response = 'Andaman is perfect for scuba diving! Best spots: Havelock, Neil Island. Cost: ₹3,500-5,000 per dive. No prior experience needed - trainers available!';
  } else if (query.includes('how to reach') || query.includes('flight')) {
    response = 'By Air: Direct flights from Chennai, Kolkata, Delhi to Port Blair (2-3 hours). By Sea: Ships from Chennai, Kolkata, Vizag (50-70 hours).';
  } else {
    response = 'I can help you with information about beaches, hotels, ships, prices, best time to visit, and activities. What would you like to know?';
  }
  
  res.json({ response });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});