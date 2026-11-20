// mobile/src/features/field/exportDossier.ts
// One-click dossier export: native -> PDF file + share sheet; web -> print dialog (Save as PDF).

import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function exportDossierPdf(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    // expo-print on web opens the browser print dialog for the current document, so print the dossier from an isolated window.
    const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    if (!w) throw new Error('Popup blocked');
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'BelikHub Audit Dossier' });
  }
}
