import { useColorScheme, Platform } from 'react-native';
import { useStore } from './store';

// Her tema: aydınlık + karanlık renkler ve şekil (köşe, kenarlık, gölge, yumuşak geçiş)
export const THEMES = {
  sade: {
    name: 'Sade', desc: 'Liste satırları, switch\'ler, serin gri zemin',
    light: { bg: '#eef1f5', card: '#ffffff', card2: '#f2f4f7', ink: '#18202b', mute: '#5d6775', line: '#e2e6eb', acc: '#3b55e6', accI: '#ffffff', red: '#d23b3b', yel: '#e0a000', yelT: '#8a6200', grn: '#1f9254', off: '#cbd2da' },
    dark: { bg: '#0f1216', card: '#171b21', card2: '#1f242b', ink: '#e8ebef', mute: '#98a1ac', line: '#272d35', acc: '#8b9dff', accI: '#0c0f1c', red: '#ff6b6b', yel: '#ffcf4d', yelT: '#ffcf4d', grn: '#5cd07c', off: '#3a414b' },
    shape: { r: 16, rm: 14, rs: 12, rb: 12, bw: 1, shadow: false, soft: false },
  },
  klasik: {
    name: 'Klasik', desc: 'Net çizgili kartlar, kâğıt zemin',
    light: { bg: '#f4f3ef', card: '#ffffff', card2: '#efeee9', ink: '#15171a', mute: '#5f656d', line: '#dfddd6', acc: '#2950e0', accI: '#ffffff', red: '#d6343c', yel: '#e0a200', yelT: '#8a6200', grn: '#24914a' },
    dark: { bg: '#0e1013', card: '#181b1f', card2: '#22262b', ink: '#ecebe6', mute: '#9ba1a9', line: '#2b3036', acc: '#86a2ff', accI: '#0b0d10', red: '#ff6b6b', yel: '#ffcf4d', yelT: '#ffcf4d', grn: '#5cd07c' },
    shape: { r: 18, rm: 14, rs: 12, rb: 12, bw: 1, shadow: false, soft: false },
  },
  yumusak: {
    name: 'Yumuşak', desc: 'Yuvarlak hatlar, pastel renkler, yumuşak geçişler',
    light: { bg: '#f6f2fb', card: '#ffffff', card2: '#f1ebf9', ink: '#2a2140', mute: '#776c8c', line: '#ece5f6', acc: '#7c5cff', accI: '#ffffff', red: '#f0566f', yel: '#f5a524', yelT: '#9a5d06', grn: '#2fb37a' },
    dark: { bg: '#16121e', card: '#211b2c', card2: '#2b2438', ink: '#f2edfb', mute: '#a89dbd', line: '#2e2740', acc: '#a48fff', accI: '#16121e', red: '#ff8a9c', yel: '#ffc46b', yelT: '#ffc46b', grn: '#5fdca3' },
    shape: { r: 30, rm: 24, rs: 20, rb: 999, bw: 0, shadow: true, soft: true },
  },
  okyanus: {
    name: 'Okyanus', desc: 'Turkuaz tonlar, orta yuvarlak',
    light: { bg: '#eef6f7', card: '#ffffff', card2: '#e4f0f2', ink: '#0f2a30', mute: '#557178', line: '#d5e6e9', acc: '#0e8a9a', accI: '#ffffff', red: '#d9463e', yel: '#de9b10', yelT: '#7d5508', grn: '#2b9a58' },
    dark: { bg: '#0a1719', card: '#112326', card2: '#172e32', ink: '#e3f1f3', mute: '#8fb0b5', line: '#1d3a3f', acc: '#4fd1df', accI: '#0a1719', red: '#ff7a70', yel: '#f6c453', yelT: '#f6c453', grn: '#62d48f' },
    shape: { r: 22, rm: 18, rs: 14, rb: 16, bw: 1, shadow: false, soft: true },
  },
  orman: {
    name: 'Orman', desc: 'Yaprak yeşili, toprak tonları, gölgeli kartlar',
    light: { bg: '#f0f3ec', card: '#ffffff', card2: '#e8eee2', ink: '#1c2a1e', mute: '#5e6d5f', line: '#dbe3d4', acc: '#2f7d4a', accI: '#ffffff', red: '#c8433a', yel: '#d89a14', yelT: '#7a5608', grn: '#2f7d4a' },
    dark: { bg: '#0d140f', card: '#151f17', card2: '#1c2a1f', ink: '#e6efe6', mute: '#93a596', line: '#24342a', acc: '#6fcf8e', accI: '#0d140f', red: '#ff7d72', yel: '#f2c35a', yelT: '#f2c35a', grn: '#6fcf8e' },
    shape: { r: 20, rm: 16, rs: 12, rb: 14, bw: 0, shadow: true, soft: false },
  },
  gece: {
    name: 'Gece mavisi', desc: 'Derin lacivert, yüksek kontrast, keskin köşeler',
    light: { bg: '#e9edf6', card: '#ffffff', card2: '#e3e8f3', ink: '#101828', mute: '#56627a', line: '#d3dbea', acc: '#1d3fb8', accI: '#ffffff', red: '#c93636', yel: '#d99600', yelT: '#7d5500', grn: '#1e8a4c' },
    dark: { bg: '#070b16', card: '#0e1424', card2: '#141c31', ink: '#e7ecf8', mute: '#8f9bb6', line: '#1d2741', acc: '#7aa2ff', accI: '#070b16', red: '#ff7070', yel: '#ffd166', yelT: '#ffd166', grn: '#57d68d' },
    shape: { r: 10, rm: 8, rs: 8, rb: 8, bw: 1, shadow: false, soft: false },
  },
};
export const THEME_IDS = Object.keys(THEMES);

// Her temanın içinde seçilebilen vurgu rengi (renk paleti). 'tema' = temanın kendi rengi
export const PALETTES = {
  tema: { name: 'Temanın rengi' },
  kobalt: { name: 'Kobalt', light: '#2f55e4', dark: '#8ca2ff' },
  mor: { name: 'Mor', light: '#7a4fe0', dark: '#b59bff' },
  turkuaz: { name: 'Turkuaz', light: '#0d8796', dark: '#4fd1df' },
  yesil: { name: 'Yeşil', light: '#1f8a4c', dark: '#62d48f' },
  turuncu: { name: 'Turuncu', light: '#d1560f', dark: '#ff9a5a' },
  pembe: { name: 'Pembe', light: '#c8326e', dark: '#ff86b2' },
  kirmizi: { name: 'Bordo', light: '#b02a37', dark: '#ff8088' },
  grafit: { name: 'Grafit', light: '#3b4250', dark: '#c3cad6' },
};
export const PALETTE_IDS = Object.keys(PALETTES);

export function buildTheme(id, dark, pal) {
  const th = THEMES[id] || THEMES.sade;
  const base = { ...(dark ? th.dark : th.light) };
  if (!base.off) base.off = dark ? '#3a414b' : '#cbd2da';
  const P = PALETTES[pal];
  if (P && P.light) {
    base.acc = dark ? P.dark : P.light;
    base.accI = dark ? base.bg : '#ffffff';
  }
  return { ...base, ...th.shape, dark, id: THEMES[id] ? id : 'sade', pal: P && P.light ? pal : 'tema' };
}

export function useTheme() {
  const { st } = useStore();
  const sys = useColorScheme();
  const P = st.prefs || {};
  const dark = P.mode === 'dark' || (P.mode !== 'light' && sys === 'dark');
  return buildTheme(P.theme, dark, P.palette);
}

// Gölge (Yumuşak ve Orman temaları)
export function shadow(t) {
  if (!t.shadow) return null;
  return Platform.select({
    web: { boxShadow: t.dark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(40,40,80,0.10)' },
    default: { shadowColor: '#000', shadowOpacity: t.dark ? 0.35 : 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  });
}

// '#rrggbb' rengini saydamlıkla döndürür
export function alpha(hex, a) {
  const h = String(hex).replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
export const priColor = (c, p) => (p === 1 ? c.red : p === 2 ? c.yel : c.grn);
export const priText = (c, p) => (p === 1 ? c.red : p === 2 ? c.yelT : c.grn);
export const lvlColor = (c, l) => (l === 'g' ? c.grn : l === 'y' ? c.yel : l === 'r' ? c.red : c.mute);
export const lvlText = (c, l) => (l === 'y' ? c.yelT : lvlColor(c, l));
// Pil rengi: yüzdeye göre kırmızı → sarı → yeşil
export const battColor = (c, pct) => (pct >= 100 ? c.grn : pct >= 50 ? c.grn : pct >= 20 ? c.yel : c.red);
