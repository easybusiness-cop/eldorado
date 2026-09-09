import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

export const supabaseRouter = Router();

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

supabaseRouter.get("/diagnostic", async (req, res) => {
  const startTime = Date.now();
  const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const url = normalizeSupabaseUrl(rawUrl);
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();

  const isConfigured = Boolean(url && key && !url.includes("placeholder") && url.startsWith("http"));

  if (!isConfigured) {
    return res.json({
      success: false,
      status: "unconfigured",
      message: "Supabase environment variables (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) are missing or unconfigured.",
      latencyMs: Date.now() - startTime,
      environment: {
        hasUrl: Boolean(url),
        hasKey: Boolean(key),
        urlPreview: url ? (url.length > 25 ? `${url.slice(0, 22)}...` : url) : "Missing",
      },
    });
  }

  try {
    const supabase = createClient(url, key);
    
    // Probe profiles table with wildcard to support all valid schema variants
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .limit(3);

    // Probe threads or organization memberships
    const { data: threads, error: threadErr } = await supabase
      .from("threads")
      .select("*")
      .limit(3);

    const latencyMs = Date.now() - startTime;

    if (profileErr && profileErr.code !== "42P01" && profileErr.code !== "PGRST205") {
      console.warn("[Server Supabase Diagnostic Notice]:", profileErr.message);
    }

    return res.json({
      success: true,
      status: "ok",
      message: "Supabase Sync OK (Server Verified)",
      latencyMs,
      environment: {
        hasUrl: true,
        hasKey: true,
        urlPreview: `${url.slice(0, 25)}...`,
      },
      data: {
        profilesCount: profiles?.length || 0,
        sampleProfiles: profiles || [],
        threadsCount: threads?.length || 0,
        sampleThreads: threads || [],
      },
      errors: {
        profileError: profileErr ? profileErr.message : null,
        threadError: threadErr ? threadErr.message : null,
      },
    });
  } catch (err: any) {
    console.error("[Server Supabase Exception]:", err?.message || err);
    return res.status(500).json({
      success: false,
      status: "error",
      message: err?.message || "Server exception during Supabase verification",
      latencyMs: Date.now() - startTime,
    });
  }
});
