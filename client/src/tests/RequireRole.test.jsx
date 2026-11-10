// client/src/tests/RequireRole.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RequireRole from '../components/RequireRole';
import * as AuthContext from '../context/AuthContext';

// Mock useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Security Route Guard: RequireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner while auth state is resolving', () => {
    AuthContext.useAuth.mockReturnValue({
      user: null,
      profile: null,
      loading: true,
    });

    render(
      <MemoryRouter>
        <RequireRole role="admin">
          <div>Admin Content</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('blocks regular users and renders the 401 Access Restricted screen', () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 'usr-123', email: 'tourist@gmail.com' },
      profile: { role: 'user' },
      loading: false,
    });

    render(
      <MemoryRouter>
        <RequireRole role={['admin', 'superadmin']}>
          <div>Top Secret Admin Area</div>
        </RequireRole>
      </MemoryRouter>
    );

    // Confirms 401 screen is displayed
    expect(screen.getByText('401')).toBeInTheDocument();
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Top Secret Admin Area')).not.toBeInTheDocument();
  });

  it('grants access and renders child components for authorized admin role', () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 'adm-001', email: 'admin@nicoman.com' },
      profile: { role: 'admin' },
      loading: false,
    });

    render(
      <MemoryRouter>
        <RequireRole role={['admin', 'superadmin', 'demo_admin']}>
          <div>Welcome to Admin Panel</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome to Admin Panel')).toBeInTheDocument();
    expect(screen.queryByText('Access Restricted')).not.toBeInTheDocument();
  });

  it('grants access for superadmin role', () => {
    AuthContext.useAuth.mockReturnValue({
      user: { id: 'sup-001', email: 'superadmin@nicoman.com' },
      profile: { role: 'superadmin' },
      loading: false,
    });

    render(
      <MemoryRouter>
        <RequireRole role={['admin', 'superadmin']}>
          <div>Superadmin Privileges Granted</div>
        </RequireRole>
      </MemoryRouter>
    );

    expect(screen.getByText('Superadmin Privileges Granted')).toBeInTheDocument();
  });
});
