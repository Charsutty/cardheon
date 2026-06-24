import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Supabase environment is not configured' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase
    .from('catalog_versions')
    .select('id, minimum_app_version, catalog_checksum, asset_base_url, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return json({ error: error.message }, 500)
  }

  if (!data) {
    return json({ error: 'No published catalog version' }, 404)
  }

  return json({
    catalogVersion: data.id,
    minimumAppVersion: data.minimum_app_version,
    catalogChecksum: data.catalog_checksum,
    assetBaseUrl: data.asset_base_url ?? undefined,
    publishedAt: data.published_at,
  })
})

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders })
}
