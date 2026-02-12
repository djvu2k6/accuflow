import { createClient } from "@supabase/supabase-js";

// Vite uses import.meta.env to access environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This will now pull dynamically from your .env file
export const supabase = createClient(supabaseUrl, supabaseKey);