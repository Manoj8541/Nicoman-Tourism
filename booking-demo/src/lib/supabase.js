import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aojjkrpvzlmxylcyaddg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvamprcnB2emxteHlsY3lhZGRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTQ0ODQsImV4cCI6MjEwMDk5MDQ4NH0.OrdFjxJd4oc5X6zvcVWHKhe297TJgB52OuFJk6m1YMU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
