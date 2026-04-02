import { createClient } from "@supabase/supabase-js";

// Next.js uses process.env to access environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// This will now pull dynamically from your .env file
export const supabase = createClient(supabaseUrl, supabaseKey);