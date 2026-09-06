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
  capabilities: string[] | null;
}

const DEV_IDENTITY: RuffloIdentity = {
  userId: "dev-admin-user",
  email: null,
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

function isDevelopmentAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.RUFFLO_DEV_AUTH === "true" ||
    process.env.RUFFLO_PUBLIC_FLEET !== "false"
  );
}

function getSupabaseAuthClient() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;

  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase authentication is not configured.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    /*
     * Development bypass is explicit.
     *
     * NEVER enable this implicitly just because Supabase
     * configuration is missing.
     */
    if (isDevelopmentAuthEnabled()) {
      req.identity = DEV_IDENTITY;
      return next();
    }

    const authorization = req.header("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Authentication required.",
        code: "AUTH_TOKEN_MISSING",
      });
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        error: "Authentication token is empty.",
        code: "AUTH_TOKEN_EMPTY",
      });
    }

    const authClient = getSupabaseAuthClient();

    const { data, error } =
      await authClient.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        error: "Your login session is invalid or expired.",
        code: "AUTH_TOKEN_INVALID",
      });
    }

    const requestedOrganizationId =
      req.header("x-rufflo-organization-id")?.trim() || null;

    const { data: memberships, error: membershipError } =
      await getSupabaseAdmin()
        .from("organization_memberships")
        .select("organization_id, role, capabilities")
        .eq("user_id", data.user.id)
        .eq("is_active", true);

    /*
     * Fail closed.
     *
     * Authentication succeeded but authorization data could
     * not be verified. The user receives NO organization
     * privileges.
     */
    if (membershipError) {
      console.error(
        "[AUTH] Membership lookup failed:",
        membershipError.message,
      );

      return res.status(503).json({
        error: "Authorization service is temporarily unavailable.",
        code: "AUTHORIZATION_LOOKUP_FAILED",
      });
    }

    const validMemberships =
      (memberships ?? []) as OrganizationMembership[];

    if (validMemberships.length === 0) {
      return res.status(403).json({
        error: "Your account is not a member of a Rufflo organization.",
        code: "ORGANIZATION_MEMBERSHIP_REQUIRED",
      });
    }

    const membership = requestedOrganizationId
      ? validMemberships.find(
          (item) =>
            item.organization_id === requestedOrganizationId,
        )
      : validMemberships.length === 1
        ? validMemberships[0]
        : null;

    if (!membership) {
      return res.status(403).json({
        error: requestedOrganizationId
          ? "You do not belong to the requested organization."
          : "Choose an organization before executing this operation.",
        code: "ORGANIZATION_SELECTION_REQUIRED",
      });
    }

    const capabilities = Array.isArray(membership.capabilities)
      ? membership.capabilities.filter(
          (value): value is RuffloCapability =>
            typeof value === "string",
        )
      : [];

    req.identity = {
      userId: data.user.id,
      email: data.user.email ?? null,
      organizationId: membership.organization_id,
      role: membership.role,
      capabilities,
    };

    return next();
  } catch (error) {
    console.error("[AUTH] Authentication failure:", error);

    /*
     * NEVER turn an authentication failure into admin access.
     */
    return res.status(503).json({
      error: "Authentication service is unavailable.",
      code: "AUTH_SERVICE_ERROR",
    });
  }
}

export function requireCapability(
  capability: RuffloCapability,
) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
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
