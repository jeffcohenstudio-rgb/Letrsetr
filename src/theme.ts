export function applyTheme(h: number, l: number, s: number): void {
  const root = document.documentElement;
  root.style.setProperty('--h', String(h));
  root.style.setProperty('--bg', `hsl(${h},${s}%,${l}%)`);
  root.style.setProperty('--accent', `hsl(${h},65%,68%)`);
  root.style.setProperty('--accent-dim', `hsla(${h},55%,65%,0.5)`);
  root.style.setProperty('--accent-faint', `hsla(${h},55%,65%,0.13)`);
  root.style.setProperty('--accent-border', `hsla(${h},55%,65%,0.5)`);
  root.style.setProperty('--fg-dim', `hsla(${h},30%,88%,0.4)`);
  root.style.setProperty('--fg-mid', `hsla(${h},30%,88%,0.7)`);
  root.style.setProperty('--input-bg', `hsl(${h},${s}%,${Math.max(4, l - 10)}%)`);
  root.style.setProperty('--hole-rim-top', `hsl(${h},${Math.min(s + 20, 100)}%,55%)`);
  root.style.setProperty('--hole-rim-mid', `hsl(${h},${s}%,28%)`);
  root.style.setProperty('--hole-rim-low', `hsl(${h},${Math.max(s - 10, 0)}%,8%)`);
  document.body.style.background = `hsl(${h},${s}%,${l}%)`;
  const sizeSlider = document.getElementById('sizeSlider') as HTMLInputElement | null;
  if (sizeSlider) sizeSlider.style.accentColor = `hsl(${h},65%,68%)`;
}

export function getTileFilter(hr: number, br: number, sat: number): string {
  return `hue-rotate(${hr}deg) brightness(${br}) saturate(${sat})`;
}
