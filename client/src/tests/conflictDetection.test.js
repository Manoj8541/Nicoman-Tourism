// client/src/tests/conflictDetection.test.js
import { describe, it, expect } from 'vitest';

// Pure algorithmic recreation of the backend conflict detector in server/routes/admin.js
function extractUnitsFromRef(ref) {
  if (!ref) return [];
  const match = ref.match(/(?:HTL|FRY)-([A-Za-z0-9\-_,]+)-ANI/i);
  if (match && match[1]) {
    return match[1].split(/[-_,]+/).filter(Boolean).map(s => s.toUpperCase());
  }
  return [];
}

function detectBookingCollision(candidateRef, activeBookings, allUnits) {
  const unitsToCheck = extractUnitsFromRef(candidateRef);
  const occupiedUnits = new Set();
  const conflictingBookings = [];

  for (const b of activeBookings) {
    const bUnits = extractUnitsFromRef(b.booking_ref);
    for (const u of bUnits) {
      occupiedUnits.add(u);
      if (unitsToCheck.includes(u)) {
        conflictingBookings.push(b);
      }
    }
  }

  const hasConflict = conflictingBookings.length > 0;
  const availableUnits = allUnits.filter(u => !occupiedUnits.has(u.toUpperCase()));

  return {
    hasConflict,
    conflictingUnits: unitsToCheck,
    conflictingBookings,
    availableUnits,
  };
}

describe('Booking Collision Detection Engine (User A vs User B Conflict)', () => {
  const ALL_FERRY_SEATS = ['S11', 'S12', 'S13', 'S14', 'S15'];

  it('correctly extracts single and multiple seat/room units from booking references', () => {
    expect(extractUnitsFromRef('FRY-S12-ANI98ABC')).toEqual(['S12']);
    expect(extractUnitsFromRef('HTL-101-102-ANI999')).toEqual(['101', '102']);
    expect(extractUnitsFromRef('INVALID-REF')).toEqual([]);
    expect(extractUnitsFromRef('')).toEqual([]);
  });

  it('detects seat collision when User A tries to reinstate Seat S12 already booked by User B', () => {
    // User B holds confirmed booking for Seat S12
    const activeBookings = [
      { id: 'bkg-user-b', passenger_name: 'User B', booking_ref: 'FRY-S12-ANI98ABC', status: 'confirmed' },
    ];

    // User A attempts to re-confirm their previously cancelled booking for Seat S12
    const candidateRef = 'FRY-S12-ANI11OLD';

    const result = detectBookingCollision(candidateRef, activeBookings, ALL_FERRY_SEATS);

    expect(result.hasConflict).toBe(true);
    expect(result.conflictingUnits).toEqual(['S12']);
    expect(result.conflictingBookings.length).toBe(1);
    expect(result.conflictingBookings[0].passenger_name).toBe('User B');
    // Verifies available seats offered excludes S12
    expect(result.availableUnits).not.toContain('S12');
    expect(result.availableUnits).toContain('S13');
  });

  it('passes cleanly with zero conflict when the requested seat is completely free', () => {
    const activeBookings = [
      { id: 'bkg-other', passenger_name: 'Other Passenger', booking_ref: 'FRY-S11-ANI001', status: 'confirmed' },
    ];

    const candidateRef = 'FRY-S14-ANI777';

    const result = detectBookingCollision(candidateRef, activeBookings, ALL_FERRY_SEATS);

    expect(result.hasConflict).toBe(false);
    expect(result.conflictingBookings.length).toBe(0);
    expect(result.availableUnits).toContain('S14');
  });
});
