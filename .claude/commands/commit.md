---
description: "Crée les commits git au format du projet [#issue][scope][type]"
argument-hint: "[consigne facultative]"
---

# Commit

Rédige et crée les commits du projet selon la nomenclature ci-dessous. Consigne éventuelle de l'utilisateur : $ARGUMENTS

## Format

```
[#<issue>][<scope>][<type>] <description courte>

- <fichier ou zone> : <ce qui a changé>
- <fichier ou zone> : <ce qui a changé>
```

- `#<issue>` : numéro du ticket ou de la tâche s'il en existe un (`#12`), sinon `#-`.
- `<scope>` : `server`, `client` ou `conf` (outillage, configuration racine, `CLAUDE.md`, `.claude/`, `.gitignore`). Deux scopes au plus, séparés par une virgule (`server,client`) ; au-delà, scinder le commit.
- `<type>` : `F` feature, `B` bugfix, `R` refactor, `D` documentation, `C` chore (maintenance, dépendances, configuration), `T` test.
- Titre : 72 caractères au plus, balises comprises, au présent ou à l'infinitif, en français, sans point final. Il doit se lire tel quel dans `git log --oneline`.
- Corps : séparé du titre par une ligne vide, une ligne `- <fichier ou zone> : <changement>` par élément modifié.
- Aucune signature ni ligne `Co-Authored-By`.

Exemple :

```
[#-][server][F] Migration du serveur vers TypeScript

- server/src/index.js : renommé en index.ts, requête et réponse typées
- server/tsconfig.json : ajouté (NodeNext, strict)
- server/package.json : scripts build, start et type-check, dépendances de typage
```

## Procédure

1. Lancer `git status` et `git diff` (y compris `git diff --staged`) pour voir ce qui change.
2. Regrouper les changements par sujet. Des changements sans rapport font des commits séparés.
3. Pour chaque commit, indexer uniquement ses fichiers (`git add <fichiers>`, jamais `git add -A` à l'aveugle) et ne pas embarquer de fichier généré ni de secret (`.env`, `node_modules`, `dist`).
4. Créer le commit avec le message au format ci-dessus (`git commit` avec le message en entrée, corps compris).
5. Afficher `git log --oneline` des commits créés. Ne jamais pousser (`git push`) sans demande explicite.
