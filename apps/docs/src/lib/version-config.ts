export type VersionInfo = {
  id: string;
  label: string;
  preRelease: boolean;
};

export const VERSIONS: VersionInfo[] = [
  { id: "1.0", label: "v1.0", preRelease: false },
  { id: "2.0", label: "v2.0", preRelease: false },
];

/** Which version base-path URLs (e.g. /snap/building) resolve to. */
export const DEFAULT_VERSION = "2.0";

export const PUBLISHED_VERSIONS = VERSIONS.filter((v) => !v.preRelease);

export function isValidVersion(id: string): boolean {
  return VERSIONS.some((v) => v.id === id);
}

export function getVersionInfo(id: string): VersionInfo | undefined {
  return VERSIONS.find((v) => v.id === id);
}
