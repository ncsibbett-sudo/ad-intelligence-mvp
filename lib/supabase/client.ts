import { createClient } from '@supabase/supabase-js';

// Hardcoded for deployment (these are public keys, safe to expose)
const supabaseUrl = 'https://utmnwtxtwxfymrcyrgqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW53dHh0d3hmeW1yY3lyZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTg5MTksImV4cCI6MjA3NTY3NDkxOX0.k_veXnDKq5vWZC32OZkuf7-A2fGqDuJMYezZnaav3m8';

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
