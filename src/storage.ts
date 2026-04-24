import type { LayoutData } from './types';

const P = 'letrsetr_';

export const storage = {
  getTheme(): { h: number; l: number; s: number } | null {
    try {
      const h = localStorage.getItem(`${P}h`);
      const l = localStorage.getItem(`${P}l`);
      const s = localStorage.getItem(`${P}s`);
      if (h !== null && l !== null && s !== null) {
        return { h: parseInt(h), l: parseInt(l), s: parseInt(s) };
      }
    } catch { /* storage unavailable */ }
    return null;
  },

  setTheme(h: number, l: number, s: number): void {
    try {
      localStorage.setItem(`${P}h`, String(h));
      localStorage.setItem(`${P}l`, String(l));
      localStorage.setItem(`${P}s`, String(s));
    } catch { /* storage unavailable */ }
  },

  getTileFilter(): { hr: number; br: number; sat: number } | null {
    try {
      const hr = localStorage.getItem(`${P}thr`);
      const br = localStorage.getItem(`${P}tbr`);
      const sat = localStorage.getItem(`${P}tsat`);
      if (hr !== null && br !== null && sat !== null) {
        return { hr: parseFloat(hr), br: parseFloat(br), sat: parseFloat(sat) };
      }
    } catch { /* storage unavailable */ }
    return null;
  },

  setTileFilter(hr: number, br: number, sat: number): void {
    try {
      localStorage.setItem(`${P}thr`, String(hr));
      localStorage.setItem(`${P}tbr`, String(br));
      localStorage.setItem(`${P}tsat`, String(sat));
    } catch { /* storage unavailable */ }
  },

  getLayout(): LayoutData | null {
    try {
      const raw = localStorage.getItem(`${P}layout`);
      return raw ? (JSON.parse(raw) as LayoutData) : null;
    } catch { /* storage unavailable or malformed */ }
    return null;
  },

  setLayout(data: LayoutData): void {
    try {
      localStorage.setItem(`${P}layout`, JSON.stringify(data));
    } catch { /* storage unavailable */ }
  },
};
