import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pxmhzjxsbcwqmoctkkhu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4bWh6anhzYmN3cW1vY3Rra2h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDUzMTksImV4cCI6MjA3NjI4MTMxOX0.B6xH_SLhOihiG_lc7iHskvFKil6uWOf47JNQhuxF27Q';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
