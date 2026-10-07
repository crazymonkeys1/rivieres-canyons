// Layer 3 · Places: the listing table of a directory of places (generic listing columns + access and safety).
import { f, fSelect, fMulti, fLines, fLabelled, fHelper, setPath, type Field, type Option, type Table } from '@orbit/core/airtable';
import { listingFields, missingFormula, type ListingSettings } from '@orbit/directory/airtable';

export const POLICY_OPTIONS: Option[] = [
  { key: 'public', label: 'Public : itinéraire publié' },
  { key: 'commune_only', label: 'Commune seulement' },
  { key: 'guide_only', label: 'Avec un guide seulement' },
  { key: 'closed', label: 'Fermé' },
];

export interface PlaceSettings extends ListingSettings {
  risks: Record<string, { label: string }>;
  accessStatus: Record<'open' | 'partial' | 'closed', string>;
  /** Completeness key fields (content paths) shown in the "Ce qui manque" helper. */
  completeness: string[];
}

function placeFields(s: PlaceSettings): Field[] {
  const access = (name: string, sub: string, type: Field['type'], o: Partial<Field> = {}): Field => ({
    name, type, group: 'Accès', ...o,
    get: (r) => r.access_status?.[sub] ?? null,
    set: (r, v) => setPath(r, `access_status.${sub}`, v ?? null),
  });
  const alert = (name: string, sub: string, o: Partial<Field> = {}): Field => ({
    name, type: 'multilineText', group: 'Sécurité', ...o,
    get: (r) => r.safety_alert?.[sub] ?? null,
    set: (r, v) => setPath(r, `safety_alert.${sub}`, v ?? null),
  });
  return [
    fSelect('Politique de localisation', 'location_policy', POLICY_OPTIONS, { group: 'Accès', edit: 'orbit',
      help: 'Ce que le site publie pour y aller. « Avec un guide seulement » et « Fermé » : aucun itinéraire, parking ni GPS (le site refuse la mise à jour sinon).' }),
    f('Accès restreint', 'checkbox', 'access_restricted', { group: 'Accès', edit: 'orbit', help: 'Arrêté, terrain privé… Jamais présenté comme « accès libre ».' }),
    { ...fSelect("Statut d'accès", 'access_status.status', Object.entries(s.accessStatus).map(([key, label]) => ({ key, label })), { group: 'Accès', edit: 'orbit' }),
      get: (r) => r.access_status?.status ?? null,
      after: (r) => { if (!r.access_status?.status) r.access_status = null; } },
    access("Statut d'accès — note", 'note', 'multilineText'),
    access("Statut d'accès — source", 'source_name', 'singleLineText'),
    access("Statut d'accès — lien", 'source_url', 'url'),
    access("Statut d'accès — vérifié le", 'checked_on', 'date'),
    f('Itinéraire', 'multilineText', 'itinerary', { group: 'Accès', help: 'Lieux publics seulement.' }),
    f('Itinéraire — texte', 'multilineText', 'itinerary_text', { group: 'Accès' }),
    fLabelled("Repères d'accès", 'access_tiles', { icon: true, detail: 'tip' }, { group: 'Accès', help: 'Lieux publics seulement.' }),
    f('Parking', 'multilineText', 'parking', { group: 'Accès' }),
    f('Temps de route', 'singleLineText', 'drive', { group: 'Accès' }),
    f('Accès guidé — texte', 'multilineText', 'guided_access_text', { group: 'Accès' }),
    fMulti('Dangers', 'risks', Object.entries(s.risks).map(([key, v]) => ({ key, label: v.label })), { group: 'Sécurité' }),
    alert('Alerte — titre', 'title', { help: 'Vide = pas d\'alerte.', after: (r) => { if (!r.safety_alert?.title) r.safety_alert = null; } }),
    alert('Alerte — libellé court', 'short_label'),
    alert('Alerte — texte', 'text'),
    { ...fLines('Alerte — points', 'safety_alert.items', { group: 'Sécurité' }), get: (r) => (r.safety_alert?.items ?? []).join('\n') || null },
    fLines('À apporter', 'to_bring', { group: 'Sécurité' }),
  ];
}

/** The listing table of a places directory, with its "Ce qui manque" helper. */
export function placesTable(s: PlaceSettings): Table {
  const fields = [...listingFields(s), ...placeFields(s)];
  const holds = (fd: Field, path: string) => { try { return fd.get!(probe(path)) === PROBE; } catch { return false; } };
  const columnOf = (path: string) => fields.find((fd) => fd.get && holds(fd, path))?.name ?? fields.find((fd) => fd.get && holds(fd, `${path}.min`))?.name;
  const missing = s.completeness.map((p) => ({
    label: p === 'hero' ? 'Photo' : p === 'faq' ? 'FAQ' : (columnOf(p) ?? p).replace(/ — min \(min\)$| \([^)]*\)$/, ''),
    field: p === 'hero' ? s.names.image : p === 'faq' ? s.names.faq : columnOf(p) ?? p,
  }));
  return {
    name: s.names.listing, id: 'listings', primary: 'Nom', key: 'Slug', client: 'comment',
    about: 'Une fiche du répertoire. Nouvelle fiche : nom, type, commune, statut « Brouillon » ; « Ce qui manque » dit quoi compléter.',
    fields: [
      ...fields,
      fHelper('Ce qui manque', 'formula', 'Champs clés encore vides (même liste que le score de complétude du site).',
        { formula: missingFormula(missing), group: 'Suivi' }),
      fHelper(s.names.image, 'multipleRecordLinks', `Créé par Airtable : les photos liées depuis « ${s.names.image} ».`, { group: 'Suivi' }),
      fHelper(s.names.faq, 'multipleRecordLinks', `Créé par Airtable : les questions liées depuis « ${s.names.faq} ».`, { group: 'Suivi' }),
    ],
  };
}

// Finds which column holds a content path: build a record with a marker at that path and see which getter returns it.
const PROBE = '\u0000probe';
function probe(path: string) {
  const r: any = {};
  setPath(r, path, PROBE);
  return r;
}
