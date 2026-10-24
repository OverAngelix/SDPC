# SDPC — Stream Deck pour PC

## Idée du projet

Un Stream Deck logiciel pour PC, dans l'esprit des Stream Deck d'Elgato : une grande interface de boutons en grille (6 colonnes par 4 lignes, 4 par 6 en portrait) servant de raccourcis.

- Un **bouton** a une icône et un libellé configurables.
- Un bouton est soit une **action**, soit un **dossier**.
- **Action** : redirige vers une URL, dans un nouvel onglet. C'est tout. Aucune application locale n'est lancée, aucune commande n'est exécutée : uniquement des redirections vers des URL.
- **Dossier** : un clic remplace la grille par celle du dossier, ce qui donne plusieurs pages, sur plusieurs niveaux de profondeur, comme sur un Stream Deck Elgato. Le retour occupe la première case de la grille du dossier : 24 emplacements utilisables à la racine, 23 dans un dossier. Pas de fil d'Ariane.

## Périmètre de la V1

- Une page web affichant la grille, et un second onglet pour configurer les boutons (créer, modifier, supprimer : type, icône, libellé, URL, contenu des dossiers).
- La configuration est conservée côté serveur.
- Pas de compte utilisateur, pas de plugin, pas d'intégration à un logiciel de streaming.

## Stack

Technologies imposées : Node, Vue 3 et Vuetify.

- `client/` : Vue 3, Vuetify, Vue Router, Pinia, Vite, TypeScript. Port 3000.
- `server/` : Node, Express 5, TypeScript (modules ESM, `tsx` en développement). API sous `/api`, JSON. Port 4000.
- Client et serveur sont indépendants : chacun a son `package.json`, son `package-lock.json`, sans espace de travail partagé.

## Commandes

Serveur (`server/`) : `npm run dev` (rechargement), `npm run build`, `npm start`, `npm run type-check`, `npm test`.
Client (`client/`) : `npm run dev`, `npm run build`, `npm run type-check`, `npm run lint`, `npm test`.
Installation reproductible : `npm ci` dans chaque dossier.

## Conventions

- Textes visibles par l'utilisateur et documentation en français ; identifiants de code (variables, fonctions, fichiers) en anglais.
- Tests serveur : tous dans `server/test/`, jamais à côté du code de `src/`. L'arborescence reflète celle de `src/` (`src/buttons/store.ts` → `test/buttons/store.test.ts`) et les outils partagés vont dans `test/helpers/`. Lancés par `npm test` (`node:test` via `tsx`).
- Tests client : tous dans `client/test/`, jamais à côté du code de `src/`, avec la même règle que le serveur (`src/stores/buttons.ts` → `test/stores/buttons.test.ts`). Lancés par `npm test` (Vitest, qui ne parcourt que `test/`).
- Interfaces et types partagés du client : dans `client/src/interfaces/` (un fichier par sujet, ex. `button.ts`), pas dans les fichiers `api/` ni `stores/`.
- Commits : suivre la nomenclature de la commande `/commit` (`.claude/commands/commit.md`). Un commit par sujet.
