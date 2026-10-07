// Layer 4 · Site settings for Rivières & Canyons (Guadeloupe).
// Everything here is what makes this directory different from another one built on the same packages:
// its facts, vocabularies, location labels, landing pages, publication rules and conversion settings.
// Keys are stable (future Airtable single-select options); labels and icons are what the site shows.
import type { FactDefinition } from '@orbit/core/content';
import type { LandingDimension } from '@orbit/directory/content';

export const SITE = {
  name: 'Rivières & Canyons Gwada',
  utm_source: 'rivieres-canyons',
  /** Icons: emoji is this site's choice (decision B2: the boilerplate default is SVG line icons). */
  icon_style: 'emoji' as 'emoji' | 'svg',
};

export const LISTING_TYPES = {
  canyon: { label: 'Canyon', plural: 'Canyons', icon: '⛰️', aliases: [] },
  riviere: { label: 'Rivière', plural: 'Rivières', icon: '🌊', aliases: [] },
  cascade: { label: 'Cascade', plural: 'Cascades', icon: '💦', aliases: ["Chutes d'eau"] },
  bassin_naturel: { label: 'Bassin naturel', plural: 'Bassins naturels', icon: '🛁', aliases: [] },
} as const;

/** Location levels and what this site calls them. Localities are read from the data (no fixed list). */
export const LOCATION_LABELS = { area: 'Île', zone: 'Secteur', locality: 'Commune' } as const;
export const AREAS = ['Basse-Terre'] as const;

/** Confidence levels: label and note shown in the sources fold; `hide` keeps a listing off the site. */
export const CONFIDENCE = {
  eleve: { label: 'Vérifié', note: 'Informations recoupées avec une source publique.', hide: false },
  eleve_nom: { label: 'Nom confirmé, détails à vérifier', note: "Le nom du site est confirmé ; l'accès et les conditions restent à vérifier.", hide: false },
  moyen: { label: 'Partiellement vérifié', note: 'Une partie des informations est recoupée ; vérifiez avant de partir.', hide: false },
  faible: { label: 'Peu vérifié', note: 'Peu de sources disponibles ; vérifiez avant de partir.', hide: false },
} as const;

export const DIFFICULTIES = { tres_facile: 'Très facile', facile: 'Facile', moyen: 'Moyen', sportif: 'Sportif', difficile: 'Difficile', engage: 'Engagé' } as const;
export const SWIMMING = { yes: 'Oui', conditional: 'Selon débit', no: 'Non' } as const;
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

const keys = <T extends object>(o: T) => Object.keys(o) as (keyof T & string)[];

/** Facts of a place on this site. Drives the key facts, filters, completeness, JSON-LD and Airtable columns. */
export const PLACE_FACTS: FactDefinition[] = [
  { key: 'difficulty', label: 'Difficulté', type: 'choice', options: keys(DIFFICULTIES), icon: '📶', filter: true, key_fact: true, completeness: true },
  { key: 'duration', label: 'Durée sur place', type: 'minutes_range', icon: '⏱️', key_fact: true, completeness: true },
  { key: 'approach', label: "Marche d'approche", type: 'minutes_range', icon: '🥾', filter: true, key_fact: true, completeness: true },
  { key: 'min_age', label: 'Âge conseillé', type: 'number', unit: 'ans', icon: '🧒', filter: true, key_fact: true, completeness: true },
  { key: 'swimming', label: 'Baignade', type: 'choice', options: keys(SWIMMING), icon: '🏊', key_fact: true },
  { key: 'has_waterfall', label: 'Avec cascade', type: 'boolean', icon: '💦', filter: true },
  { key: 'season', label: 'Quand y aller', type: 'text', icon: '📅', completeness: true },
];

/** Facts of a guided outing on this site. */
export const OFFER_FACTS: FactDefinition[] = [
  { key: 'level', label: 'Niveau', type: 'choice', options: keys(OFFER_LEVELS), icon: '📶', filter: true, key_fact: true },
  { key: 'spirit', label: 'Esprit', type: 'choice', options: keys(SPIRITS), filter: true },
  { key: 'min_age', label: 'Dès', type: 'number', unit: 'ans', icon: '👤', filter: true, key_fact: true },
  { key: 'approach_min', label: 'Approche', type: 'number', unit: 'min', icon: '🥾', filter: true },
  { key: 'has_rappel', label: 'Rappel', type: 'boolean', icon: '🪢', filter: true, key_fact: true },
  { key: 'pets_allowed', label: 'Animaux acceptés', type: 'boolean', filter: true },
];

/** Generic fields and facts that count for the completeness score. Below the threshold: noindex (CLAUDE.md §8). */
export const COMPLETENESS = {
  threshold: 0.6,
  keys: ['summary', 'intro', 'signature', 'location_policy', 'location.localities', 'faq', 'risks', 'confidence', 'hero',
    ...PLACE_FACTS.filter((f) => f.completeness).map((f) => `facts.${f.key}`)],
};

/** Landing pages: one per value with at least `min` published listings. */
export const LANDING: { min: number; dimensions: LandingDimension[] } = {
  min: 3,
  dimensions: [
    { key: 'type', label: 'Par type', values: (l) => [l.type] },
    { key: 'locality', label: 'Par commune', values: (l) => l.location.localities },
    { key: 'zone', label: 'Par secteur', values: (l) => (l.location.zone ? [l.location.zone] : []) },
  ],
};

/** Where safety claims ("en sécurité", "en toute sécurité") are allowed (decision 2026-10-07): guided content only. */
export const SAFETY_CLAIMS = { pattern: /en (toute )?sécurité/i, allowed_in: ['offers', 'guides'] as const };

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

export const ACCESS_STATUS_LABELS = { open: 'Accès ouvert', partial: 'Accès partiel', closed: 'Accès interdit' } as const;
