import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iodtiwqhsdimbqachhtk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZHRpd3Foc2RpbWJxYWNoaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjEwMzQsImV4cCI6MjA5MTM5NzAzNH0.hxtAbkC6BBIQh39EpsR2EOZwpcEL-ImZYQyJIFydJhc';

// Create a single client instance to prevent GoTrueClient multiple instance warnings
export const supabase = createClient(supabaseUrl, supabaseAnonKey);