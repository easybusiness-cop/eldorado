import { createClient } from "@supabase/supabase-js";

export function normalizeSupabaseUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/(?:rest|auth)\/v1\/?$/i, "");
  url = url.replace(/\/+$/, "");
  return url;
}

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
    console.warn(
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

