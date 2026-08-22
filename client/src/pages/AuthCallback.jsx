import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GiIsland } from 'react-icons/gi';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let mounted = true;

    const handleAuthCallback = async () => {
      try {
        // 1. Check URL parameters for OAuth errors
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        
        const error = params.get('error') || hashParams.get('error');
        const errorDesc = params.get('error_description') || hashParams.get('error_description');

        if (error) {
          throw new Error(errorDesc || error);
        }

        // 2. Fetch session from Supabase client (Supabase automatically handles PKCE code exchange or hash tokens)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const completeSignIn = async (activeSession) => {
          if (!activeSession?.user || !mounted) return;
          try {
            // Guarantee profile is saved into Supabase profiles table
            if (activeSession.access_token) {
              await axios.post('/api/user/sync-profile', {}, {
                headers: { Authorization: `Bearer ${activeSession.access_token}` },
              });
            }
          } catch (syncErr) {
            console.warn('[AuthCallback] Profile sync notice:', syncErr.message);
          }

          if (mounted) {
            toast.success('Successfully signed in with Google!');
            navigate('/', { replace: true });
          }
        };

        if (session) {
          await completeSignIn(session);
        } else {
          // Listen for auth state change in case of delay in code exchange
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
            if (event === 'SIGNED_IN' && s && mounted) {
              await completeSignIn(s);
            }
          });

          // Fallback redirect after 3.5s
          setTimeout(() => {
            if (mounted) navigate('/', { replace: true });
          }, 3500);

          return () => subscription.unsubscribe();
        }
      } catch (err) {
        console.error('[AuthCallback] OAuth error:', err.message);
        if (mounted) {
          setErrorMsg(err.message);
          toast.error('Google Sign-In failed: ' + err.message);
          setTimeout(() => navigate('/auth', { replace: true }), 3000);
        }
      }
    };

    handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        className="text-6xl text-teal-500"
      >
        <GiIsland />
      </motion.div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {errorMsg ? 'Authentication Failed' : 'Completing Google Sign In...'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {errorMsg ? errorMsg : 'Please wait while we secure your session...'}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
