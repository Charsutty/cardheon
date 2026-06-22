export type ContentVersion = {
  version: string;
  status: "draft" | "published" | "deprecated";
  publishedAt?: string;
  minAppVersion?: string;
};
