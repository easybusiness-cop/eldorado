import { getSupabaseAccessToken } from "./workspaceAuth.ts";

let installed = false;

export function installApiAuthentication(): void {
  if (installed || typeof window === "undefined") {
    return;
  }

  installed = true;

  const originalFetch = window.fetch.bind(window);

  const customFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    try {
      const requestUrl =
        typeof input === "string"
          ? new URL(input, window.location.origin)
          : input instanceof URL
            ? input
            : new URL(input.url, window.location.origin);

      const isRuffloApi =
        requestUrl.origin === window.location.origin &&
        requestUrl.pathname.startsWith("/api/") &&
        requestUrl.pathname !== "/api/health";

      if (!isRuffloApi) {
        return originalFetch(input, init);
      }

      const headers = new Headers(
        input instanceof Request ? input.headers : undefined
      );
      new Headers(init?.headers).forEach((value, name) => {
        headers.set(name, value);
      });

      // Rufflo's API verifies Supabase JWTs, so never forward a Firebase or
      // demo token supplied by a caller.
      const token = await getSupabaseAccessToken();

      if (!token) {
        // Keep anonymous polling from generating repeated browser network
        // errors. Returning the same auth contract locally lets existing
        // callers handle the unauthenticated state without contacting APIs.
        return new Response(
          JSON.stringify({
            error: "Authentication required.",
            code: "AUTH_TOKEN_MISSING",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      headers.set("Authorization", `Bearer ${token}`);

      return originalFetch(input, {
        ...init,
        headers,
      });
    } catch {
      return originalFetch(input, init);
    }
  };

  try {
    Object.defineProperty(window, "fetch", {
      value: customFetch,
      writable: true,
      configurable: true,
    });
  } catch {
    try {
      (window as any).fetch = customFetch;
    } catch (e) {
      console.warn("Could not override window.fetch:", e);
    }
  }
}
