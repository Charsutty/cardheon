import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return Response.json({ error: 'Supabase environment is not configured' }, { status: 500 })
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
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return Response.json({ error: 'No published catalog version' }, { status: 404 })
  }

  return Response.json({
    catalogVersion: data.id,
    minimumAppVersion: data.minimum_app_version,
    catalogChecksum: data.catalog_checksum,
    assetBaseUrl: data.asset_base_url ?? undefined,
    publishedAt: data.published_at,
  })
})
