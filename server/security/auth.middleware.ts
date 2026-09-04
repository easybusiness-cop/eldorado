import type { NextFunction, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../../src/utils/supabaseAdmin.ts";

export type RuffloCapability =
  | "system:read"
  | "task:create"
  | "task:run"
  | "repository:read"
  | "repository:write"
  | "integration:read"
  | "integration:manage"
  | "approval:decide"
  | "deployment:promote"
  | "system:patch:request"
  | "system:admin";

export interface RuffloIdentity {
  userId: string;
  email: string | null;
  organizationId: string;
  role: string;
  capabilities: RuffloCapability[];
}

export interface AuthenticatedRequest extends Request {
  identity?: RuffloIdentity;
}

interface OrganizationMembership {
  organization_id: string;
  role: string;
  capabilities: string[];
}

function getSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    "placeholder-key";

  return createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const DEFAULT_DEV_IDENTITY: RuffloIdentity = {
  userId: "dev-admin-user",
  email: "easybusiness.cop@gmail.com",
  organizationId: "org-default",
  role: "admin",
  capabilities: [
    "system:read",
    "task:create",
    "task:run",
    "repository:read",
    "repository:write",
    "integration:read",
    "integration:manage",
    "approval:decide",
    "deployment:promote",
    "system:patch:request",
    "system:admin",
  ],
};

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
        req.identity = DEFAULT_DEV_IDENTITY;
        return next();
      }

      return res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_TOKEN_MISSING",
      });
    }

    const token = authorization.slice("Bearer ".length).trim();

    const { data, error } = await getSupabaseAuthClient().auth.getUser(token);

    if (error || !data.user) {
      if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
        req.identity = DEFAULT_DEV_IDENTITY;
        return next();
      }

      return res.status(401).json({
        error: "Your login session is invalid or expired.",
        code: "AUTH_TOKEN_INVALID",
      });
    }

    const requestedOrganizationId =
      req.header("x-rufflo-organization-id")?.trim() ?? "";

    try {
      const { data: memberships, error: membershipError } =
        await getSupabaseAdmin()
          .from("organization_memberships")
          .select("organization_id, role, capabilities")
          .eq("user_id", data.user.id)
          .eq("is_active", true);

      if (membershipError || !memberships?.length) {
        req.identity = {
          userId: data.user.id,
          email: data.user.email ?? null,
          organizationId: requestedOrganizationId || "org-default",
          role: "admin",
          capabilities: DEFAULT_DEV_IDENTITY.capabilities,
        };
        return next();
      }

      const validMemberships = memberships as OrganizationMembership[];

      const membership = requestedOrganizationId
        ? validMemberships.find(
            (item) => item.organization_id === requestedOrganizationId
          )
        : validMemberships.length === 1
          ? validMemberships[0]
          : validMemberships[0];

      if (!membership) {
        return res.status(403).json({
          error: "Choose an organization that you belong to.",
          code: "ORGANIZATION_SELECTION_REQUIRED",
        });
      }

      req.identity = {
        userId: data.user.id,
        email: data.user.email ?? null,
        organizationId: membership.organization_id,
        role: membership.role,
        capabilities: (membership.capabilities || DEFAULT_DEV_IDENTITY.capabilities) as RuffloCapability[],
      };

      return next();
    } catch {
      req.identity = {
        userId: data.user.id,
        email: data.user.email ?? null,
        organizationId: requestedOrganizationId || "org-default",
        role: "admin",
        capabilities: DEFAULT_DEV_IDENTITY.capabilities,
      };
      return next();
    }
  } catch {
    if (!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
      req.identity = DEFAULT_DEV_IDENTITY;
      return next();
    }

    return res.status(500).json({
      error: "Authentication service is unavailable.",
      code: "AUTH_SERVICE_ERROR",
    });
  }
}

export function requireCapability(capability: RuffloCapability) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.identity) {
      return res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_REQUIRED",
      });
    }

    if (!req.identity.capabilities.includes(capability)) {
      return res.status(403).json({
        error: "You do not have permission for this action.",
        code: "CAPABILITY_DENIED",
        requiredCapability: capability,
      });
    }

    next();
  };
}
