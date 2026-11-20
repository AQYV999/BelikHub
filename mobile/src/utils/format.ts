// mobile/src/utils/format.ts
// Shared display formatters.

/** "Desa Bismo" and "Bismo" both render as "Desa Bismo" (never "Desa Desa Bismo"). */
export function villageLabel(village?: string | null): string {
  const name = (village || '').replace(/^\s*desa\s+/i, '').trim();
  return name ? `Desa ${name}` : '';
}
