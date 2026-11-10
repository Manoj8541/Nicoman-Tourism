// client/src/tests/AdminShared.test.js
import { describe, it, expect } from 'vitest';
import { matchesBookingDateRange, STATUS_BADGE, BASE_TABS } from '../components/admin/AdminShared';

describe('AdminShared: Business Logic & Data Helpers', () => {
  it('correctly filters booking dates for today', () => {
    const today = new Date().toISOString();
    expect(matchesBookingDateRange(today, 'today')).toBe(true);
    expect(matchesBookingDateRange(today, 'all')).toBe(true);
  });

  it('correctly categorizes upcoming vs past booking dates', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    expect(matchesBookingDateRange(tomorrow, 'upcoming')).toBe(true);
    expect(matchesBookingDateRange(yesterday, 'upcoming')).toBe(false);

    expect(matchesBookingDateRange(yesterday, 'past')).toBe(true);
    expect(matchesBookingDateRange(tomorrow, 'past')).toBe(false);
  });

  it('provides valid CSS badge mappings for all standard booking statuses', () => {
    expect(STATUS_BADGE['confirmed']).toBeDefined();
    expect(STATUS_BADGE['confirmed']).toContain('bg-green-100');

    expect(STATUS_BADGE['cancelled']).toBeDefined();
    expect(STATUS_BADGE['cancelled']).toContain('bg-red-100');

    expect(STATUS_BADGE['completed']).toBeDefined();
    expect(STATUS_BADGE['completed']).toContain('bg-blue-100');
    expect(STATUS_BADGE['delayed']).toBeDefined();
  });

  it('exports all 9 core Admin Dashboard tabs with icons and gradient colors', () => {
    expect(BASE_TABS.length).toBe(9);
    const tabIds = BASE_TABS.map(t => t.id);
    expect(tabIds).toContain('hotels');
    expect(tabIds).toContain('tourist-places');
    expect(tabIds).toContain('ship-schedule');
    expect(tabIds).toContain('bookings');
    expect(tabIds).toContain('ferry-bookings');
    expect(tabIds).toContain('queries');
    expect(tabIds).toContain('feedback');
    expect(tabIds).toContain('alerts');
    expect(tabIds).toContain('deleted-accounts');
  });
});
