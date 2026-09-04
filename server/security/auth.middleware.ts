import type { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  identity?: {
    userId: string;
    organizationId: string;
    roles: string[];
  };
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.header("x-rufflo-user-id");
  const organizationId = req.header("x-rufflo-organization-id");
  const rolesHeader = req.header("x-rufflo-roles");

  if (!userId || !organizationId) {
    return res.status(401).json({
      error: "Authentication required.",
    });
  }

  req.identity = {
    userId,
    organizationId,
    roles:
      rolesHeader
        ?.split(",")
        .map((x) => x.trim())
        .filter(Boolean) ?? [],
  };

  next();
}
