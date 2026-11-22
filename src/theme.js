import { useColorScheme } from 'react-native';
import { useStore } from './store';

export const LIGHT = {
  dark: false, bg: '#f4f3ef', card: '#ffffff', card2: '#efeee9', ink: '#15171a', mute: '#5f656d', line: '#dfddd6',
  acc: '#2950e0', accI: '#ffffff', red: '#d6343c', yel: '#e0a200', yelT: '#8a6200', grn: '#24914a',
};
export const DARK = {
  dark: true, bg: '#0e1013', card: '#181b1f', card2: '#22262b', ink: '#ecebe6', mute: '#9ba1a9', line: '#2b3036',
  acc: '#86a2ff', accI: '#0b0d10', red: '#ff6b6b', yel: '#ffcf4d', yelT: '#ffcf4d', grn: '#5cd07c',
};

export function useTheme() {
  const { mode } = useStore();
  const sys = useColorScheme();
  const dark = mode === 'dark' || (mode !== 'light' && sys === 'dark');
  return dark ? DARK : LIGHT;
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
