import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import axios from 'axios';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Hello! 👋 Welcome to Andaman Tourism. I\'m your virtual assistant. How can I help you plan your perfect island getaway?', isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const quickReplies = [
    'Best beaches 🏖️',
    'Hotel prices 🏨',
    'How to reach? ✈️',
    'Best time to visit 📅'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText = input) => {
    if (!messageText.trim()) return;

    const userMessage = { text: messageText, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await axios.post('http://localhost:5000/api/chatbot', {
        message: messageText
      });

      setTimeout(() => {
        setMessages(prev => [...prev, { text: response.data.response, isBot: true }]);
        setIsTyping(false);
      }, 800);
    } catch (error) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: 'Sorry, I\'m having trouble connecting. Please try again later!', 
          isBot: true 
        }]);
        setIsTyping(false);
      }, 500);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 ${
          isOpen 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:shadow-teal-500/50 pulse-glow'
        }`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <FaTimes size={24} className="text-white" /> : <FaComments size={24} className="text-white" />}
        </motion.div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <FaRobot className="text-2xl text-white" />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Island Assistant</h3>
                    <p className="text-sm text-white/80">Always online to help!</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, x: message.isBot ? -20 : 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[80%] ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.isBot 
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        {message.isBot ? <FaRobot className="text-white text-sm" /> : <FaUser className="text-gray-600 dark:text-gray-300 text-sm" />}
                      </div>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          message.isBot
                            ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md rounded-bl-none'
                            : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-none'
                        }`}
                      >
                        {message.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-end gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                      <FaRobot className="text-white text-sm" />
                    </div>
                    <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-md">
                      <div className="flex space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input - FIXED TEXT COLOR FOR DARK MODE */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl border-2 border-transparent focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;