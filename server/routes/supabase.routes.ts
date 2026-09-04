import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

export const supabaseRouter = Router();

supabaseRouter.get("/diagnostic", async (req, res) => {
  const startTime = Date.now();
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();

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
    
    // Test auth or profiles table inquiry
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, full_name, role, department")
      .limit(3);

    const { data: orgs, error: orgErr } = await supabase
      .from("organization_members")
      .select("*, organizations(*)")
      .limit(3);

    const latencyMs = Date.now() - startTime;

    if (profileErr && profileErr.code !== "42P01") {
      console.error("[Server Supabase Diagnostic Error]:", profileErr);
    }

    return res.json({
      success: true,
      status: "ok",
      message: "Supabase Sync OK (Server Verified)",
      latencyMs,
      environment: {
        hasUrl: true,
        hasKey: true,
        urlPreview: `${url.slice(0, 22)}...`,
      },
      data: {
        profilesCount: profiles?.length || 0,
        sampleProfiles: profiles || [],
        orgsCount: orgs?.length || 0,
        sampleOrgs: orgs || [],
      },
      errors: {
        profileError: profileErr ? profileErr.message : null,
        orgError: orgErr ? orgErr.message : null,
      },
    });
  } catch (err: any) {
    console.error("[Server Supabase Exception]:", err);
    return res.status(500).json({
      success: false,
      status: "error",
      message: err.message || "Server exception during Supabase verification",
      latencyMs: Date.now() - startTime,
    });
  }
});
