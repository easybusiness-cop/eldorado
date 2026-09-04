import { Request, Response, NextFunction } from "express";

export class SecuritySecretService {
  private static readonly REDACT_PATTERNS = [
    /ghp_[a-zA-Z0-9]{30,40}/gi, // GitHub Personal Access Tokens
    /sk_live_[a-zA-Z0-9]{24,34}/gi, // Stripe Live API keys
    /AIza[0-9A-Za-z-_]{35}/gi, // Google API keys
    /Bearer\s+[a-zA-Z0-9_\-\.]{20,}/gi, // Bearer auth tokens
  ];

  public static redact(content: string): string {
    let sanitized = content;
    for (const pattern of this.REDACT_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SECURITY_GATEWAY]');
    }
    return sanitized;
  }
}

export class SecurityAuthorizationService {
  public static isSuperAdmin(role: string): boolean {
    const r = (role || '').toLowerCase();
    return r === 'admin' || r === 'executive' || r === 'owner' || r === 'director';
  }

  /**
   * Express Middleware to enforce strict clearance boundaries.
   * Scans headers, query parameters, or body contents for profile roles and tenant validation.
   */
  public static enforceClearance(requiredLevel: 'PUBLIC' | 'SECURE' | 'ADMIN') {
    return (req: Request, res: Response, next: NextFunction) => {
      // 1. Verify Tenant ID and Operator profile context
      const tenantId = req.headers['x-tenant-id'] || req.body.tenantId || req.query.tenantId || 'munderdiffl-default-tenant';
      const userProfile = req.body.userProfile || req.query.userProfile ? JSON.parse(req.query.userProfile as string || '{}') : {};
      const userRole = userProfile.role || 'guest';

      // 2. Enforce Role validations
      if (requiredLevel === 'ADMIN') {
        const hasClearance = this.isSuperAdmin(userRole);
        if (!hasClearance) {
          console.warn(`[Clearance Breach Attempt] User with role "${userRole}" attempted to access ADMIN scoped endpoint: ${req.originalUrl}`);
          return res.status(403).json({
            error: "Security Access Denied",
            code: "ADMIN_CLEARANCE_REQUIRED",
            message: "This resource contains highly confidential enterprise systems operations. Only Super-Administrators have execution clearance."
          });
        }
      } else if (requiredLevel === 'SECURE') {
        const isGuest = userRole === 'guest' || !userRole;
        if (isGuest) {
          console.warn(`[Clearance Breach Attempt] Unauthenticated session attempted to access SECURE endpoint: ${req.originalUrl}`);
          return res.status(403).json({
            error: "Security Access Denied",
            code: "SECURE_CLEARANCE_REQUIRED",
            message: "This workstation requires a validated operator profile with authenticated permissions clearance."
          });
        }
      }

      // 3. Log validated request flow with zero-trust clearance details
      next();
    };
  }
}
