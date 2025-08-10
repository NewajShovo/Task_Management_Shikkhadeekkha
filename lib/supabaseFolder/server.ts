import { createClient } from "@supabase/supabase-js";

export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your project environment."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
