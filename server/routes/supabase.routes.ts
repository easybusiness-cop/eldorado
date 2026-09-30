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

function withTimeout<T>(promise: PromiseLike<T>, ms = 2500, timeoutError = "Supabase probe timed out"): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(timeoutError)), ms)),
  ]);
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
    
    // Probe profiles table with wildcard with strict timeout
    const { data: profiles, error: profileErr } = await withTimeout(
      supabase.from("profiles").select("*").limit(3),
      2500,
      "Timeout probing Supabase 'profiles' table"
    );

    // Probe threads or organization memberships with strict timeout
    const { data: threads, error: threadErr } = await withTimeout(
      supabase.from("threads").select("*").limit(3),
      2500,
      "Timeout probing Supabase 'threads' table"
    );

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
    return res.status(200).json({
      success: false,
      status: "timeout_or_unreachable",
      message: err?.message || "Server exception during Supabase verification",
      latencyMs: Date.now() - startTime,
      environment: {
        hasUrl: true,
        hasKey: true,
        urlPreview: `${url.slice(0, 25)}...`,
      },
    });
  }
});
