// client/src/tests/AdminShield.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminShield from '../components/admin/AdminShield';
import * as AuthContext from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Security: AdminShield Terminal Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders children freely when admin session is active and not locked', () => {
    AuthContext.useAuth.mockReturnValue({
      user: { email: 'admin@nicoman.com' },
      isDemoAdmin: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AdminShield>
          <div>Live Admin Dashboard Content</div>
        </AdminShield>
      </MemoryRouter>
    );

    expect(screen.getByText('Live Admin Dashboard Content')).toBeInTheDocument();
    expect(screen.queryByText('Admin Session Protected')).not.toBeInTheDocument();
  });

  it('mounts in locked state immediately when localStorage lock flag is set (F5 reload protection)', () => {
    // Simulate lock flag persisted across F5 / page reload
    localStorage.setItem('nicoman_admin_locked', 'true');

    AuthContext.useAuth.mockReturnValue({
      user: { email: 'admin@nicoman.com' },
      isDemoAdmin: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AdminShield>
          <div>Live Admin Dashboard Content</div>
        </AdminShield>
      </MemoryRouter>
    );

    // Screen should show the lock overlay
    expect(screen.getByText('Admin Session Protected')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password to unlock')).toBeInTheDocument();
  });

  it('shows error if wrong password is submitted during unlock', async () => {
    localStorage.setItem('nicoman_admin_locked', 'true');

    AuthContext.useAuth.mockReturnValue({
      user: { email: 'admin@nicoman.com' },
      isDemoAdmin: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
    });

    // Mock invalid password reject
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid credentials' },
    });

    render(
      <MemoryRouter>
        <AdminShield>
          <div>Live Admin Dashboard Content</div>
        </AdminShield>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Enter your password to unlock');
    fireEvent.change(input, { target: { value: 'wrongpassword' } });

    const submitBtn = screen.getByRole('button', { name: /unlock dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Incorrect password. Please try again.')).toBeInTheDocument();
    });

    // Verify it stays locked in storage
    expect(localStorage.getItem('nicoman_admin_locked')).toBe('true');
  });

  it('unlocks session and clears localStorage lock flag when valid password is provided', async () => {
    localStorage.setItem('nicoman_admin_locked', 'true');

    AuthContext.useAuth.mockReturnValue({
      user: { email: 'admin@nicoman.com' },
      isDemoAdmin: false,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
    });

    // Mock successful Supabase authentication
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user: { email: 'admin@nicoman.com' } },
      error: null,
    });

    render(
      <MemoryRouter>
        <AdminShield>
          <div>Live Admin Dashboard Content</div>
        </AdminShield>
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Enter your password to unlock');
    fireEvent.change(input, { target: { value: 'SecretPassword123' } });

    const submitBtn = screen.getByRole('button', { name: /unlock dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Lock flag is cleared
      expect(localStorage.getItem('nicoman_admin_locked')).toBeNull();
      // Lock overlay is removed
      expect(screen.queryByText('Admin Session Protected')).not.toBeInTheDocument();
    });
  });

  it('allows demo admin to resume preview session with one click', async () => {
    localStorage.setItem('nicoman_admin_locked', 'true');

    AuthContext.useAuth.mockReturnValue({
      user: { email: 'demo@nicoman.com' },
      isDemoAdmin: true,
      signOut: vi.fn(),
      signInWithGoogle: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AdminShield>
          <div>Demo Admin Dashboard</div>
        </AdminShield>
      </MemoryRouter>
    );

    expect(screen.getByText('You are in Demo Admin preview mode.')).toBeInTheDocument();
    const resumeBtn = screen.getByRole('button', { name: /resume demo session/i });
    fireEvent.click(resumeBtn);

    await waitFor(() => {
      expect(localStorage.getItem('nicoman_admin_locked')).toBeNull();
      expect(screen.queryByText('Admin Session Protected')).not.toBeInTheDocument();
    });
  });
});
