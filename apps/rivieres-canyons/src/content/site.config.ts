// Layer 4 · Site settings for Rivières & Canyons (Guadeloupe).
// Everything here is what makes this directory different from another one built on the same packages:
// its facts, vocabularies, location labels, landing pages, publication rules and conversion settings.
// Keys are stable; labels are what editors pick in Airtable and what the site shows.
// Edited by the technical owner. Editors add listings, criteria, types' and communes' text in Airtable (docs/AIRTABLE_BASE_DESIGN.md).
import type { FactDefinition } from '@orbit/core/content';
import type { LandingDimension, Rule } from '@orbit/directory/content';

export const SITE = {
  name: 'Rivières & Canyons Gwada',
  utm_source: 'rivieres-canyons',
  /** Icons: each site chooses `svg` (line icons) or `emoji` (decision B2). This site: emoji. */
  icon_style: 'emoji' as 'emoji' | 'svg',
};

/** Location levels and what this site calls them. Types and localities are Airtable tables (decision D2). */
export const LOCATION_LABELS = { area: 'Île', zone: 'Secteur', locality: 'Commune' } as const;
export const AREAS = ['Basse-Terre'] as const;
/** Optional grouping between area and locality (Mangroves: "Grand Cul-de-Sac Marin"). None on this site. */
export const ZONES: readonly string[] = [];

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
  { key: 'difficulty', label: 'Difficulté', type: 'choice', options: keys(DIFFICULTIES), labels: DIFFICULTIES, icon: '📶', filter: true, key_fact: true, completeness: true },
  { key: 'duration', label: 'Durée sur place', type: 'minutes_range', icon: '⏱️', key_fact: true, completeness: true },
  { key: 'approach', label: "Marche d'approche", type: 'minutes_range', icon: '🥾', filter: true, key_fact: true, completeness: true },
  { key: 'min_age', label: 'Âge conseillé', type: 'number', unit: 'ans', icon: '🧒', filter: true, key_fact: true, completeness: true },
  { key: 'swimming', label: 'Baignade', type: 'choice', options: keys(SWIMMING), labels: SWIMMING, icon: '🏊', key_fact: true, note: true },
  { key: 'season', label: 'Quand y aller', type: 'text', icon: '📅', completeness: true },
];
// Yes/no criteria (avec cascade, rappel, animaux acceptés, offer tags…) are rows of the Criteria table (decision D1).

/** Facts of a guided outing on this site. */
export const OFFER_FACTS: FactDefinition[] = [
  { key: 'level', label: 'Niveau', type: 'choice', options: keys(OFFER_LEVELS), labels: OFFER_LEVELS, icon: '📶', filter: true, key_fact: true },
  { key: 'spirit', label: 'Esprit', type: 'choice', options: keys(SPIRITS), labels: SPIRITS, filter: true },
  { key: 'min_age', label: 'Dès', type: 'number', unit: 'ans', icon: '👤', filter: true, key_fact: true },
  { key: 'approach_min', label: 'Approche', type: 'number', unit: 'min', icon: '🥾', filter: true },
];

/**
 * Named selection rules on measured facts, picked by key on an article (decision D3).
 * Criteria, types and communes are picked directly in Airtable; only what needs a comparison lives here.
 */
export const ARTICLE_RULES: Record<string, { label: string; applies_to: 'listing' | 'offer'; rule: Rule }> = {
  des_10_ans: { label: 'Sorties accessibles dès 10 ans ou avant', applies_to: 'offer', rule: { match: 'all', conditions: [{ field: 'facts.min_age', op: 'lte', value: 10 }] } },
  facile_approche_courte: { label: 'Sorties faciles, approche ≤ 25 min', applies_to: 'offer', rule: { match: 'all', conditions: [{ field: 'facts.level', op: 'eq', value: 'facile' }, { field: 'facts.approach_min', op: 'lte', value: 25 }] } },
  niveau_facile: { label: 'Sorties de niveau facile', applies_to: 'offer', rule: { match: 'all', conditions: [{ field: 'facts.level', op: 'eq', value: 'facile' }] } },
  debutant: { label: 'Sorties pour débutants (facile ou initiation technique)', applies_to: 'offer', rule: { match: 'any', conditions: [{ field: 'facts.level', op: 'eq', value: 'facile' }, { field: 'criteria', op: 'includes', value: 'initiation-technique' }] } },
  sensations: { label: 'Sorties sensations (esprit sensations ou niveau engagé)', applies_to: 'offer', rule: { match: 'any', conditions: [{ field: 'facts.spirit', op: 'eq', value: 'sensations' }, { field: 'facts.level', op: 'eq', value: 'engage' }] } },
  demi_journee: { label: 'Sorties de 4 h 30 maximum', applies_to: 'offer', rule: { match: 'all', conditions: [{ field: 'duration_min', op: 'lte', value: 270 }] } },
  baignade_renseignee: { label: 'Lieux où la baignade est renseignée', applies_to: 'listing', rule: { match: 'all', conditions: [{ field: 'facts.swimming', op: 'filled' }] } },
};

/** Generic fields and facts that count for the completeness score. Below the threshold: noindex (CLAUDE.md §8). */
export const COMPLETENESS = {
  threshold: 0.6,
  keys: ['summary', 'intro', 'signature', 'location_policy', 'location.localities', 'faq', 'risks', 'confidence', 'hero',
    ...PLACE_FACTS.filter((f) => f.completeness).map((f) => `facts.${f.key}`)],
};

/** Landing pages: one per value with at least `min` published listings. Criteria marked "landing" are added from the data. */
export const LANDING: { min: number; dimensions: LandingDimension[] } = {
  min: 3,
  dimensions: [
    { key: 'type', label: 'Par type', values: (l) => [l.type] },
    { key: 'locality', label: 'Par commune', values: (l) => l.location.localities },
    { key: 'zone', label: 'Par secteur', values: (l) => (l.location.zone ? [l.location.zone] : []) },
  ],
};

/** Where safety claims ("en sécurité", "en toute sécurité") are allowed (decision 2026-10-07): guided content only. */
export const SAFETY_CLAIMS = {
  pattern: /en (toute )?sécurité/i,
  allowed_in: ['offers', 'guides'] as const,
  /** Site texts that describe a guided outing or an operator (copy keys starting with these). */
  allowed_copy_keys: ['team.operator.'] as const,
};

/** Sentences on guide-only or closed places that mention a meeting place, reviewed and kept by Jordan (2026-10-07). */
export const ALLOWED_MEETING_MENTIONS = ["Le rendez-vous se fait au parking du Saut d'Acomat."];

/** Gear icon chosen by keyword in the label (first match wins). */
export const GEAR_ICONS: [string, string][] = [
  ['Gilet', '🦺'], ['Shorty', '🤿'], ['Combinaison', '🤿'], ['Casque', '⛑️'], ['Culotte de glisse', '🩳'],
  ["Verre de l'amitié", '🥂'], ['bidon', '🎒'], ['Sac de canyon', '🎒'], ['Baudrier', '🧗'], ['corde', '🪢'],
  ['Pique-nique', '🧺'], ['Chaussures', '👟'], ['Maillot de bain', '🩱'], ['lunettes', '🕶️'], ["Bouteille d'eau", '💧'],
  ['Eau', '💧'], ['Repas', '🍱'], ['Serviette', '🏖️'], ['En-cas', '🍫'], ['Vêtements de rechange', '👕'],
];

/** "Bon à savoir" icon chosen by keyword in the label (first match wins; default 🔹). */
export const KEY_FACT_ICONS: [string, string][] = [
  ['Quand', '🗓️'], ['Hauteur', '📏'], ['Dénivelé', '⛰️'], ['Bassin', '💧'], ['Sentier', '🥾'], ['Accessib', '♿'], ['Parking', '🅿️'],
  ['Rappel', '🪢'], ['Pour qui', '👥'], ['Sur place', '🧺'], ['renseigner', 'ℹ️'], ['Aussi appelé', '🏷️'], ['Protection', '🌿'],
];
export const RISK_DEFAULT_ICON = '⚠️';

export const ACCESS_STATUS_LABELS = { open: 'Accès ouvert', partial: 'Accès partiel', closed: 'Accès interdit' } as const;
