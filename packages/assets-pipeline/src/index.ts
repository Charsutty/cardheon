export type AssetManifestEntry = {
  slug: string;
  type: "card_illustration" | "thumbnail" | "pack_cover" | "constellation_background";
  path: string;
  license?: string;
  attribution?: string;
};
