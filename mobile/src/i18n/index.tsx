// mobile/src/i18n/index.tsx
// Minimal EN | ID language layer. English is the default (international jury).

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Lang = 'en' | 'id';

const dict = {
  // tabs & header
  'tab.science': { en: 'Science', id: 'Sains' },
  'tab.telemetry': { en: 'Telemetry', id: 'Telemetri' },
  'tab.tickets': { en: 'Tickets', id: 'Tiket' },
  'tab.audit': { en: 'Audit', id: 'Audit' },
  'app.tagline': { en: 'HydroTriage field system', id: 'Sistem lapangan HydroTriage' },
  'common.simulated': { en: 'SIMULATED', id: 'SIMULASI' },
  'common.signInGate': { en: 'Sign in or enter demo mode to open the live console.', id: 'Masuk atau aktifkan mode demo untuk membuka konsol langsung.' },
  'common.signIn': { en: 'Sign in', id: 'Masuk' },
  'common.demo': { en: 'Enter demo mode', id: 'Masuk mode demo' },
  'common.account': { en: 'Account & roles', id: 'Akun & peran' },
  // showcase
  'sc.kicker': { en: 'PUBLIC · NO LOGIN REQUIRED', id: 'PUBLIK · TANPA LOGIN' },
  'sc.title': { en: 'Spring discharge is collapsing. We measure it before it fails.', id: 'Debit mata air menurun. Kami mengukurnya sebelum gagal.' },
  'sc.crisis.h': { en: 'The crisis', id: 'Krisis' },
  'sc.crisis.p': { en: 'Tuk Bismo (Desa Bismo, Kec. Blado, Kab. Batang) supplies raw water to PDAM Batang and about 2,500 households. The Jan 2025 flash flood and landslide buried five collection tanks, and recorded discharge now sits at 260 L/s against a historical 300 L/s. Mata Air Wonomerto is monitored alongside it.', id: 'Tuk Bismo (Desa Bismo, Kec. Blado, Kab. Batang) memasok air baku PDAM Batang dan sekitar 2.500 KK. Banjir bandang dan longsor Jan 2025 menimbun lima bak penampung, dan debit tercatat kini 260 L/s dari 300 L/s historis. Mata Air Wonomerto dipantau bersamaan.' },
  'sc.science.h': { en: 'HydroTriage sensing', id: 'Sensor HydroTriage' },
  'sc.science.p': { en: 'Two level probes across a weir give a head difference Δh. With a calibrated weir equation, Δh converts to discharge Q, so a drop shows up as a trend long before a tank runs dry. Readings are cached on-device and synced over LoRa or by a data-mule CSV.', id: 'Dua probe level di sekat ukur menghasilkan beda tinggi Δh. Dengan persamaan weir terkalibrasi, Δh dikonversi menjadi debit Q, sehingga penurunan terlihat sebagai tren jauh sebelum bak kering. Data disimpan di perangkat dan disinkronkan lewat LoRa atau CSV data-mule.' },
  'sc.stat.q': { en: 'Baseline Q', id: 'Debit dasar Q' },
  'sc.stat.hh': { en: 'Households', id: 'Rumah tangga' },
  'sc.stat.sla': { en: 'Repair SLA', id: 'SLA perbaikan' },
  'sc.photo': { en: 'Prototype photo — to be supplied by the team', id: 'Foto prototipe — diisi oleh tim' },
  'sc.cta': { en: 'Launch Telemetry Console', id: 'Buka Konsol Telemetri' },
  // telemetry
  'tm.title': { en: 'Telemetry & Diagnostics', id: 'Telemetri & Diagnostik' },
  'tm.q': { en: 'DISCHARGE (Q)', id: 'DEBIT (Q)' },
  'tm.dh': { en: 'HEAD DIFF (Δh)', id: 'BEDA TINGGI (Δh)' },
  'tm.ntu': { en: 'TURBIDITY', id: 'KEKERUHAN' },
  'tm.chart': { en: 'Discharge, last 24 h', id: 'Debit, 24 jam terakhir' },
  'tm.link': { en: 'Link status · offline-first', id: 'Status tautan · offline-first' },
  'tm.lora': { en: 'LoRa gateway', id: 'Gateway LoRa' },
  'tm.mule': { en: 'Data-mule CSV', id: 'CSV data-mule' },
  'tm.queue': { en: 'Offline queue', id: 'Antrean offline' },
  'tm.online': { en: 'LINKED', id: 'TERHUBUNG' },
  'tm.last': { en: 'last import', id: 'impor terakhir' },
  'tm.records': { en: 'records', id: 'rekaman' },
  'tm.pressure': { en: 'PRESSURE', id: 'TEKANAN' },
  'tm.uptime': { en: 'UPTIME', id: 'UPTIME' },
  'tm.tag': { en: 'TELEMETRY · SIMULATED', id: 'TELEMETRI · SIMULASI' },
  'tm.baseline': { en: 'Baseline', id: 'Dasar' },
  'wo.open': { en: 'OPEN', id: 'TERBUKA' },
  'wo.done': { en: 'DONE', id: 'SELESAI' },
  'wo.closed': { en: 'CLOSED', id: 'DITUTUP' },
  'wo.none': { en: 'No active field tickets.', id: 'Tidak ada tiket lapangan aktif.' },
  'wo.overdue': { en: 'Overdue', id: 'Lewat' },
  'wo.left': { en: 'Left', id: 'Sisa' },
  'wo.days': { en: 'd', id: 'hari' },
  'wo.hours': { en: 'h', id: 'jam' },
  'au.none': { en: 'No cash movements in this period.', id: 'Belum ada mutasi kas pada periode ini.' },
  'au.cashVerified': { en: 'Verified cash', id: 'Kas terverifikasi' },
  'au.cashPending': { en: 'Pending verification', id: 'Menunggu verifikasi' },
  'au.act.cash': { en: 'Cash receipt verified', id: 'Penerimaan tunai terverifikasi' },
  'au.act.digital': { en: 'Non-cash receipt verified', id: 'Penerimaan non-tunai terverifikasi' },
  'au.act.pending': { en: 'Proof awaiting verification', id: 'Bukti menunggu verifikasi' },
  'au.resident': { en: 'Resident', id: 'Warga' },
  // tickets
  'tk.title': { en: 'Field Tickets · 72 h SLA', id: 'Tiket Lapangan · SLA 72 jam' },
  'tk.open': { en: 'OPEN', id: 'TERBUKA' },
  'tk.verify': { en: 'Capture GPS photo', id: 'Ambil foto GPS' },
  'tk.verified': { en: 'GPS verified', id: 'GPS terverifikasi' },
  'tk.signTech': { en: 'Technician sign-off', id: 'Tanda tangan teknisi' },
  'tk.signPdam': { en: 'PDAM supervisor sign-off', id: 'Tanda tangan supervisor PDAM' },
  'tk.closed': { en: 'CLOSED · DUAL-SIGNED', id: 'TUTUP · DUAL-SIGN' },
  'tk.need': { en: 'Capture a GPS photo before signing.', id: 'Ambil foto GPS sebelum menandatangani.' },
  'tk.gpsFail': { en: 'GPS unavailable. Photo recorded without coordinates.', id: 'GPS tidak tersedia. Foto dicatat tanpa koordinat.' },
  // audit
  'au.title': { en: 'Audit Dossier · PDAM / CSR', id: 'Dossier Audit · PDAM / CSR' },
  'au.ledger': { en: 'Maintenance cash ledger', id: 'Buku kas pemeliharaan' },
  'au.received': { en: 'VERIFIED', id: 'TERVERIFIKASI' },
  'au.pending': { en: 'PENDING', id: 'MENUNGGU' },
  'au.export': { en: 'Export One-Click Audit Dossier (PDF)', id: 'Ekspor Dossier Audit Sekali Klik (PDF)' },
  'au.exported': { en: 'Dossier generated.', id: 'Dossier dibuat.' },
  'au.exportFail': { en: 'Could not generate the dossier.', id: 'Gagal membuat dossier.' }
} as const;

export type I18nKey = keyof typeof dict;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: I18nKey) => string;
}

const I18nContext = createContext<Ctx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => dict[k].en
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('en');
  const t = useCallback((key: I18nKey) => dict[key][lang], [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

/** Test/helper: every key must have both languages. */
export const i18nKeys = Object.keys(dict) as I18nKey[];
export const i18nEntry = (k: I18nKey) => dict[k];
