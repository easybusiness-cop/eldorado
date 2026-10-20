import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "../../shared/supabase-url.ts";

export { normalizeSupabaseUrl } from "../../shared/supabase-url.ts";

const env = (typeof import.meta !== "undefined" && (import.meta as any).env) || (typeof process !== "undefined" && process.env) || {};
const rawSupabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl) || "https://placeholder.supabase.co";
const supabasePublishableKey = (
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  "placeholder-key"
).trim();

if (!rawSupabaseUrl || !supabasePublishableKey || supabasePublishableKey === "placeholder-key") {
  if (typeof window !== "undefined") {
    console.info(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
    );
  }
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
