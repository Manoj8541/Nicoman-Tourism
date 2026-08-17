import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const WarningBanner = () => {
  const warningText = "⚠️ DISCLAIMER: This is a DEMO website created for educational purposes only. This is NOT an official government/Company website and images are generated. Do not enter real personal or payment information.";

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600">
      <div className="flex items-center h-8 md:h-10">
        {/* Fixed Warning Icon */}
        <div className="flex-shrink-0 flex items-center justify-center w-10 md:w-12 h-full bg-red-700">
          <FaExclamationTriangle className="text-yellow-300 text-sm md:text-base animate-pulse" />
        </div>

        {/* Scrolling Text */}
        <div className="flex-1 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee hover:pause">
            <span className="inline-block text-white font-medium text-xs md:text-sm px-4">
              {warningText}
            </span>
            <span className="inline-block text-white font-medium text-xs md:text-sm px-4">
              {warningText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarningBanner;