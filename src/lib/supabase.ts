import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://vexuyidvulrknyfzwbul.supabase.co",
  "sb_publishable_xBDXcgqG8R9cPqUC6Y7NxA_8wYV0w9t",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
