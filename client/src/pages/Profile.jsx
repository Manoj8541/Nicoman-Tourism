import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser, FaEnvelope, FaCalendarAlt, FaPhone, FaEdit, FaSave, FaTimes,
  FaCamera, FaTrash, FaShieldAlt, FaExclamationTriangle, FaLock, FaUserSlash,
  FaInfoCircle, FaArrowRight, FaArrowLeft, FaCheck, FaClock,
} from 'react-icons/fa';
import { Turnstile } from '@marsidev/react-turnstile';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { compressAvatar, formatBytes, validateImageFileType, deleteStorageFile } from '../lib/imageCompressor';
import { COUNTRY_CODES, DEFAULT_COUNTRY, parsePhoneNumber } from '../lib/countryCodes';

// ── Universal Flag Component (renders real flags across all OS including Windows) ──
const CountryFlag = ({ iso, name, className = "w-5 h-3.5" }) => {
  if (!iso) return null;
  return (
    <img
      src={`https://flagcdn.com/w40/${iso.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${iso.toLowerCase()}.png 2x`}
      alt={name || iso}
      loading="lazy"
      className={`${className} object-cover rounded-xs inline-block border border-gray-200/70 dark:border-gray-700/80 shadow-2xs`}
    />
  );
};

// ── Allowed image config ───────────────────────────────────────────────────────
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const DELETION_REASONS = [
  "I'm no longer traveling to Andaman",
  "Privacy and data protection concerns",
  "Created a duplicate or second account",
  "Temporary break from traveling",
  "Other (please specify below)",
];

const Profile = () => {
  const { user, profile, refreshProfile, signOut, isSuperAdmin, isDemoAdmin: authIsDemoAdmin } = useAuth();
  const isDemoAdmin = authIsDemoAdmin || profile?.role === 'demo_admin';
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const countryDropdownRef = useRef(null);

  // ── Edit form ──────────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
  });

  // ── International Country Code & Phone State ──────────────────────────────
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // ── Account Deletion Multi-Step State ──────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: Warnings & Reason, 2: Security Verification, 3: Final Notice
  const [deleteReason, setDeleteReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [securityProblem, setSecurityProblem] = useState({ num1: 4, num2: 5, answer: 9 });
  const [securityInput, setSecurityInput] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!showDeleteModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !deletingAccount) setShowDeleteModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev === 'hidden' ? 'unset' : (prev || 'unset');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDeleteModal, deletingAccount]);

  const openDeleteModal = () => {
    if (isSuperAdmin) {
      toast.error('Superadmin accounts cannot be self-deleted.');
      return;
    }
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 2;
    setSecurityProblem({ num1: n1, num2: n2, answer: n1 + n2 });
    setSecurityInput('');
    setConfirmText('');
    setDeleteReason('');
    setCustomReason('');
    setTurnstileToken('');
    setDeleteStep(1);
    setShowDeleteModal(true);
  };

  const isPhraseMatched =
    confirmText.trim() === 'DELETE MY ACCOUNT' ||
    (user?.email && confirmText.trim().toLowerCase() === user.email.toLowerCase());

  const isSecuritySolved = parseInt(securityInput, 10) === securityProblem.answer;

  const handleExecuteDelete = async () => {
    if (isSuperAdmin) {
      toast.error('Superadmin accounts cannot be self-deleted.');
      return;
    }
    setDeletingAccount(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) throw new Error('No active authentication session found');

      const finalReason = deleteReason.includes('Other') && customReason
        ? `Other: ${customReason}`
        : deleteReason || 'User self-deletion via profile';

      await axios.delete('/api/user/account', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          reason: finalReason,
          turnstileToken: turnstileToken,
        }
      });

      toast.success('Your account has been deleted and archived for 30 days.');
      setShowDeleteModal(false);
      if (signOut) await signOut();
      else await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error('[Profile] Account deletion failed:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  // ── Avatar ─────────────────────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [avatarPath, setAvatarPath] = useState(profile?.avatar_path || null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarBlob, setAvatarBlob] = useState(null);
  const [avatarSizeText, setAvatarSizeText] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [showRemoveAvatarModal, setShowRemoveAvatarModal] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
      });
      const parsed = parsePhoneNumber(profile.phone);
      setSelectedCountry(parsed.country);
      setPhoneDigits(parsed.digits);
      setAvatarUrl(profile.avatar_url || null);
      setAvatarPath(profile.avatar_path || null);
    }
  }, [profile]);

  // Click outside to close country dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) {
        setShowCountryDropdown(false);
      }
    };
    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown]);

  // ── Avatar file picker (in-memory compression only, ZERO upload until Save Photo) ─
  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFileType(file);
    if (!validation.valid) {
      toast.error(validation.error);
      e.target.value = '';
      return;
    }

    try {
      const { blob, sizeBytes } = await compressAvatar(file);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      const previewUrl = URL.createObjectURL(blob);
      setAvatarFile(file);
      setAvatarBlob(blob);
      setAvatarPreview(previewUrl);
      setAvatarSizeText(formatBytes(sizeBytes));
    } catch (err) {
      toast.error(err.message || 'Failed to process avatar');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleAvatarUpload = async () => {
    if ((!avatarBlob && !avatarFile) || !user) return;
    setUploadingAvatar(true);
    try {
      // Use pre-compressed in-memory blob (or compress if needed)
      let blobToUpload = avatarBlob;
      if (!blobToUpload && avatarFile) {
        const res = await compressAvatar(avatarFile);
        blobToUpload = res.blob;
      }

      // Step 1: Check existing avatar path from profile (or extract from avatar_url)
      const oldAvatarPath = profile?.avatar_path || avatarPath || (
        (profile?.avatar_url || avatarUrl)?.includes('/avatars/')
          ? (profile?.avatar_url || avatarUrl).split('/avatars/')[1]?.split('?')[0]
          : null
      );

      // Step 2: Upload new compressed WebP file
      const newPath = `${user.id}/${Date.now()}.webp`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(newPath, blobToUpload, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(newPath);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('Failed to retrieve public avatar URL');

      // Step 3: Client cleanup helper (non-blocking fallback)
      const oldPhoto = profile?.avatar_path || profile?.avatar_url || avatarUrl;
      if (oldPhoto) {
        deleteStorageFile(oldPhoto, 'avatars');
      }

      // Step 4: Update profile via Backend API (Server Service-Role cleans up old avatar storage!)
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (token) {
        await axios.put('/api/user/profile', {
          avatar_url: publicUrl,
          avatar_path: newPath,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl, avatar_path: newPath, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      // Step 5: Optimistic state update
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarUrl(publicUrl);
      setAvatarPath(newPath);
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarBlob(null);
      setAvatarSizeText('');
      if (fileRef.current) fileRef.current.value = '';
      if (refreshProfile) await refreshProfile();
      toast.success('Profile photo saved!');
    } catch (err) {
      console.error('[Profile] Avatar upload failed:', err);
      toast.error('Upload failed: ' + (err.response?.data?.error || err.message || 'Error processing image'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const confirmAvatarDelete = async () => {
    setDeletingAvatar(true);
    try {
      // Step 1: Client cleanup helper (non-blocking fallback)
      const activePhoto = profile?.avatar_path || profile?.avatar_url || avatarUrl || avatarPath;
      if (activePhoto) {
        deleteStorageFile(activePhoto, 'avatars');
      }

      // Step 2: Backend API removal (Server Service-Role deletes avatar from storage with full privileges!)
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (token) {
        await axios.delete('/api/user/avatar', {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await supabase
          .from('profiles')
          .update({ avatar_url: null, avatar_path: null, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarUrl(null);
      setAvatarPath(null);
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarBlob(null);
      setAvatarSizeText('');
      setShowRemoveAvatarModal(false);
      if (fileRef.current) fileRef.current.value = '';
      if (refreshProfile) await refreshProfile();
      toast.success('Profile photo removed!');
    } catch (err) {
      console.error('[Profile] Avatar deletion failed:', err);
      toast.error('Failed to remove photo: ' + (err.response?.data?.error || err.message));
    } finally {
      setDeletingAvatar(false);
    }
  };

  const cancelAvatarPick = () => {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setAvatarBlob(null);
    setAvatarPreview(null);
    setAvatarSizeText('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePhoneDigitsChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, selectedCountry.maxDigits);
    setPhoneDigits(val);
  };

  const handleSelectCountry = (c) => {
    setSelectedCountry(c);
    setPhoneDigits(prev => prev.slice(0, c.maxDigits));
    setShowCountryDropdown(false);
    setCountrySearch('');
  };

  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch) ||
    c.iso.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSave = async () => {
    // Validate phone number if digits are entered
    let finalPhone = null;
    if (phoneDigits.trim()) {
      if (phoneDigits.trim().length < Math.min(6, selectedCountry.maxDigits)) {
        return toast.error(`Please enter a valid phone number for ${selectedCountry.name} (${selectedCountry.maxDigits} digits required)`);
      }
      finalPhone = `${selectedCountry.code}${phoneDigits.trim()}`;
    }

    setSaving(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (token) {
        await axios.put('/api/user/profile', {
          full_name: form.full_name,
          phone: finalPhone,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await supabase
          .from('profiles')
          .update({ full_name: form.full_name, phone: finalPhone, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
      toast.success('Profile updated!');
      setEditing(false);
      setShowCountryDropdown(false);
      if (refreshProfile) await refreshProfile();
    } catch (error) {
      toast.error('Failed to update profile: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ full_name: profile?.full_name || '' });
    const parsed = parsePhoneNumber(profile?.phone);
    setSelectedCountry(parsed.country);
    setPhoneDigits(parsed.digits);
    setEditing(false);
    setShowCountryDropdown(false);
  };

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = (profile?.full_name || user?.email || '?')[0].toUpperCase();

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-16 px-4 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-2xl mx-auto space-y-6">

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-2">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
            Your <span className="gradient-text">Profile</span>
          </h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="card p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Profile" className="w-20 h-20 rounded-2xl object-cover shadow-lg bg-gray-100 dark:bg-gray-800" />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-teal-500/30">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 flex items-center gap-1">
                <button
                  onClick={() => {
                    if (isDemoAdmin) return toast.error('Photo changes are disabled for Demo Admin.');
                    fileRef.current?.click();
                  }}
                  className="w-7 h-7 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  title={isDemoAdmin ? 'Locked in demo mode' : 'Upload / Change photo'}
                >
                  <FaCamera size={11} />
                </button>
              </div>
              <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleAvatarPick} />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{profile?.full_name || 'Traveller'}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  profile?.role === 'demo_admin'
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'bg-teal-100 dark:bg-teal-900/30 text-teal-600'
                }`}>
                  {profile?.role === 'superadmin' ? 'Super Admin' : profile?.role === 'demo_admin' ? 'Demo Admin (Preview)' : profile?.role === 'admin' ? 'Admin' : 'Member'}
                </span>
                {avatarUrl && !avatarPreview && !isDemoAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowRemoveAvatarModal(true)}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <FaTrash size={10} /> Remove photo
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
            </div>

            {!editing && (
              isDemoAdmin ? (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex-shrink-0">
                  🔒 Locked in Demo Mode
                </span>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 font-semibold text-xs hover:bg-teal-100 transition-colors flex-shrink-0">
                  <FaEdit size={12} /> Edit
                </button>
              )
            )}
          </div>

          <AnimatePresence>
            {avatarFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800"
              >
                <div className="flex-1 text-xs text-teal-700 dark:text-teal-300">
                  <p className="font-bold">{avatarFile.name}</p>
                  <p className="text-teal-500">{avatarSizeText ? `${avatarSizeText} · WebP` : 'Auto-compressed to WebP (≤ 200KB)'} · click Save Photo</p>
                </div>
                <button onClick={handleAvatarUpload} disabled={uploadingAvatar} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-bold hover:bg-teal-600 transition-colors disabled:opacity-50">
                  {uploadingAvatar ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FaSave size={11} />}
                  {uploadingAvatar ? 'Optimizing & Saving...' : 'Save Photo'}
                </button>
                <button onClick={cancelAvatarPick} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                  <FaTimes size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <FaUser className="text-teal-500 flex-shrink-0" size={14} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Full Name</p>
                {editing ? (
                  <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full bg-transparent border-b-2 border-teal-500 outline-none font-semibold text-gray-900 dark:text-white py-0.5 text-sm" />
                ) : (
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{profile?.full_name || '—'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <FaEnvelope className="text-teal-500 flex-shrink-0" size={14} />
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaPhone className="text-teal-500 flex-shrink-0" size={13} />
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">
                    Phone Number
                  </p>
                </div>
              </div>

              {editing ? (
                <div className="flex items-center gap-2 relative" ref={countryDropdownRef}>
                  {/* Country Code Picker Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-xl hover:border-teal-500 transition-all shadow-xs flex-shrink-0 cursor-pointer"
                    title="Select country code"
                  >
                    <CountryFlag iso={selectedCountry.iso} name={selectedCountry.name} className="w-5 h-3.5" />
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200 font-mono">{selectedCountry.code}</span>
                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Searchable Country Dropdown Modal */}
                  <AnimatePresence>
                    {showCountryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-h-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
                      >
                        {/* Search Input Box */}
                        <div className="p-2.5 border-b border-gray-100 dark:border-gray-700/80 bg-gray-50/80 dark:bg-gray-900/50">
                          <div className="relative">
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              placeholder="Search country name or code..."
                              autoFocus
                              className="w-full text-xs py-2 pl-3 pr-8 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-teal-500"
                            />
                            {countrySearch && (
                              <button
                                type="button"
                                onClick={() => setCountrySearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <FaTimes size={10} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List of Countries */}
                        <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5 divide-y divide-gray-50 dark:divide-gray-800/60">
                          {filteredCountries.map(c => {
                            const isSelected = c.code === selectedCountry.code && c.iso === selectedCountry.iso;
                            return (
                              <button
                                key={`${c.iso}-${c.code}`}
                                type="button"
                                onClick={() => handleSelectCountry(c)}
                                className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${isSelected
                                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-bold'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-200'
                                  }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <CountryFlag iso={c.iso} name={c.name} className="w-5 h-3.5 flex-shrink-0" />
                                  <span className="truncate">{c.name}</span>
                                </div>
                                <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold font-mono ml-2 flex-shrink-0">{c.code}</span>
                              </button>
                            );
                          })}
                          {filteredCountries.length === 0 && (
                            <div className="text-center py-6 text-gray-400 text-xs">
                              No matching countries found
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Phone Digits Input */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="tel"
                      inputMode="numeric"
                      disabled={!selectedCountry}
                      value={phoneDigits}
                      onChange={handlePhoneDigitsChange}
                      placeholder={`e.g. ${selectedCountry.placeholder || '98765 43210'}`}
                      maxLength={selectedCountry.maxDigits}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:outline-none font-semibold text-gray-900 dark:text-white text-sm tracking-wide disabled:opacity-50 transition-colors shadow-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {profile?.phone ? (
                    <div className="flex items-center gap-2">
                      <CountryFlag iso={parsePhoneNumber(profile.phone).country.iso} name={parsePhoneNumber(profile.phone).country.name} className="w-5 h-3.5" />
                      <p className="font-semibold text-gray-900 dark:text-white text-sm font-mono tracking-wide">
                        {profile.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-400 text-sm italic">No contact number added</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {editing && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="flex gap-3 pt-1">
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <FaSave />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleCancel} className="px-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                  <FaTimes /> Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FaExclamationTriangle className="text-red-500 flex-shrink-0" size={15} />
                <h3 className="text-base font-black text-red-600 dark:text-red-400">Danger Zone</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                Delete your account. Your profile is safely archived in a <strong>30-day recovery vault</strong> and can be restored if you contact an admin within 30 days.
              </p>
            </div>
            {isSuperAdmin || isDemoAdmin ? (
              <span className="px-3.5 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 self-start">
                <FaShieldAlt size={12} /> {isDemoAdmin ? 'Demo Admin Protected' : 'Superadmin Protected'}
              </span>
            ) : (
              <button type="button" onClick={openDeleteModal} className="px-4 py-2.5 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95 shadow-xs">
                <FaTrash size={12} /> Delete Account
              </button>
            )}
          </div>
        </motion.div>

      </div>

      {/* ── Multi-Step Account Deletion Modal (Industry Standard Dialog Layout) ───────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
              onClick={() => !deletingAccount && setShowDeleteModal(false)}
              aria-hidden="true"
            />

            {/* Modal Panel */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-red-200 dark:border-red-900/40 overflow-hidden flex flex-col text-left max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                    <FaUserSlash size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">Delete Account</h3>
                    <p className="text-[11px] text-gray-400 font-semibold">Step {deleteStep} of 3</p>
                  </div>
                </div>
                <button
                  onClick={() => !deletingAccount && setShowDeleteModal(false)}
                  disabled={deletingAccount}
                  type="button"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                  aria-label="Close modal"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Progress Indicator Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 flex-shrink-0">
                <div
                  className="bg-gradient-to-r from-amber-500 to-red-500 h-1 transition-all duration-300"
                  style={{ width: `${(deleteStep / 3) * 100}%` }}
                />
              </div>

              {/* Scrollable Step Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3">
                {/* ── STEP 1: Impact Warnings & Reason ──────────────────────── */}
                {deleteStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2.5">
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                      <FaExclamationTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={13} />
                      <div>
                        <p className="font-bold">Account Deletion Notice</p>
                        <p className="text-[11px] opacity-90">Please review the 30-day recovery timeline and implications below.</p>
                      </div>
                    </div>

                    {/* Impact Cards */}
                    <div className="space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-start gap-2.5">
                        <FaLock className="text-red-500 flex-shrink-0 mt-0.5" size={12} />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">Immediate Session Sign Out</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">You will be logged out on all devices immediately.</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-start gap-2.5">
                        <FaClock className="text-blue-500 flex-shrink-0 mt-0.5" size={12} />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">Booking &amp; Inquiry History</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">Your profile and bookings become inactive during the grace period.</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2.5">
                        <FaInfoCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={12} />
                        <div>
                          <p className="font-bold text-emerald-900 dark:text-emerald-300">30-Day Recovery Vault</p>
                          <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400 leading-relaxed">
                            Your account is safely archived for <strong>30 days</strong>. If you wish to restore it, you can contact an admin anytime within 30 days to reactivate your account and history!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reason Selection */}
                    <div className="pt-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Why are you leaving? (optional)
                      </label>
                      <select
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="">Select a reason...</option>
                        {DELETION_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>

                      {deleteReason.includes('Other') && (
                        <textarea
                          rows={2}
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Please provide details..."
                          className="w-full mt-2 text-xs p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 resize-none"
                        />
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 2: Security Verification & Confirmation Phrase ─────── */}
                {deleteStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                      <FaShieldAlt className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={13} />
                      <div>
                        <p className="font-bold">Security Verification</p>
                        <p className="text-[11px] opacity-90">Please complete the human check and type the confirmation phrase below.</p>
                      </div>
                    </div>

                    {/* Human Security Puzzle */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-1.5">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Security Challenge: What is <span className="text-teal-600 dark:text-teal-400 font-black text-sm">{securityProblem.num1} + {securityProblem.num2}</span>?
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={securityInput}
                          onChange={(e) => setSecurityInput(e.target.value)}
                          placeholder="Answer"
                          className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                        {isSecuritySolved && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1 text-xs font-bold">
                            <FaCheck size={11} /> Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Confirmation Phrase Input */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                        Type <span className="font-mono text-red-600 dark:text-red-400 font-black select-all">DELETE MY ACCOUNT</span> or your email (<span className="font-mono text-gray-600 dark:text-gray-300 select-all">{user?.email}</span>) to confirm:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="Type confirmation phrase here..."
                          className={`w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border text-gray-900 dark:text-white focus:outline-none transition-colors ${isPhraseMatched
                            ? 'border-green-500 focus:border-green-500 ring-1 ring-green-500/20'
                            : 'border-gray-200 dark:border-gray-700 focus:border-red-500'
                            }`}
                        />
                        {isPhraseMatched && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 flex items-center gap-1 text-xs font-bold">
                            <FaCheck size={11} /> Match
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {isPhraseMatched
                          ? 'Confirmation phrase verified.'
                          : 'Must match exactly before proceeding.'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* ── STEP 3: Final 30-Day Notice & Turnstile Verification ───── */}
                {deleteStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-2xl text-xs text-red-900 dark:text-red-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm text-red-600 dark:text-red-400">
                        <FaExclamationTriangle size={13} /> Final Confirmation
                      </div>
                      <p className="leading-relaxed">
                        Your active account for <strong className="font-mono text-gray-900 dark:text-white">{user?.email}</strong> will be archived.
                      </p>
                      <p className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed">
                        Data will be preserved in our recovery vault for <strong>30 days</strong> before permanent deletion.
                      </p>
                    </div>

                    {/* 30-Day Restoration Guide Card */}
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-1">
                      <p className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                        <FaInfoCircle className="text-emerald-600 dark:text-emerald-400" size={13} />
                        How to restore your account:
                      </p>
                      <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400 leading-relaxed">
                        If you ever change your mind, simply contact our administration team via the <strong>Contact Us</strong> page or email <strong>nicomantourism.myth520@silomails.com</strong> within <strong>30 days</strong>, and an admin can instantly restore your account and all booking history!
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 text-xs space-y-1">
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Account Email:</span>
                        <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{user?.email}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>Recovery Window:</span>
                        <span className="font-semibold text-teal-600 dark:text-teal-400">30 Days (Contact Admin to Restore)</span>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-gray-400">
                        <span>After 30 Days:</span>
                        <span className="text-red-500 font-semibold">Permanently Purged</span>
                      </div>
                    </div>

                    {/* Turnstile Bot Verification */}
                    {turnstileSiteKey && (
                      <div className="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                        <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                          <FaShieldAlt className="text-teal-500" size={12} /> Security Verification (Turnstile)
                        </p>
                        <div className="flex justify-center min-h-[65px] items-center">
                          <Turnstile
                            siteKey={turnstileSiteKey}
                            onSuccess={(tok) => setTurnstileToken(tok)}
                            onError={() => setTurnstileToken('')}
                            onExpire={() => setTurnstileToken('')}
                            options={{ theme: 'auto', size: 'compact' }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Modal Pinned Bottom Sticky Actions */}
              <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-100/95 dark:bg-gray-900/95 backdrop-blur-sm flex-shrink-0 z-30 flex gap-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {deleteStep === 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteStep(2)}
                      className="flex-1 py-2.5 sm:py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      Continue <FaArrowRight size={11} />
                    </button>
                  </>
                )}

                {deleteStep === 2 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setDeleteStep(1)}
                      className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
                    >
                      <FaArrowLeft size={10} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={!isPhraseMatched || !isSecuritySolved}
                      onClick={() => setDeleteStep(3)}
                      className="flex-1 py-2.5 sm:py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      Next Step <FaArrowRight size={11} />
                    </button>
                  </>
                )}

                {deleteStep === 3 && (
                  <>
                    <button
                      type="button"
                      disabled={deletingAccount}
                      onClick={() => setDeleteStep(2)}
                      className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
                    >
                      <FaArrowLeft size={10} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={deletingAccount || (Boolean(turnstileSiteKey) && !turnstileToken)}
                      onClick={handleExecuteDelete}
                      className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingAccount ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Deleting &amp; Archiving...</span>
                        </>
                      ) : (
                        <>
                          <FaTrash size={12} />
                          <span>Permanently Delete My Account</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Custom Confirmation Modal for Avatar Removal ── */}
      <AnimatePresence>
        {showRemoveAvatarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deletingAvatar && setShowRemoveAvatarModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 z-10 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
                <FaTrash size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Remove Profile Photo?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This will remove your custom photo from storage and revert your avatar to your initials.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRemoveAvatarModal(false)}
                  disabled={deletingAvatar}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAvatarDelete}
                  disabled={deletingAvatar}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {deletingAvatar ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FaTrash size={11} />
                  )}
                  {deletingAvatar ? 'Removing...' : 'Remove Photo'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Profile;
