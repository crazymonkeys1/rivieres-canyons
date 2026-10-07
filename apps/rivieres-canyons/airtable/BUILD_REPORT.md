# Airtable build report

Run on 2026-10-07 16:24 UTC by `pnpm airtable:build`. Status: **done with problems**.

Base: **Rivières & Canyons — Contenu** · ID `appQss9sjY59pUxtM` · https://airtable.com/appQss9sjY59pUxtM

- Base created with 15 tables.
- Rows written: Types 4 · Communes 8 · Critères 21 · Opérateurs 2 · Guides 2 · Lieux 22 · Sorties 7 · Avis 3 · Articles 7 · Sections d'article 99 · FAQ 78 · Photos 33 · Sources 33 · Publications 3 · Textes du site 2.
- To add by hand (Airtable's API cannot create them): Lieux · Ce qui manque (formula in SPEC.md); Sorties · Comptes.

## Problems
- Guides · Opérateurs: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblIrUCIu86pFEm6e/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Guides.Opérateurs: Failed schema validation: Opérateurs.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Opérateurs.1.options schema"}}
- Lieux · Type: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblscPUaKh3I1zuuL/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Lieux.Type: Failed schema validation: Type.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Type.1.options schema"}}
- Lieux · Conseil — guide: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblscPUaKh3I1zuuL/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Lieux.Conseil — guide: Failed schema validation: Conseil — guide.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Conseil — guide.1.options schema"}}
- Sorties · Lieu: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tbl5YcgxH965YTGTn/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Sorties.Lieu: Failed schema validation: Lieu.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Lieu.1.options schema"}}
- Sorties · Opérateur: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tbl5YcgxH965YTGTn/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Sorties.Opérateur: Failed schema validation: Opérateur.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Opérateur.1.options schema"}}
- Avis · Opérateur: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblQM7pU1c9xRVHJM/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Avis.Opérateur: Failed schema validation: Opérateur.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Opérateur.1.options schema"}}
- Avis · Sortie: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblQM7pU1c9xRVHJM/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Avis.Sortie: Failed schema validation: Sortie.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Sortie.1.options schema"}}
- Avis · Guide: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblQM7pU1c9xRVHJM/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Avis.Guide: Failed schema validation: Guide.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Guide.1.options schema"}}
- Articles · Sortie mise en avant: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblCy9KFJfDpqYdJ2/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Articles.Sortie mise en avant: Failed schema validation: Sortie mise en avant.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Sortie mise en avant.1.options schema"}}
- Sections d'article · Article: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tbl5UpNG69seqLkOp/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Sections d'article.Article: Failed schema validation: Article.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Article.1.options schema"}}
- Sections d'article · Lieu: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tbl5UpNG69seqLkOp/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Sections d'article.Lieu: Failed schema validation: Lieu.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Lieu.1.options schema"}}
- Sections d'article · Sortie: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tbl5UpNG69seqLkOp/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Sections d'article.Sortie: Failed schema validation: Sortie.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Sortie.1.options schema"}}
- FAQ · Lieu: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblqQrdp0BLVwQv5L/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for FAQ.Lieu: Failed schema validation: Lieu.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Lieu.1.options schema"}}
- FAQ · Article: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblqQrdp0BLVwQv5L/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for FAQ.Article: Failed schema validation: Article.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Article.1.options schema"}}
- Photos · Lieu: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblhqLTew36Gxf7mg/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Photos.Lieu: Failed schema validation: Lieu.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Lieu.1.options schema"}}
- Photos · Sortie: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblhqLTew36Gxf7mg/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Photos.Sortie: Failed schema validation: Sortie.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Sortie.1.options schema"}}
- Photos · Article: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblhqLTew36Gxf7mg/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Photos.Article: Failed schema validation: Article.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Article.1.options schema"}}
- Sources · Lieu: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblp8CtDdTy8TjW8S/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Sources.Lieu: Failed schema validation: Lieu.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Lieu.1.options schema"}}
- Sources · Article: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tblp8CtDdTy8TjW8S/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Sources.Article: Failed schema validation: Article.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Article.1.options schema"}}
- Publications · Lieu: Airtable POST /meta/bases/appQss9sjY59pUxtM/tables/tbl8Ggz2FA7XDuPQc/fields: 422 {"error":{"type":"INVALID_FIELD_TYPE_OPTIONS_FOR_CREATE","message":"Invalid options for Publications.Lieu: Failed schema validation: Lieu.0.options.isReversed is missing, prefersSingleRecordLink is not included in the Lieu.1.options schema"}}
- Guides : champ manquant « Opérateurs »
- Lieux : champ manquant « Type »
- Lieux : champ manquant « Conseil — guide »
- Sorties : champ manquant « Lieu »
- Sorties : champ manquant « Opérateur »
- Avis : champ manquant « Opérateur »
- Avis : champ manquant « Sortie »
- Avis : champ manquant « Guide »
- Articles : champ manquant « Sortie mise en avant »
- Sections d'article : champ manquant « Article »
- Sections d'article : champ manquant « Lieu »
- Sections d'article : champ manquant « Sortie »
- FAQ : champ manquant « Lieu »
- FAQ : champ manquant « Article »
- Photos : champ manquant « Lieu »
- Photos : champ manquant « Sortie »
- Photos : champ manquant « Article »
- Sources : champ manquant « Lieu »
- Sources : champ manquant « Article »
- Publications : champ manquant « Lieu »
- read-back differs at .articles.0.featured_offer_id: "acomat" ≠ null
