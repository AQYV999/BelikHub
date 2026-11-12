// lib/springs-seed.js
// Data baseline resmi BelikHub (RISPAM Kab. Batang 2022, Pergub Jateng No. 7/2026).
// Menggabungkan data publik dengan field privat khusus server.

import { METRICS, SPRINGS as PUBLIC_SPRINGS } from '../assets/springs-seed.js';

const PRIVATE_FIELDS = {
  'SPR-001': {
    permit_quota_lps: 204 // PRIVAT: tidak ikut dikirim ke publik
  }
};

export { METRICS };

export const SPRINGS = PUBLIC_SPRINGS.map((spring) => ({
  ...spring,
  ...(PRIVATE_FIELDS[spring.id] || {})
}));
