// Layer 2 · Directory: the Airtable tables every directory has. Column names are French (decision D6):
// they are what editors read. The site reads them by field ID once the base is linked, so a rename is harmless.
// A site passes its settings (facts, vocabularies, table names); nothing here is specific to one directory.
import type { FactDefinition } from '@orbit/core/content';
import { f, fText, fSelect, fMulti, fLink, fLines, fLabelled, fHelper, optionsOf, setPath, type Field, type Table, type Option, type Cell } from '@orbit/core/airtable';

/** Table names a site may rename to its own words ("Lieux" / "Annonces", "Sorties" / "Prestations"). */
export interface TableNames {
  listing: string; offer: string; locality: string;
  /** Singular forms, for link columns ("Lieu", "Sortie"). */
  listing_one: string; offer_one: string; operator_one: string; article_one: string;
  type: string; criterion: string; operator: string; guide: string; review: string;
  article: string; section: string; faq: string; image: string; source: string; copy: string;
}
export const DEFAULT_NAMES: Omit<TableNames, 'listing' | 'offer' | 'locality' | 'listing_one' | 'offer_one'> = {
  operator_one: 'Opérateur', article_one: 'Article',
  type: 'Types', criterion: 'Critères', operator: 'Opérateurs', guide: 'Guides', review: 'Avis',
  article: 'Articles', section: "Sections d'article", faq: 'FAQ', image: 'Photos', source: 'Sources', copy: 'Textes du site',
};

const SEO = (path = 'seo'): Field[] => [
  f('Titre SEO', 'singleLineText', `${path}.title`, { group: 'SEO', help: 'Vide = titre calculé par le site. 60 caractères maximum.' }),
  f('Description SEO', 'multilineText', `${path}.description`, { group: 'SEO', help: 'Vide = description calculée. 155 caractères maximum.' }),
];
const KEY = (help = 'Clé permanente (minuscules et tirets). Sert dans les adresses et les liens : ne plus la changer une fois publiée.') =>
  f('Clé', 'singleLineText', 'key', { edit: 'tech', help });
const STATUS_DRAFT_PUBLISHED: Option[] = [{ key: 'draft', label: 'Brouillon' }, { key: 'published', label: 'Publié' }];
const VALIDATION: Option[] = [{ key: 'draft', label: 'Brouillon' }, { key: 'validated', label: 'Validée' }];

// ---------- facts ----------
/** Columns for site-declared facts. A minutes range is three number columns (min, max, précision). */
export function factFields(defs: readonly FactDefinition[], group = 'Repères'): Field[] {
  return defs.flatMap((d): Field[] => {
    const path = `facts.${d.key}`, o = { group, help: d.help };
    const opts = (d.options ?? []).map((k) => ({ key: k, label: d.labels?.[k] ?? k }));
    const main: Field[] = (() => {
      switch (d.type) {
        case 'number': return [f(`${d.label}${d.unit ? ` (${d.unit})` : ''}`, 'number', path, o)];
        case 'text': return [f(d.label, 'multilineText', path, o)];
        case 'boolean': return [f(d.label, 'checkbox', path, o)];
        case 'choice': return [fSelect(d.label, path, opts, o)];
        case 'choices': return [fMulti(d.label, path, opts, o)];
        case 'minutes_range': return [
          f(`${d.label} — min (min)`, 'number', `${path}.min`, { ...o, help: `${d.help ? d.help + ' ' : ''}En minutes. Une seule durée : remplir min seulement.`,
            after: (r) => { const v = r.facts?.[d.key]; if (!v || v.min == null) r.facts[d.key] = null; else v.max ??= v.min; } }),
          f(`${d.label} — max (min)`, 'number', `${path}.max`, o),
          f(`${d.label} — précision`, 'singleLineText', `${path}.note`, { ...o, help: 'Ce qui ne tient pas dans un nombre (« aller, descente raide »).' }),
        ];
      }
    })();
    if (!d.note) return main;
    return [...main, {
      name: `${d.label} — précision`, type: 'singleLineText', group,
      help: 'Nuance affichée à côté de la valeur (« possible sous conditions »).',
      get: (r) => r.fact_notes?.[d.key] ?? null,
      set: (r, v) => { r.fact_notes ??= {}; if (v) r.fact_notes[d.key] = v; },
    }];
  });
}

// ---------- listings ----------
export interface ListingSettings {
  names: TableNames;
  areas: readonly string[];
  zones: readonly string[];
  locationLabels: { area: string; zone: string; locality: string };
  confidence: Record<string, { label: string }>;
  facts: readonly FactDefinition[];
  /** Fields that can be marked "À confirmer" (path → label). */
  estimable: Option[];
}

/** Generic listing columns, by interface section. Places (and other kinds) add theirs. */
export function listingFields(s: ListingSettings): Field[] {
  const n = s.names;
  return [
    // Contenu
    f('Nom', 'singleLineText', 'name', { group: 'Contenu' }),
    f('Slug', 'singleLineText', 'id', { group: 'Contenu', edit: 'tech', help: "Adresse de la page (/…/slug). Vide = calculé depuis le nom. Ne plus changer une fois publié." }),
    fLink('Type', 'type', n.type, { single: true, group: 'Contenu' }),
    fSelect('Statut', 'status', [{ key: 'draft', label: 'Brouillon' }, { key: 'published', label: 'Publié' }, { key: 'hidden', label: 'Masqué' }, { key: 'rejected', label: 'Rejeté' }],
      { group: 'Contenu', edit: 'orbit', help: 'Seuls les lieux « Publié » sont sur le site. « Rejeté » = écarté après recherche (indiquer la raison) : il reste ici pour ne pas être ajouté à nouveau.' }),
    f('Note de statut', 'multilineText', 'status_note', { group: 'Contenu', edit: 'orbit', help: 'Raison du rejet ou du masquage. Interne, jamais affichée.' }),
    f('Résumé', 'multilineText', 'summary', { group: 'Contenu', help: 'Deux ou trois phrases. Obligatoire pour publier.' }),
    f('Ce qui la rend unique', 'singleLineText', 'signature', { group: 'Contenu', help: 'Une phrase, sous-titre des cartes.' }),
    fSelect('Phrase unique — statut', 'signature_status', VALIDATION, { group: 'Contenu', edit: 'orbit', help: 'Le site ne part pas en ligne tant qu\'une phrase est en brouillon.' }),
    f('Chapeau', 'multilineText', 'lead', { group: 'Contenu' }),
    f('Introduction', 'multilineText', 'intro', { group: 'Contenu' }),
    f('En savoir plus — titre', 'singleLineText', 'more_title', { group: 'Contenu' }),
    f('En savoir plus — texte', 'multilineText', 'more_text', { group: 'Contenu' }),
    fLines('Autres noms', 'alt_names', { group: 'Contenu' }),
    fLabelled('Bon à savoir', 'key_facts', {}, { group: 'Contenu' }),
    {
      ...fLink('Conseil — guide', 'tip.guide_id', n.guide, { single: true, group: 'Contenu' }),
      set: (r, v) => {
        const list = (v as string[] | null) ?? [];
        if (list.length > 1) throw new Error(`« Conseil — guide » : un seul guide attendu, ${list.length} trouvés`);
        setPath(r, 'tip.guide_id', list[0] ?? null);
      },
    },
    {
      name: 'Conseil — texte', type: 'multilineText', group: 'Contenu', help: 'Le conseil du guide, à la première personne.',
      get: (r) => r.tip?.text ?? null,
      set: (r, v) => setPath(r, 'tip.text', v ?? null),
      after: (r) => { if (!r.tip?.text) r.tip = null; },
    },
    // Critères et repères
    fLink('Critères', 'criteria', n.criterion, { group: 'Repères', help: `Cochez les critères oui/non. Un nouveau critère = une ligne dans « ${n.criterion} ».` }),
    ...factFields(s.facts),
    fMulti('À confirmer', 'estimated_fields', s.estimable, { group: 'Repères', help: 'Valeurs estimées : affichées avec « À confirmer ».' }),
    // Lieu
    fSelect(s.locationLabels.area, 'location.area', s.areas.map((a) => ({ key: a, label: a })), { group: 'Lieu' }),
    ...(s.zones.length ? [fSelect(s.locationLabels.zone, 'location.zone', s.zones.map((z) => ({ key: z, label: z })), { group: 'Lieu' })] : []),
    fLink(n.locality, 'location.localities', n.locality, { group: 'Lieu', help: 'Vide = « non confirmée » : le lieu ne figure sur aucune page de commune.' }),
    {
      name: 'Latitude', type: 'number', decimals: 6, group: 'Lieu', help: 'Uniquement depuis une source publiée.',
      get: (r) => r.location?.geo?.lat ?? null, set: (r, v) => setPath(r, 'location.geo', v == null ? null : { lat: v, lng: null }),
    },
    {
      name: 'Longitude', type: 'number', decimals: 6, group: 'Lieu',
      get: (r) => r.location?.geo?.lng ?? null,
      set: (r, v) => { if (r.location.geo) r.location.geo.lng = v; },
      after: (r) => { if (r.location.geo && r.location.geo.lng == null) r.location.geo = null; },
    },
    // Suivi
    fSelect('Niveau de vérification', 'confidence', optionsOf(s.confidence), { group: 'Suivi', edit: 'orbit' }),
    f('Vérifié le', 'date', 'last_reviewed_on', { group: 'Suivi', help: 'Date de la dernière relecture (« Mis à jour le » sur la page).' }),
    // Titres (vides = calculés)
    f('Titre H2 — aperçu', 'singleLineText', 'headings.overview', { group: 'Titres', help: 'Vide = titre calculé.' }),
    f('Titre H2 — accès', 'singleLineText', 'headings.access', { group: 'Titres' }),
    f('Titre H2 — sortie', 'singleLineText', 'headings.offer', { group: 'Titres' }),
    f('Titre H2 — FAQ', 'singleLineText', 'headings.faq', { group: 'Titres' }),
    f('Pourquoi avec un guide', 'multilineText', 'offer_why', { group: 'Titres' }),
    ...SEO(),
  ];
}

/** "Ce qui manque" formula, from the completeness key fields that map to one column. */
export function missingFormula(keys: { label: string; field: string }[]): string {
  return `CONCATENATE(${keys.map((k) => `IF(LEN({${k.field}}&"")=0,"${k.label} · ","")`).join(',')})`;
}

// ---------- reference tables (decision D2) ----------
export function typesTable(n: TableNames): Table {
  return {
    name: n.type, id: 'types', primary: 'Type', key: 'Clé', client: 'read',
    about: 'Un type de fiche (Rivière, Cascade…), avec le texte de sa page dédiée.',
    fields: [
      f('Type', 'singleLineText', 'label'), KEY(), f('Pluriel', 'singleLineText', 'plural'),
      f('Icône', 'singleLineText', 'icon'), f('Ordre', 'number', 'order'),
      fLines('Autres noms', 'aliases', { help: 'Noms que les gens utilisent aussi (« Chutes d\'eau »). Un par ligne.' }),
      f('Introduction de la page', 'multilineText', 'intro', { help: 'Texte en tête de la page de ce type (affichée à partir de 3 fiches publiées).' }),
      ...SEO(),
    ],
  };
}
export function localitiesTable(n: TableNames, areaLabel: string, areas: readonly string[]): Table {
  return {
    name: n.locality, id: 'localities', primary: 'Nom', key: 'Clé', client: 'read',
    about: 'Une commune, avec le texte de sa page dédiée.',
    fields: [
      f('Nom', 'singleLineText', 'name'), KEY(),
      fSelect(areaLabel, 'area', areas.map((a) => ({ key: a, label: a }))),
      f('Introduction de la page', 'multilineText', 'intro', { help: 'Texte en tête de la page de la commune (à partir de 3 fiches publiées).' }),
      ...SEO(),
    ],
  };
}
export function criteriaTable(n: TableNames): Table {
  return {
    name: n.criterion, id: 'criteria', primary: 'Critère', key: 'Clé', client: 'read',
    about: `Un critère oui/non (« Avec cascade », « Rappel »). Ajouter une ligne ici, puis le cocher sur les ${n.listing.toLowerCase()} ou ${n.offer.toLowerCase()} : aucun code.`,
    fields: [
      f('Critère', 'singleLineText', 'label'), KEY(),
      fSelect("S'applique à", 'applies_to', [{ key: 'listing', label: n.listing }, { key: 'offer', label: n.offer }]),
      f('Groupe', 'singleLineText', 'group', { help: 'Groupe dans les filtres (« Activités », « Public »). Facultatif.' }),
      f('Icône', 'singleLineText', 'icon'), f('Ordre', 'number', 'order'),
      f('Filtre', 'checkbox', 'filter', { help: 'Proposé dans les filtres.' }),
      f('Badge', 'checkbox', 'badge', { help: 'Affiché comme étiquette sur les cartes et les pages.' }),
      f('Repère clé', 'checkbox', 'key_fact', { help: 'Affiché « Critère : Oui / Non » dans les repères.' }),
      f('Page dédiée', 'checkbox', 'landing', { help: 'Crée une page à partir de 3 fiches publiées.' }),
      f('Introduction de la page', 'multilineText', 'intro'),
      ...SEO(),
    ],
  };
}

// ---------- partners ----------
export function operatorsTable(n: TableNames): Table {
  return {
    name: n.operator, id: 'operators', primary: 'Nom', key: 'Clé', client: 'own',
    about: 'Une entreprise partenaire (réservation, couleur, note).',
    fields: [
      f('Nom', 'singleLineText', 'name'), f('Clé', 'singleLineText', 'id', { edit: 'tech' }),
      f('Couleur', 'singleLineText', 'brand_color', { edit: 'orbit', help: 'Code couleur #RRGGBB.' }),
      f('Logo (lien)', 'url', 'logo_url'), f('Site web', 'url', 'website_url'), f('Page contact', 'url', 'contact_url'),
      f('Lien de réservation', 'url', 'booking_url', { help: 'Page de réservation. Le site y ajoute le suivi (UTM).' }),
      f('Note', 'number', 'rating', { decimals: 1, edit: 'orbit', help: 'Affichée seulement avec sa source.' }),
      f("Nombre d'avis", 'number', 'rating_count', { edit: 'orbit' }),
      f('Source de la note', 'singleLineText', 'rating_source', { edit: 'orbit', help: 'Ex. « Google », « Tripadvisor ».' }),
      fHelper('Comptes', 'multipleCollaborators', "Les personnes de l'entreprise : leur interface ne montre que leurs fiches."),
    ],
  };
}
export function guidesTable(n: TableNames): Table {
  return {
    name: n.guide, id: 'guides', primary: 'Prénom', key: 'Clé', client: 'own',
    about: 'Un guide : sa page, sa photo, son contact WhatsApp.',
    fields: [
      f('Prénom', 'singleLineText', 'first_name'), f('Clé', 'singleLineText', 'id', { edit: 'tech' }),
      fLink(n.operator_one, 'operator_id', n.operator, { single: true, edit: 'orbit' }),
      f('Nom complet', 'singleLineText', 'full_name', { help: 'Obligatoire pour la mise en ligne (titre de la page guide).' }),
      f('Photo', 'singleLineText', 'photo', { help: 'Lien ou chemin du portrait.' }),
      f('Rôle', 'singleLineText', 'role'), f('Bio', 'multilineText', 'bio'),
      fLabelled('Repères', 'facts', { icon: true }),
      f('WhatsApp', 'singleLineText', 'whatsapp', { help: 'Chiffres seulement, indicatif pays d\'abord (590690…).' }),
      fHelper('Compte Airtable', 'singleCollaborator', 'La personne qui se connecte pour ce guide.'),
    ],
  };
}

// ---------- offers ----------
export function offersTable(n: TableNames, facts: readonly FactDefinition[]): Table {
  return {
    name: n.offer, id: 'offers', primary: 'Nom', key: 'Slug', client: 'own',
    about: `Une sortie guidée, rattachée à un seul lieu et un seul ${n.operator_one.toLowerCase()}.`,
    fields: [
      f('Nom', 'singleLineText', 'name', { group: 'Contenu' }),
      f('Slug', 'singleLineText', 'id', { group: 'Contenu', edit: 'tech' }),
      fSelect('Statut', 'status', STATUS_DRAFT_PUBLISHED, { group: 'Contenu', edit: 'orbit' }),
      fLink(n.listing_one, 'listing_id', n.listing, { single: true, group: 'Contenu', edit: 'orbit' }),
      fLink(n.operator_one, 'operator_id', n.operator, { single: true, group: 'Contenu', edit: 'orbit' }),
      f('Principale', 'checkbox', 'is_main', { group: 'Contenu', edit: 'orbit', help: 'La sortie mise en avant sur la page du lieu (une seule par lieu).' }),
      f('Sous-titre', 'multilineText', 'subtitle', { group: 'Contenu' }),
      f('Durée (min)', 'number', 'duration_min', { group: 'Prix et durée' }),
      f('Prix adulte (€)', 'number', 'price_eur', { group: 'Prix et durée' }),
      f('Prix enfant (€)', 'number', 'price_child_eur', { group: 'Prix et durée' }),
      f('Tarif enfant jusqu\'à (ans)', 'number', 'child_price_under_age', { group: 'Prix et durée', help: 'À remplir avec le prix enfant.' }),
      f('Prix vérifiés le', 'date', 'price_checked_on', { group: 'Prix et durée' }),
      fLink('Critères', 'criteria', n.criterion, { group: 'Repères' }),
      ...factFields(facts),
      fLines('Points forts', 'highlights', { group: 'Programme' }),
      fLines('Inclus', 'included', { group: 'Programme' }),
      fLines('À apporter', 'to_bring', { group: 'Programme' }),
      f('Point de rendez-vous', 'multilineText', 'meeting_note', { group: 'Programme', help: 'Jamais pour un lieu « avec un guide seulement » ou fermé.' }),
      f('Le mot du guide', 'multilineText', 'guide_tip', { group: 'Le guide' }),
      f('Pourquoi je vous emmène ici', 'multilineText', 'guide_story', { group: 'Le guide' }),
      fSelect('Histoire — statut', 'guide_story_status', VALIDATION, { group: 'Le guide', help: 'Le guide passe à « Validée » quand le texte lui convient.' }),
      f('Sur ce site depuis', 'number', 'on_site_since', { group: 'Le guide', help: 'Année.' }),
      fHelper('Comptes', 'multipleLookupValues', `Recherche des comptes de l'${n.operator_one.toLowerCase()} (filtre de l'interface).`),
    ],
  };
}
export function reviewsTable(n: TableNames): Table {
  return {
    name: n.review, id: 'reviews', primary: 'Réf', key: 'Réf', client: 'comment',
    about: 'Un avis client réel, avec sa source. Les brouillons ne sont jamais affichés.',
    fields: [
      f('Réf', 'singleLineText', 'id', { edit: 'orbit' }),
      fLink(n.operator_one, 'operator_id', n.operator, { single: true }),
      fLink(n.offer_one, 'offer_id', n.offer, { single: true }),
      fLink('Guide', 'guide_id', n.guide, { single: true }),
      f('Citation', 'multilineText', 'quote'), f('Auteur', 'singleLineText', 'author'),
      f('Note', 'number', 'rating', { decimals: 1 }), f('Date', 'date', 'date'),
      f('Source', 'singleLineText', 'source', { help: 'Où l\'avis a été publié. Obligatoire.' }),
      fSelect('Statut', 'status', STATUS_DRAFT_PUBLISHED, { edit: 'orbit' }),
    ],
  };
}

// ---------- articles ----------
const EMPTY_SELECTION = () => ({ types: [], localities: [], with: [], without: [], rule: null, include: [], exclude: [] });
/** The seven selection columns for one side (listings or offers). The selection is null when all are empty. */
function selectionFields(prefix: string, path: string, n: TableNames, target: string, rules: Option[]): Field[] {
  const side = (name: string, sub: string, table: string, help?: string): Field => ({
    name: `${prefix} — ${name}`, type: 'multipleRecordLinks', link: table, group: `Sélection · ${prefix}`, help,
    get: (r) => r[path]?.[sub] ?? [],
    set: (r, v) => { r[path] ??= EMPTY_SELECTION(); r[path][sub] = v ?? []; },
  });
  return [
    side('types', 'types', n.type, `Garder seulement ces types. Vide = tous.`),
    side(n.locality.toLowerCase(), 'localities', n.locality, 'Garder seulement ces communes. Vide = toutes.'),
    side('avec', 'with', n.criterion, 'Garder ce qui a TOUS ces critères.'),
    side('sans', 'without', n.criterion, "Retirer ce qui a l'un de ces critères."),
    {
      name: `${prefix} — règle`, type: 'singleSelect', options: rules, group: `Sélection · ${prefix}`,
      help: 'Règle sur une valeur chiffrée, préparée par Orbit (« dès 10 ans »).',
      get: (r) => r[path]?.rule ?? null,
      set: (r, v) => { r[path] ??= EMPTY_SELECTION(); r[path].rule = v ?? null; },
    },
    side('toujours inclure', 'include', target),
    {
      ...side('exclure', 'exclude', target),
      after: (r) => { const s = r[path]; if (s && !Object.values(s).some((x) => (Array.isArray(x) ? x.length : x))) r[path] = null; },
    },
  ];
}
export function articlesTable(n: TableNames, rules: { listing: Option[]; offer: Option[] }): Table {
  return {
    name: n.article, id: 'articles', primary: 'Libellé', key: 'Slug', client: 'read',
    about: 'Une page « intention » (« Canyoning avec enfants ») : textes + une sélection calculée.',
    fields: [
      f('Libellé', 'singleLineText', 'label', { group: 'Contenu' }),
      f('Slug', 'singleLineText', 'id', { group: 'Contenu', edit: 'tech' }),
      fSelect('Statut', 'status', STATUS_DRAFT_PUBLISHED, { group: 'Contenu', edit: 'orbit' }),
      f('Titre (H1)', 'singleLineText', 'h1', { group: 'Contenu' }),
      f('Surtitre', 'singleLineText', 'eyebrow', { group: 'Contenu' }),
      f('Introduction', 'multilineText', 'intro', { group: 'Contenu' }),
      f('Réponse courte', 'multilineText', 'answer', { group: 'Contenu', help: 'La réponse en deux phrases (reprise par Google et les assistants IA).' }),
      fLink('Auteurs', 'author_ids', n.guide, { group: 'Contenu' }),
      fLink('Sortie mise en avant', 'featured_offer_id', n.offer, { single: true, group: 'Contenu' }),
      {
        name: 'Encadré — surtitre', type: 'singleLineText', group: 'Contenu',
        get: (r) => r.editorial?.eyebrow ?? null,
        set: (r, v) => { r.editorial ??= { eyebrow: '', h2: null, sections: [], tips: [] }; r.editorial.eyebrow = v ?? ''; },
      },
      {
        name: 'Encadré — titre (H2)', type: 'singleLineText', group: 'Contenu', help: 'Vide = pas d\'encadré. Ses sections et conseils sont dans « Sections d\'article ».',
        get: (r) => r.editorial?.h2 ?? null,
        set: (r, v) => { r.editorial ??= { eyebrow: '', h2: null, sections: [], tips: [] }; r.editorial.h2 = v ?? null; },
        after: (r) => { if (!r.editorial?.h2) r.editorial = null; },
      },
      f('Angle — titre', 'singleLineText', 'angle_label', { group: 'Contenu' }),
      fText('Pourquoi un guide — intro', 'why_intro', { group: 'Contenu' }),
      fText('Note de sécurité', 'safety_note', { group: 'Contenu' }),
      f('Publié le', 'date', 'published_on', { group: 'Contenu' }),
      f('Mis à jour le', 'date', 'updated_on', { group: 'Contenu' }),
      ...selectionFields(n.listing, 'listing_selection', n, n.listing, rules.listing),
      ...selectionFields(n.offer, 'offer_selection', n, n.offer, rules.offer),
      ...SEO(),
    ],
  };
}

/** Child rows of an article: key points, editorial sections, tips and angle notes, in order. */
export const SECTION_KINDS: Option[] = [
  { key: 'takeaway', label: 'Point clé' }, { key: 'section', label: 'Section' },
  { key: 'tip', label: 'Conseil' }, { key: 'angle', label: "Note d'angle" },
];
export function sectionsTable(n: TableNames): Table {
  return {
    name: n.section, id: 'sections', primary: 'Titre', client: 'read',
    about: "Un bloc d'article : point clé, section, conseil, ou note d'angle sur un lieu ou une sortie.",
    fields: [
      f('Titre', 'singleLineText', 'title', { help: "Vide pour une note d'angle." }),
      fLink(n.article_one, 'article_id', n.article, { single: true }),
      fSelect('Genre', 'kind', SECTION_KINDS), f('Ordre', 'number', 'order'),
      f('Texte', 'multilineText', 'text'),
      fLink(n.listing_one, 'listing_id', n.listing, { single: true, help: "Pour une note d'angle sur un lieu." }),
      fLink(n.offer_one, 'offer_id', n.offer, { single: true, help: "Pour une note d'angle sur une sortie." }),
    ],
  };
}

// ---------- shared child tables ----------
export function faqTable(n: TableNames): Table {
  return {
    name: n.faq, id: 'faq', primary: 'Question', client: 'comment',
    about: 'Une question-réponse, sur un lieu ou un article.',
    fields: [
      f('Question', 'singleLineText', 'question'),
      fLink(n.listing_one, 'listing_id', n.listing, { single: true }),
      fLink(n.article_one, 'article_id', n.article, { single: true }),
      f('Ordre', 'number', 'order'), f('Réponse', 'multilineText', 'answer'),
    ],
  };
}

const IMAGE_ROLES: Option[] = [
  { key: 'hero', label: 'Photo principale' }, { key: 'gallery', label: 'Galerie' }, { key: 'site', label: 'Photo du site' },
  { key: 'guided', label: 'Photo de sortie guidée' }, { key: 'illustration', label: "Photo d'illustration" },
];
const IMAGE_RIGHTS: Option[] = [{ key: 'free', label: 'Libre (licence)' }, { key: 'partner', label: 'Partenaire' }, { key: 'permission_needed', label: 'Autorisation à obtenir' }];
/** One link column per owner kind; none filled = a photo for the whole site. */
function ownerLinks(owners: { kind: string; name: string; table: string }[]): Field[] {
  return owners.map((o, i) => ({
    name: o.name, type: 'multipleRecordLinks' as const, link: o.table, single: true,
    help: i === 0 ? `À quoi appartient cette ligne. Aucun lien = tout le site.` : undefined,
    get: (r: any) => (r.owner_kind === o.kind ? [r.owner_id] : []),
    set: (r: any, v: Cell) => { if ((v as string[] | null)?.length) { r.owner_kind = o.kind; r.owner_id = (v as string[])[0]; } },
  }));
}
export function imagesTable(n: TableNames): Table {
  const site = (r: any) => { r.owner_kind ??= 'site'; r.owner_id ??= 'site'; };
  return {
    name: n.image, id: 'images', primary: 'Réf', key: 'Réf', client: 'own',
    about: 'Une photo, avec son crédit et ses droits. « Autorisation à obtenir » bloque la mise en ligne.',
    fields: [
      f('Réf', 'singleLineText', 'id', { edit: 'orbit' }),
      ...ownerLinks([
        { kind: 'listing', name: n.listing_one, table: n.listing },
        { kind: 'offer', name: n.offer_one, table: n.offer },
        { kind: 'article', name: n.article_one, table: n.article },
      ]),
      { ...fSelect('Rôle', 'role', IMAGE_ROLES), after: site },
      f('Ordre', 'number', 'order'),
      f('Lien de la photo', 'url', 'src', { help: 'Lien de l\'image. Ou déposez le fichier dans « Fichier ».' }),
      { name: 'Fichier', type: 'multipleAttachments', help: 'Alternative au lien : le site télécharge le fichier à chaque mise à jour.',
        set: (r, v) => { if (!r.src && (v as string[] | null)?.length) r.src = (v as string[])[0]; } },
      f('Légende', 'singleLineText', 'caption'),
      f('Crédit', 'singleLineText', 'credit', { help: 'Obligatoire. Ex. « Photo : Yalodé ».' }),
      f('Licence', 'singleLineText', 'licence', { help: 'Ex. « CC BY-SA 4.0 ».' }),
      fSelect('Droits', 'rights', IMAGE_RIGHTS, { edit: 'orbit' }),
      f('Source — nom', 'singleLineText', 'source_name'), f('Source — page', 'url', 'source_url'),
    ],
  };
}
const SOURCE_TYPES: Option[] = [
  { key: 'official', label: 'Officielle' }, { key: 'tourism_office', label: 'Office de tourisme' },
  { key: 'operator', label: 'Opérateur' }, { key: 'media', label: 'Média' }, { key: 'reference', label: 'Référence' },
];
export function sourcesTable(n: TableNames): Table {
  return {
    name: n.source, id: 'sources', primary: 'Réf', key: 'Réf', client: 'read',
    about: 'Une source d\'information. Cochée « Presse », elle s\'affiche dans « Ils en parlent ».',
    fields: [
      f('Réf', 'singleLineText', 'id', { edit: 'orbit' }),
      ...ownerLinks([
        { kind: 'listing', name: n.listing_one, table: n.listing },
        { kind: 'article', name: n.article_one, table: n.article },
      ]),
      { ...f('Nom', 'singleLineText', 'label', { help: 'Le site ou la publication.' }), after: (r: any) => { r.owner_kind ??= 'site'; r.owner_id ??= 'site'; } },
      f('Lien', 'url', 'url'), fSelect('Type', 'type', SOURCE_TYPES),
      f('Utilisée pour', 'singleLineText', 'used_for', { help: '« description », « accès », « statut d\'accès »…' }),
      f('Presse', 'checkbox', 'featured', { help: 'Affichée dans « Ils en parlent » (titre obligatoire).' }),
      f('Titre', 'singleLineText', 'title'), f('Éditeur', 'singleLineText', 'publisher'), f('Note', 'singleLineText', 'note'),
    ],
  };
}
export function copyTable(n: TableNames): Table {
  return {
    name: n.copy, id: 'copy', primary: 'Clé', key: 'Clé', client: 'none',
    about: 'Un texte du site (bouton, titre, bloc de page). Modifier « Texte » ou « Liste », jamais la clé.',
    fields: [
      f('Clé', 'singleLineText', 'key', { edit: 'tech' }),
      f('Page', 'singleLineText', 'page'), f('Section', 'singleLineText', 'section'),
      fSelect('Format', 'format', [{ key: 'text', label: 'Texte' }, { key: 'list', label: 'Liste avec icônes' }], { edit: 'tech' }),
      f('Texte', 'multilineText', 'text'),
      fLabelled('Liste', 'items', { icon: true }),
      fSelect('Statut', 'status', [{ key: 'placeholder', label: 'À écrire' }, { key: 'final', label: 'Final' }], { edit: 'orbit' }),
      f('Mis à jour le', 'date', 'updated_on'),
    ],
  };
}
