import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type AppSupabaseClient = SupabaseClient<Database>

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.local.',
    )
    this.name = 'SupabaseNotConfiguredError'
  }
}

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && publishableKey)

let client: AppSupabaseClient | null = null

// Only the public (publishable/anon) key belongs here; authorization is
// enforced by RLS in PostgreSQL.
export function getSupabaseClient(): AppSupabaseClient {
  if (!url || !publishableKey) {
    throw new SupabaseNotConfiguredError()
  }

  client ??= createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })

  return client
}
