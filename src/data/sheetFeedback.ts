import { parse } from 'csv-parse/sync';
import { AUTHENTIC_CUSTOMER_FEEDBACK } from './feedback';
import type { CustomerFeedback } from '../types/feedback';

const defaultSpreadsheetId = '1vjP-fik-LYgiM-qJ5WKU5_dlaqDp8iHu8tZCp-9XEic';
const defaultSheetId = '1131662416';

export async function getSheetFeedback(): Promise<readonly CustomerFeedback[]> {
  const spreadsheetId = process.env.FEEDBACK_SPREADSHEET_ID?.trim() || defaultSpreadsheetId;
  const sheetId = process.env.FEEDBACK_SHEET_ID?.trim() || defaultSheetId;
  const url = new URL(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/export`);
  url.search = new URLSearchParams({ format: 'csv', gid: sheetId }).toString();

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/csv')) {
      throw new Error(`Feedback CSV unavailable (HTTP ${response.status})`);
    }

    const [header, ...rows] = parse(await response.text(), {
      bom: true,
      skip_empty_lines: true,
    });
    const nameColumn = header?.indexOf('Họ và tên Khách hàng') ?? -1;
    const contentColumn = header?.indexOf('Feedback') ?? -1;
    const dateColumn = header?.indexOf('Dấu thời gian') ?? -1;
    if ([nameColumn, contentColumn, dateColumn].includes(-1)) {
      throw new Error('Feedback CSV columns did not match the response sheet');
    }

    return rows.flatMap((row, index) => {
      const authorName = row[nameColumn]?.trim();
      const content = row[contentColumn]?.trim();
      if (!authorName || !content) return [];
      return [{
        id: `sheet-${index + 2}`,
        authorName,
        content,
        date: row[dateColumn]?.trim() ?? '',
      }];
    }).reverse();
  } catch (error) {
    console.warn('Unable to load NFA feedback from Google Sheets:', error instanceof Error ? error.name : 'unknown error');
    return AUTHENTIC_CUSTOMER_FEEDBACK;
  }
}
