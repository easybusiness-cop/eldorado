import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient.ts";

const GOOGLE_WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/presentations",
].join(" ");

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user && session.access_token) {
      onAuthSuccess?.(session.user, session.access_token);
      return;
    }

    onAuthFailure?.();
  }).data.subscription;
};

export async function signInToRufflo(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    throw error;
  }
}

/*
  Use only when the user explicitly connects Google Workspace.
  Normal Rufflo login must not request Gmail/Drive/Calendar permissions.
*/
export async function connectGoogleWorkspace(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
      scopes: GOOGLE_WORKSPACE_SCOPES,
    },
  });

  if (error) {
    throw error;
  }
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

export async function workspaceSignOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
