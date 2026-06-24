import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { json } from './cors.ts'

export async function getAuthenticatedUser(
  request: Request,
): Promise<{ userId: string; supabase: ReturnType<typeof createClient> }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment is not configured')
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization) {
    throw new Error('Missing Authorization header')
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Invalid user token')
  }

  return { userId: userData.user.id, supabase }
}
