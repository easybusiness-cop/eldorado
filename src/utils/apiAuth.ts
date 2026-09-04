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
        requestUrl.pathname.startsWith("/api/");

      if (!isRuffloApi) {
        return originalFetch(input, init);
      }

      const token = await getSupabaseAccessToken();

      if (!token) {
        return originalFetch(input, init);
      }

      const headers = new Headers(
        init?.headers ??
          (input instanceof Request ? input.headers : undefined)
      );

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
