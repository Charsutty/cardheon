export type CatalogManifest = {
  catalogVersion: string
  minimumAppVersion: string
  catalogChecksum: string
  assetBaseUrl?: string
  publishedAt: string
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL

export async function fetchCatalogManifest(): Promise<CatalogManifest | undefined> {
  if (!SUPABASE_URL) return undefined

  const response = await fetch(`${SUPABASE_URL}/functions/v1/catalog-manifest`)
  if (!response.ok) throw new Error(`catalog_manifest_${response.status}`)
  return await response.json() as CatalogManifest
}
