import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { appEnv, hasSupabaseConfig } from "@/lib/env";

let supabaseAdminClient: SupabaseClient | null | undefined;

export function getSupabaseAdminClient() {
  if (supabaseAdminClient !== undefined) {
    return supabaseAdminClient;
  }

  if (!hasSupabaseConfig()) {
    supabaseAdminClient = null;
    return supabaseAdminClient;
  }

  supabaseAdminClient = createClient(
    appEnv.supabaseUrl!,
    appEnv.supabaseServiceRoleKey ?? appEnv.supabaseAnonKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return supabaseAdminClient;
}

export async function getSupabaseHealth() {
  const client = getSupabaseAdminClient();

  if (!client) {
    return { configured: false, healthy: false, detail: "Supabase env is missing." };
  }

  try {
    const { data, error } = await client.storage.listBuckets();

    if (error) {
      return { configured: true, healthy: false, detail: error.message };
    }

    return { configured: true, healthy: true, detail: `${data.length} bucket(s) reachable.` };
  } catch (error) {
    return {
      configured: true,
      healthy: false,
      detail: error instanceof Error ? error.message : "Unknown Supabase error.",
    };
  }
}
