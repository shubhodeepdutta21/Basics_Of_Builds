import { createClient } from '@supabase/supabase-js'


const supabaseUrl = 'https://iodtiwqhsdimbqachhtk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZHRpd3Foc2RpbWJxYWNoaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MjEwMzQsImV4cCI6MjA5MTM5NzAzNH0.hxtAbkC6BBIQh39EpsR2EOZwpcEL-ImZYQyJIFydJhc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)