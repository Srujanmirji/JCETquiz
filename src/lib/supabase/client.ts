"use client"

import { createBrowserClient } from "@supabase/ssr"
import { publicEnv } from "@/lib/env"

/** Anon-key client. Subject to every RLS policy in supabase/migrations/0002. */
export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey)
}
