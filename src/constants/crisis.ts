/**
 * Crisis resources live in configuration, never inline in UI code.
 * Every entry must be audited by a qualified reviewer for the user's locale
 * before launch. `audit` documents that state honestly.
 */
export interface CrisisResource {
  id: string;
  label: string;
  number: string;
  note: string;
  audit: 'needs-audit-before-launch';
}

export const CRISIS_CONFIG: Record<string, { locale: string; resources: CrisisResource[] }> = {
  IN: {
    locale: 'India',
    resources: [
      { id: 'in-emergency', label: 'National emergency number', number: '112', note: 'Police, fire, ambulance. Use this if anyone is in immediate danger.', audit: 'needs-audit-before-launch' },
      { id: 'in-telemanas', label: 'Tele-MANAS (mental health support)', number: '14416', note: 'Free government tele-mental-health service.', audit: 'needs-audit-before-launch' },
      { id: 'in-women', label: 'Women helpline', number: '181', note: 'Support for women facing violence or abuse.', audit: 'needs-audit-before-launch' },
      { id: 'in-child', label: 'Childline', number: '1098', note: 'Support for children in distress.', audit: 'needs-audit-before-launch' },
    ],
  },
};

export const DEFAULT_LOCALE = 'IN';
export const crisisFor = (locale: string = DEFAULT_LOCALE) => CRISIS_CONFIG[locale] ?? CRISIS_CONFIG[DEFAULT_LOCALE];
