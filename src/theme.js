import { useColorScheme, Platform } from 'react-native';
import { useStore } from './store';

// Her tema: aydınlık + karanlık renkler ve şekil (köşe, kenarlık, gölge, yumuşak geçiş)
export const THEMES = {
  klasik: {
    name: 'Klasik', desc: 'Net çizgili kartlar, kobalt mavi',
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
    name: 'Okyanus', desc: 'Turkuaz tonlar, orta yuvarlak, sade',
    light: { bg: '#eef6f7', card: '#ffffff', card2: '#e4f0f2', ink: '#0f2a30', mute: '#557178', line: '#d5e6e9', acc: '#0e8a9a', accI: '#ffffff', red: '#d9463e', yel: '#de9b10', yelT: '#7d5508', grn: '#2b9a58' },
    dark: { bg: '#0a1719', card: '#112326', card2: '#172e32', ink: '#e3f1f3', mute: '#8fb0b5', line: '#1d3a3f', acc: '#4fd1df', accI: '#0a1719', red: '#ff7a70', yel: '#f6c453', yelT: '#f6c453', grn: '#62d48f' },
    shape: { r: 22, rm: 18, rs: 14, rb: 16, bw: 1, shadow: false, soft: true },
  },
};
export const THEME_IDS = Object.keys(THEMES);

export function buildTheme(id, dark) {
  const th = THEMES[id] || THEMES.klasik;
  return { ...(dark ? th.dark : th.light), ...th.shape, dark, id: THEMES[id] ? id : 'klasik' };
}

export function useTheme() {
  const { st } = useStore();
  const sys = useColorScheme();
  const P = st.prefs || {};
  const dark = P.mode === 'dark' || (P.mode !== 'light' && sys === 'dark');
  return buildTheme(P.theme, dark);
}

// Yumuşak temadaki gölge
export function shadow(t) {
  if (!t.shadow) return null;
  return Platform.select({
    web: { boxShadow: t.dark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 24px rgba(80,60,140,0.10)' },
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
