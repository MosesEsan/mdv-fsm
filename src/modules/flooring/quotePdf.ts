// Makes the quote PDF on the device, saves it on the job (owner only) and opens the share sheet.
// Needs: npx expo install expo-print expo-sharing
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { uploadJobDocument } from '@/core/jobFiles';
import { quoteHtml, type QuoteDoc } from './quoteHtml';

export const QUOTE_FILES = 'quote';

/** Returns the saved job file id. On the web it opens the print dialog (save as PDF from there). */
export async function makeAndShareQuotePdf(tenantId: string, jobId: string, doc: QuoteDoc): Promise<string | null> {
  const html = quoteHtml(doc);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return null;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const fileId = await uploadJobDocument({
    tenantId, jobId, kind: QUOTE_FILES, uri, contentType: 'application/pdf', ownerOnly: true, caption: `Quote ${doc.number}`,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: `Quote ${doc.number}` });
  }
  return fileId;
}
