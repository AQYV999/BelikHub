// api/springs.js
// GET /api/springs - metrik agregat + daftar mata air (field publik saja)

import { getAdminDb } from '../lib/firebase-admin.js';
import { METRICS, SPRINGS } from '../lib/springs-seed.js';

// Geser koordinat publik ke grid ~5 km agar lokasi sumber air tidak presisi.
// Set false hanya jika koordinat di sumber data sudah digeser.
const SNAP_PUBLIC_COORDS = true;
const GRID_DEG = 0.045; // ~5 km

const snap = (v) => Number((Math.round(v / GRID_DEG) * GRID_DEG).toFixed(4));

// Hanya field ini yang boleh keluar ke publik.
// Koordinat presisi, izin/kuota, verified_by, dana, dan tiket TIDAK termasuk.
const PUBLIC_FIELDS = [
  'id', 'name', 'village', 'district', 'regency', 'coordinates_public',
  'baseline_discharge_lps', 'historical_discharge_lps',
  'beneficiaries_kk', 'beneficiaries_people', 'supply_target',
  'status', 'uptime_percentage', 'treatment_needed',
  'historical_impact', 'crisis_history'
];

const toPublic = (spring) => {
  const out = Object.fromEntries(PUBLIC_FIELDS.filter((k) => spring[k] !== undefined).map((k) => [k, spring[k]]));
  if (SNAP_PUBLIC_COORDS && out.coordinates_public) {
    out.coordinates_public = {
      ...out.coordinates_public,
      lat: snap(out.coordinates_public.lat),
      lng: snap(out.coordinates_public.lng),
      is_grid_snapped: true,
      grid_radius_km: 5
    };
  }
  return out;
};

export default async function handler(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'GET') return response.status(405).json({ error: 'Method not allowed' });

  let springs = SPRINGS;
  let source = 'seed';

  try {
    const snapshot = await getAdminDb().collection('springs').get();
    if (!snapshot.empty) {
      springs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      source = 'firestore';
    }
  } catch (error) {
    console.warn('springs: Firestore tidak tersedia, memakai data seed.', error.message);
  }

  response.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return response.status(200).json({ metrics: METRICS, source, springs: springs.map(toPublic) });
}
