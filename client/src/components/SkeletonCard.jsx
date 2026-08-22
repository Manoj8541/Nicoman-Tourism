// client/src/components/SkeletonCard.jsx
// Reusable shimmer skeleton — used on Hotels, TouristPlaces, ShipSchedule, BookingHistory
// while data is loading from the API.

import React from 'react';

// Core shimmer animation via CSS class (defined in index.css)
// Uses Tailwind's animate-pulse as a backup if the custom class isn't present.

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Image area */}
      <div className="w-full h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
      <div className="p-5 space-y-3">
        {/* Title */}
        <div className="h-5 w-3/4 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
        {/* Subtitle */}
        <div className="h-4 w-1/2 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
        {/* Badge row */}
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
          <div className="h-6 w-16 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
        </div>
        {/* Description lines */}
        <div className="h-3 w-full rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
        <div className="h-3 w-4/5 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
        {/* Button */}
        <div className="h-10 w-full rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer mt-2" />
      </div>
    </div>
  );
}

// Row skeleton — for BookingHistory, ShipSchedule list items
export function SkeletonRow({ className = '' }) {
  return (
    <div className={`card p-5 flex items-center gap-4 ${className}`}>
      <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
        <div className="h-3 w-1/2 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
        <div className="h-3 w-1/3 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer" />
      </div>
      <div className="w-20 h-8 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 skeleton-shimmer flex-shrink-0" />
    </div>
  );
}

// Grid of N skeleton cards
export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// List of N skeleton rows
export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export default SkeletonCard;