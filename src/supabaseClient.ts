import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://skzfmydrstmgzykmwxfz.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNremZteWRyc3RtZ3p5a213eGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MDU3MjYsImV4cCI6MjEwMzE4MTcyNn0.hGcX0-tJp6lfSNJKxzow60Bq5AnhspV8hwEnp5wJfFI';

export const supabase = createClient(supabaseUrl, supabaseKey);