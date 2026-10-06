export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  muted: string;
  border: string;
  indigo: string;
  indigoSoft: string;
  saffron: string;
  saffronSoft: string;
  green: string;
  greenSoft: string;
  terracotta: string;
  terracottaSoft: string;
  red: string;
  redSoft: string;
  onIndigo: string;
}

export const light: Palette = {
  bg: '#FBF6EC',
  surface: '#FFFFFF',
  surfaceAlt: '#F3ECDD',
  ink: '#1C2033',
  muted: '#545B73',
  border: '#E3D9C4',
  indigo: '#26325F',
  indigoSoft: '#E4E7F4',
  saffron: '#C9611A',
  saffronSoft: '#FBE8D5',
  green: '#25704F',
  greenSoft: '#DDF0E6',
  terracotta: '#A24A31',
  terracottaSoft: '#F6E1DA',
  red: '#B3261E',
  redSoft: '#FBE4E2',
  onIndigo: '#FFFFFF',
};

export const highContrast: Palette = {
  ...light,
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EEEEEE',
  ink: '#000000',
  muted: '#222222',
  border: '#000000',
  indigo: '#101A44',
  saffron: '#8A3F00',
  green: '#0D4F32',
  terracotta: '#7A2A14',
  red: '#8C0000',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };
export const MIN_TOUCH = 48;
