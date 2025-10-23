import { createClient } from '@supabase/supabase-js';

// For Next.js client-side, we need to check if window is defined
const isBrowser = typeof window !== 'undefined';

// Get environment variables - these are replaced at build time by Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Log for debugging (only in browser)
if (isBrowser) {
  console.log('Supabase client initialization:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlPreview: supabaseUrl?.substring(0, 30)
  });
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined' || supabaseAnonKey === 'undefined') {
  const errorMsg = `Supabase configuration error. URL: ${!!supabaseUrl}, Key: ${!!supabaseAnonKey}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
