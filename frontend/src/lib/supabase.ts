import { createClient } from "@supabase/supabase-js";

type SupabaseRuntimeEnv = {
  DEV: boolean;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

export function getSupabaseRuntimeState(env: SupabaseRuntimeEnv) {
  const isConfigured = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY);

  return {
    isConfigured,
    isLocalPreviewMode: env.DEV && !isConfigured,
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "local-preview-key";

const supabaseRuntimeState = getSupabaseRuntimeState(import.meta.env);

export const isSupabaseConfigured = supabaseRuntimeState.isConfigured;
export const isLocalPreviewMode = supabaseRuntimeState.isLocalPreviewMode;

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
