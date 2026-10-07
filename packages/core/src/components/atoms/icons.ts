// SVG line icons for sites whose icon_style is "svg" (decision B2). 24×24 viewBox, 1.75 stroke, round caps,
// drawn with currentColor. One meaning, one icon. Add an icon here (and nowhere else) when a component needs it.
export const ICONS = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4.35-4.35',
  filters: 'M4 6h10m4 0h2M4 12h4m4 0h8M4 18h12m4 0h0M14 4v4M8 10v4M16 16v4',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-right': 'm9 6 6 6-6 6',
  'arrow-right': 'M5 12h14m-6-6 6 6-6 6',
  external: 'M14 4h6v6m0-6-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5m0-8h0',
  alert: 'M12 3 2 20h20L12 3Zm0 6v5m0 3h0',
  check: 'm5 12 5 5 9-10',
  plus: 'M12 5v14M5 12h14',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
  'map-pin': 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Zm0-13a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  message: 'M4 5h16v11H8l-4 4V5Z',
  calendar: 'M4 6h16v14H4V6Zm0 4h16M8 3v4m8-4v4',
} as const;
export type IconName = keyof typeof ICONS;
