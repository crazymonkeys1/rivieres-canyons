# Airtable interfaces: step by step

The two editing screens on top of the base (decisions D1–D6, `docs/AIRTABLE_BASE_DESIGN.md` §4). Airtable's API cannot create interfaces, so they are built by hand, once per site. Same steps for every directory: only the table names change.

- **Orbit · Contenu**: for the Orbit team. Everything, organised by job.
- **Mon espace**: for the clients (guides, operators). Only their own outings, profile and company; places read-only with comments.

Airtable's screens change often: if a button has another name, look for the closest one. The site does not depend on the interfaces; a mistake here never breaks the site.

## A. Interface "Orbit · Contenu"

Create it: open the base → **Interfaces** (top bar) → **Create interface** (or **Start building**) → name it **Orbit · Contenu**. Each page below: **+ Add page** (left column), choose the layout, then the table.

| # | Page | Layout | Table | Settings |
|---|---|---|---|---|
| 1 | **Lieux** | List | Lieux | Columns: Nom, Type, Communes, Statut, Ce qui manque. Group by Statut. Record detail: show the fields by section (Contenu, Repères, Lieu, Accès, Sécurité, Suivi, Titres, SEO), and the linked lists **FAQ**, **Photos**, **Sources**, **Sorties** |
| 2 | **À compléter** | List | Lieux | Filter: Statut is Publié **and** Ce qui manque is not empty. Columns: Nom, Ce qui manque |
| 3 | **Nouveau lieu** | Form | Lieux | Fields: Nom, Type, Communes, Résumé. Statut: hidden, default value **Brouillon** |
| 4 | **Sorties** | List | Sorties | Group by Opérateur. Columns: Nom, Lieu, Statut, Prix adulte (€), Histoire — statut. Record detail: linked **Photos**, **Avis** |
| 5 | **Photos** | List | Photos | Group by Droits. Columns: Réf, Lieu, Sortie, Rôle, Crédit, Droits |
| 6 | **Articles** | List | Articles | Record detail: the "Sélection" fields together; linked **Sections d'article** and **FAQ** |
| 7 | **Critères** | List | Critères | Group by S'applique à. Columns: Critère, Icône, Filtre, Badge, Page dédiée |
| 8 | **Types et communes** | List (two lists on one page, or two pages) | Types, Communes | Columns: name, Introduction de la page |
| 9 | **Textes du site** | List | Textes du site | Columns: Clé, Page, Texte, Statut. Clé read-only |

Then **Publish** (top right).

## B. Invite the clients

1. In **Mon espace** (once built, part C) → **Share** → invite each guide by email as **Editor**, interface only (not the base).
2. Once they have accepted, in the base:
   - **Opérateurs → Comptes**: add each guide to their company (Pascal → Yalodé, Quentin → Wild Canyon).
   - **Guides → Compte Airtable**: the guide's own account.
   The "Comptes" lookup in Sorties then fills itself.

## C. Interface "Mon espace"

Create a second interface **Mon espace**. Every page filters on the person logged in.

| # | Page | Layout | Table | Filter | Editable | Read-only |
|---|---|---|---|---|---|---|
| 1 | **Mes sorties** | List | Sorties | Comptes contains **Current user** | Sous-titre, Durée, prices and "Prix vérifiés le", Critères, the Repères, Points forts, Inclus, À apporter, Point de rendez-vous, Le mot du guide, Pourquoi je vous emmène ici, Histoire — statut, Sur ce site depuis. Linked **Photos** (they may add) | Nom, Slug, Statut, Lieu, Opérateur, Principale |
| 2 | **Mon profil** | Record detail / List | Guides | Compte Airtable is **Current user** | Nom complet, Photo, Rôle, Bio, Repères, WhatsApp | Prénom, Clé, Opérateur |
| 3 | **Mon entreprise** | Record detail / List | Opérateurs | Comptes contains **Current user** | Logo (lien), Site web, Page contact, Lien de réservation | Nom, Clé, Couleur, Note, Nombre d'avis, Source de la note |
| 4 | **Les lieux** | List | Lieux | Statut is Publié | none (comments on) | all |

- Turn **off** "Allow viewers to change filters" on every page.
- If "Current user" is not offered on the lookup **Comptes** (Sorties), add a User field **Comptes (sortie)** directly in Sorties, fill it once per outing, and filter on it instead.
- Then **Publish** and invite (part B).

## D. Check
- Open **Mon espace** with **Preview as** (top bar) → choose Pascal: only Yalodé's outings appear.
- Change a price in Mon espace, then run the GitHub job **Airtable → pull-content**: the change reaches the site's content and the checks pass.
