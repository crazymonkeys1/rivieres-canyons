// Layer 4 · Site: vocabularies for Rivières & Canyons (Guadeloupe). Keys are stable enum values
// (future Airtable single-select options); labels and icons are what the site shows.

export const PLACE_TYPES = {
  canyon: { label: 'Canyon', plural: 'Canyons', icon: '⛰️', aliases: [] },
  riviere: { label: 'Rivière', plural: 'Rivières', icon: '🌊', aliases: [] },
  cascade: { label: 'Cascade', plural: 'Cascades', icon: '💦', aliases: ["Chutes d'eau"] },
  bassin_naturel: { label: 'Bassin naturel', plural: 'Bassins naturels', icon: '🛁', aliases: [] },
} as const;

export const ISLANDS = ['Basse-Terre'] as const;

export const COMMUNES = [
  'Bouillante', 'Capesterre-Belle-Eau', 'Goyave', 'Lamentin', 'Petit-Bourg',
  'Pointe-Noire', 'Sainte-Rose', 'Vieux-Habitants',
] as const;

export const DIFFICULTIES = {
  tres_facile: 'Très facile', facile: 'Facile', moyen: 'Moyen', sportif: 'Sportif', difficile: 'Difficile', engage: 'Engagé',
} as const;

/** Offer level (guided outings) and spirit. */
export const OFFER_LEVELS = { facile: 'Facile', sportif: 'Sportif', engage: 'Engagé' } as const;
export const SPIRITS = { decouverte: 'Détente & découverte', sensations: 'Sensations fortes' } as const;

export const RISKS = {
  crues_soudaines: { label: 'Crues soudaines', icon: '🌧️' },
  roches_glissantes: { label: 'Roches glissantes', icon: '🪨' },
  terrain_glissant: { label: 'Terrain glissant', icon: '🥾' },
  profondeur_variable: { label: 'Profondeur variable', icon: '📏' },
  courant: { label: 'Courant', icon: '💨' },
  courant_variable: { label: 'Courant variable', icon: '💨' },
  traversees_riviere: { label: 'Traversées de rivière', icon: '🚶' },
  baignade_non_surveillee: { label: 'Baignade non surveillée', icon: '🏊' },
  parking_non_surveille: { label: 'Parking non surveillé', icon: '🅿️' },
  travaux_eventuels: { label: 'Travaux éventuels', icon: '🚧' },
  terrain_montagneux: { label: 'Terrain montagneux', icon: '⚠️' },
  conditions_meteo: { label: 'Conditions météorologiques', icon: '⚠️' },
  boue: { label: 'Boue', icon: '⚠️' },
  racines: { label: 'Racines', icon: '⚠️' },
  parois_raides: { label: 'Parois raides', icon: '⚠️' },
  cordages: { label: 'Cordages', icon: '⚠️' },
} as const;

export const VERIFICATION = {
  eleve: { label: 'Vérifié', note: 'Informations recoupées avec une source publique.' },
  eleve_nom: { label: 'Nom confirmé, détails à vérifier', note: "Le nom du site est confirmé ; l'accès et les conditions restent à vérifier." },
  moyen: { label: 'Partiellement vérifié', note: 'Une partie des informations est recoupée ; vérifiez avant de partir.' },
  faible: { label: 'Peu vérifié', note: 'Peu de sources disponibles ; vérifiez avant de partir.' },
} as const;

export const ACCESS_STATUS_LABELS = { open: 'Accès ouvert', partial: 'Accès partiel', closed: 'Accès interdit' } as const;

export const OFFER_TAG_ICONS: Record<string, string> = {
  Famille: '👨‍👩‍👧', 'Formule Family': '👨‍👩‍👧', 'Toboggans naturels': '🎢', 'Bain de forêt': '🌳', 'Petit groupe': '👥',
  'Forêt primaire': '🌲', 'Hors sentiers': '🥾', Journée: '☀️', 'Journée complète': '☀️', 'Journée entière': '☀️',
  'Demi-journée': '🕐', 'Initiation technique': '🎓', 'Rappel encadré': '🪢', 'Rappels enchaînés': '🪢', 'Rappels hauts': '🪢',
  'Pique-nique': '🧺', 'Sauts engagés': '💦', 'Expérience requise': '⚠️',
};

/** Gear icon chosen by keyword in the label (first match wins). */
export const GEAR_ICONS: [string, string][] = [
  ['Gilet', '🦺'], ['Shorty', '🤿'], ['Combinaison', '🤿'], ['Casque', '⛑️'], ['Culotte de glisse', '🩳'],
  ["Verre de l'amitié", '🥂'], ['bidon', '🎒'], ['Sac de canyon', '🎒'], ['Baudrier', '🧗'], ['corde', '🪢'],
  ['Pique-nique', '🧺'], ['Chaussures', '👟'], ['Maillot de bain', '🩱'], ['lunettes', '🕶️'], ["Bouteille d'eau", '💧'],
  ['Eau', '💧'], ['Repas', '🍱'], ['Serviette', '🏖️'], ['En-cas', '🍫'], ['Vêtements de rechange', '👕'],
];

/** Site settings used by the content checks. */
export const CONTENT_CONFIG = {
  /** Below this completeness score a place gets noindex and is left out of the sitemap (CLAUDE.md §8). */
  indexThreshold: 0.6,
  /** Filter landing pages exist only for types and communes with this many published places. */
  filterPageMinPlaces: 3,
  /** Places whose access may be restricted: never listed as "accès libre" in article selections. */
  restrictedAccessIds: ['saut-d-acomat', 'saut-de-la-lezarde', 'chutes-moreau'],
} as const;
