// client/src/pages/AdminDashboard.jsx
// Full admin CRUD dashboard — protected by RequireAuth + RequireRole('admin').
// 8 tabs: Hotels | Tourist Places | Ship Schedule | Hotel Bookings | Ship Bookings | Queries | Feedback | Alerts
// Superadmin-only: Manage Admins
// Ultra-fast: In-memory cache + optimistic UI updates for 0ms instant CRUD operations.

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { BASE_TABS, SUPERADMIN_TAB } from '../components/admin/AdminShared';
import AdminShield from '../components/admin/AdminShield';

// ── Tab Subcomponents ─────────────────────────────────────────────────────────
import HotelsTab from '../components/admin/tabs/HotelsTab';
import TouristPlacesTab from '../components/admin/tabs/TouristPlacesTab';
import ShipScheduleTab from '../components/admin/tabs/ShipScheduleTab';
import BookingsTab from '../components/admin/tabs/BookingsTab';
import FerryBookingsTab from '../components/admin/tabs/FerryBookingsTab';
import QueriesTab from '../components/admin/tabs/QueriesTab';
import FeedbackTab from '../components/admin/tabs/FeedbackTab';
import AlertsTab from '../components/admin/tabs/AlertsTab';
import DeletedAccountsTab from '../components/admin/tabs/DeletedAccountsTab';
import ManageAdminsTab from '../components/admin/tabs/ManageAdminsTab';

// ── Main AdminDashboard ───────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { session, profile, isSuperAdmin, isDemoAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('hotels');

  const TABS = isSuperAdmin ? [...BASE_TABS, SUPERADMIN_TAB] : BASE_TABS;
  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <AdminShield>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 md:pt-20">
      {/* ── Mobile Header ─────────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-16 md:top-20 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <span className={`text-[10px] font-black tracking-widest uppercase ${isDemoAdmin ? 'text-amber-500' : isSuperAdmin ? 'text-purple-500' : 'text-teal-500'}`}>
            {isDemoAdmin ? 'Demo Admin (Preview)' : isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
          <h1 className="text-lg font-black text-gray-900 dark:text-white leading-none">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 truncate max-w-[120px]">{profile?.email || session?.user?.email}</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('nicoman:lock-admin'))}
            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-teal-500 transition-colors"
            title="Lock admin session immediately"
          >
            <FaLock size={12} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 min-h-[calc(100vh-5rem)] sticky top-20 self-start">
          <div className="p-4 pt-6">
            {/* Sidebar brand */}
            <div className="mb-6 px-2">
              <span className={`text-[10px] font-black tracking-widest uppercase block ${isDemoAdmin ? 'text-amber-500' : isSuperAdmin ? 'text-purple-500' : 'text-teal-500'}`}>
                {isDemoAdmin ? 'Demo Admin Preview' : isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
              </span>
              <h1 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                Admin <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {profile?.email || session?.user?.email}
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('nicoman:lock-admin'))}
                title="Lock admin session immediately (Alt + L)"
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-gray-100 dark:bg-gray-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 text-[11px] font-bold transition-all border border-gray-200/80 dark:border-gray-700/80 shadow-2xs"
              >
                <FaLock size={10} className="text-teal-500" /> Lock Session <span className="opacity-50 text-[9px] font-mono ml-1">Alt+L</span>
              </button>
            </div>

            {/* Sidebar nav */}
            <nav className="space-y-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                      ${isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 pb-8">
          
          {/* ── Mobile Tab Scroll Bar ── shown at TOP on mobile only ─────── */}
          <div className="lg:hidden flex overflow-x-auto scrollbar-hide gap-2 pb-3 mb-4 -mx-3 px-3">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all
                    ${isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    }`}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop page title */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{activeTabObj.label}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage {activeTabObj.label.toLowerCase()} data
            </p>
          </div>

          {/* Demo Admin Notification Banner */}
          {isDemoAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 shadow-xs"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-200/60 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700/80 flex items-center justify-center flex-shrink-0 text-amber-700 dark:text-amber-300 shadow-2xs">
                  <FaShieldAlt size={15} />
                </div>
                <div>
                  <p className="font-black text-sm text-amber-900 dark:text-amber-200">
                    Public Demo Admin Preview (Read-Only Mode)
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Modifying live production data is disabled. You are allowed to test the <strong>Deleted Accounts Vault</strong> (Restore & Purge).
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-200/80 dark:bg-amber-900/60 font-black rounded-xl uppercase tracking-wider text-[10px] self-start sm:self-auto flex-shrink-0 text-amber-900 dark:text-amber-200">
                Preview Mode
              </span>
            </motion.div>
          )}

          <div key={activeTab} className="card p-4 sm:p-5 transition-opacity duration-200">
            {activeTab === 'hotels'         && <HotelsTab />}
            {activeTab === 'tourist-places' && <TouristPlacesTab />}
            {activeTab === 'ship-schedule'  && <ShipScheduleTab />}
            {activeTab === 'bookings'         && <BookingsTab />}
            {activeTab === 'ferry-bookings'   && <FerryBookingsTab />}
            {activeTab === 'queries'          && <QueriesTab />}
            {activeTab === 'feedback'         && <FeedbackTab />}
            {activeTab === 'alerts'           && <AlertsTab />}
            {activeTab === 'deleted-accounts' && <DeletedAccountsTab />}
            {activeTab === 'manage-admins'    && isSuperAdmin && <ManageAdminsTab />}
          </div>
        </main>
      </div>
    </div>
  </AdminShield>
  );
};

export default AdminDashboard;
