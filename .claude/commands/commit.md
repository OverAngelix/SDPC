---
description: "Crée les commits git au format du projet GITMOJI [NN] message"
argument-hint: "[consigne facultative]"
---

# Commit

Rédige et crée les commits du projet selon la nomenclature ci-dessous. Consigne éventuelle de l'utilisateur : $ARGUMENTS

## Format

```
<gitmoji> [<NN>] <description courte>

- <fichier ou zone> : <ce qui a changé>
- <fichier ou zone> : <ce qui a changé>
```

- `<gitmoji>` : un seul emoji Unicode du catalogue [gitmoji.dev](https://gitmoji.dev), en tête du titre, suivi d'un espace. Il indique la nature du changement (voir le tableau).
- `[<NN>]` : numéro de la feature sur deux chiffres, celui de sa fiche `docs/feature/NN-*.md` (`[01]`, `[02]`…). `[00]` quand le commit ne se rattache à aucune feature (squelette, outillage, configuration racine, `CLAUDE.md`, `.claude/`, `.gitignore`). Un commit qui touche plusieurs features est à scinder.
- Titre : 72 caractères au plus, emoji et numéro compris, au présent ou à l'infinitif, en français, sans point final. Il doit se lire tel quel dans `git log --oneline`.
- Corps : séparé du titre par une ligne vide, une ligne `- <fichier ou zone> : <changement>` par élément modifié.
- Aucune signature ni ligne `Co-Authored-By`.

### Gitmojis usuels

| Emoji | Usage |
| --- | --- |
| ✨ | Nouvelle fonctionnalité |
| 🐛 | Correction de bug |
| ♻️ | Refactorisation |
| 📝 | Documentation |
| 🔧 | Configuration, outillage, maintenance |
| ✅ | Tests |
| ⬆️ | Mise à jour de dépendances |
| ➕ | Ajout d'une dépendance |
| 💄 | Interface et style |
| 🔥 | Suppression de code ou de fichiers |
| 🚚 | Déplacement ou renommage |
| 📄 | Licence |
| 🎉 | Début du projet |

Pour un cas absent du tableau, prendre l'emoji correspondant sur gitmoji.dev.

Exemple :

```
✨ [01] Indicateur de connexion au serveur via axios

- client/src/api/http.ts : instance axios partagée (baseURL /api, délai de 5 s)
- client/src/stores/server.ts : store Pinia avec l'état de la connexion
- client/src/App.vue : pastille d'état du serveur dans la barre d'application
```

## Procédure

1. Lancer `git status` et `git diff` (y compris `git diff --staged`) pour voir ce qui change.
2. Regrouper les changements par sujet. Des changements sans rapport font des commits séparés.
3. Déterminer le numéro de feature de chaque commit : consigne de l'utilisateur, sinon fiche `docs/feature/` concernée, sinon `00`.
4. Pour chaque commit, indexer uniquement ses fichiers (`git add <fichiers>`, jamais `git add -A` à l'aveugle) et ne pas embarquer de fichier généré ni de secret (`.env`, `node_modules`, `dist`).
5. Créer le commit avec le message au format ci-dessus (`git commit` avec le message en entrée, corps compris).
6. Afficher `git log --oneline` des commits créés. Ne jamais pousser (`git push`) sans demande explicite.
