import { getSupabaseClient } from '../../../lib/supabase/client'

export const DISPLAY_NAME_MAX_LENGTH = 80

// Same rule as the profiles_display_name_length constraint.
export function validateDisplayName(value: string): string | undefined {
  const name = value.trim()
  if (!name) return 'El nombre es obligatorio.'
  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    return `El nombre no puede superar los ${DISPLAY_NAME_MAX_LENGTH} caracteres.`
  }
  return undefined
}

// RLS only lets users update the display_name of their own profile.
export async function updateDisplayName(userId: string, name: string): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .from('profiles')
    .update({ display_name: name.trim() })
    .eq('id', userId)
    .select('display_name')
    .single()
  if (error) throw error
  return data.display_name
}