import type { LedgerEntry, ReceiptStatus } from '@/types';

export interface ExtractedBill {
  vendor: string;
  date: string;
  total: number;
  lines: { item: string; amount: number }[];
  confidence: number;
  engine: string;
}

export interface BillFinding {
  status: ReceiptStatus;
  label: string;
  detail: string;
  matchedEntryId?: string;
}

/** Demo OCR: deterministic output for two sample bills. A real build calls Tesseract or a cloud OCR provider. */
export const SAMPLE_BILLS: Record<string, ExtractedBill> = {
  A: {
    vendor: 'Gupta Stationers', date: '2026-09-22', total: 4150, confidence: 0.91, engine: 'demo-ocr (simulated)',
    lines: [{ item: 'Notebooks x100', amount: 2500 }, { item: 'Pencils x200', amount: 650 }, { item: 'Chalk boxes x20', amount: 1000 }],
  },
  B: {
    vendor: 'Pune AV Hire', date: '2026-09-27', total: 3800, confidence: 0.78, engine: 'demo-ocr (simulated)',
    lines: [{ item: 'Projector rental (1 day)', amount: 3000 }, { item: 'Screen and cables', amount: 800 }],
  },
};

const daysBetween = (a: string, b: string) => Math.abs((Date.parse(a) - Date.parse(b)) / 86400000);

const CATEGORY_HINTS: Record<string, RegExp> = {
  'Notebooks and stationery': /(notebook|pencil|chalk|stationer|pen)/i,
  Lighting: /(lamp|led|cable|electric)/i,
  'Hall contribution': /(hall|projector|rental|hire|screen)/i,
};

export function analyzeBill(bill: ExtractedBill, entries: LedgerEntry[], campaignBudgetLabels: string[]): BillFinding[] {
  const findings: BillFinding[] = [];
  const out = entries.filter((e) => e.kind === 'out');

  const dup = out.filter((e) => e.vendor === bill.vendor && e.amount === bill.total && daysBetween(e.date, bill.date) <= 3).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (dup) {
    findings.push({
      status: 'duplicate', label: 'Possible duplicate',
      detail: `Same vendor and amount as ledger entry ${dup.id} (${dup.date}). This may be a genuine repeat purchase, so a person will check.`, matchedEntryId: dup.id,
    });
  }

  const sameVendor = out.find((e) => e.vendor === bill.vendor && e.amount !== bill.total && daysBetween(e.date, bill.date) <= 7);
  if (sameVendor) {
    findings.push({
      status: 'mismatch', label: 'Amount mismatch',
      detail: `Bill total is Rs ${bill.total.toLocaleString('en-IN')}, ledger entry ${sameVendor.id} says Rs ${sameVendor.amount.toLocaleString('en-IN')}. There may be an extra line item such as ${bill.lines[bill.lines.length - 1].item}.`,
      matchedEntryId: sameVendor.id,
    });
  }

  const text = bill.lines.map((l) => l.item).join(' ');
  const hit = Object.entries(CATEGORY_HINTS).find(([, re]) => re.test(text));
  if (hit && !campaignBudgetLabels.includes(hit[0])) {
    findings.push({ status: 'pending', label: 'Category unclear', detail: `Items look like "${hit[0]}", which is not a stated budget line.` });
  }

  if (bill.confidence < 0.85) {
    findings.push({ status: 'pending', label: 'Low OCR confidence', detail: 'Some text was hard to read. A person will confirm the numbers.' });
  }

  if (!findings.length) findings.push({ status: 'verified', label: 'No concerns found', detail: 'Still queued for routine human review.' });
  return findings;
}

export const receiptLabel: Record<ReceiptStatus, string> = {
  verified: 'Verified', pending: 'Pending human review', missing: 'Information missing',
  duplicate: 'Possible duplicate', mismatch: 'Amount mismatch', corrected: 'Corrected transparently',
};
