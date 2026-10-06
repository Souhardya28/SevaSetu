import type { Lang } from '@/types';

type Dict = Record<string, string>;

/** Lightweight dictionary i18n, shaped so it can be swapped for i18next resources. */
const en: Dict = {
  'tab.home': 'Home', 'tab.sathi': 'Sathi', 'tab.abhiyan': 'Abhiyan', 'tab.daan': 'Daan', 'tab.profile': 'Profile',
  'home.greeting': 'Namaste', 'home.request': 'Request support', 'home.offer': 'Offer time',
  'home.join': 'Join an Abhiyan', 'home.share': 'Share an item', 'home.near': 'Near you',
  'home.continue': 'Continue your commitment', 'home.safety': 'Safety resources',
  'home.available': 'Available to help', 'home.tagline': 'A bridge from intention to service.',
  'sathi.sub': 'Person-to-person help', 'abhiyan.sub': 'Transparent collective campaigns',
  'daan.sub': 'Everyday material giving', 'guide.title': 'Seva Guide',
};
const hi: Dict = {
  'tab.home': 'होम', 'tab.sathi': 'साथी', 'tab.abhiyan': 'अभियान', 'tab.daan': 'दान', 'tab.profile': 'प्रोफ़ाइल',
  'home.greeting': 'नमस्ते', 'home.request': 'सहयोग माँगें', 'home.offer': 'समय दें',
  'home.join': 'अभियान से जुड़ें', 'home.share': 'कोई वस्तु साझा करें', 'home.near': 'आपके पास',
  'home.continue': 'अपनी प्रतिबद्धता जारी रखें', 'home.safety': 'सुरक्षा संसाधन',
  'home.available': 'सहयोग के लिए उपलब्ध', 'home.tagline': 'इरादे से सेवा तक एक सेतु।',
  'sathi.sub': 'व्यक्ति से व्यक्ति सहयोग', 'abhiyan.sub': 'पारदर्शी सामूहिक अभियान',
  'daan.sub': 'रोज़मर्रा की वस्तुओं का दान', 'guide.title': 'सेवा गाइड',
};
const dicts: Record<Lang, Dict> = { en, hi };

export function translate(lang: Lang, key: string): string {
  return dicts[lang][key] ?? en[key] ?? key;
}
