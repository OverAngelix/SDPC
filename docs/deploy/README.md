# Déploiement : à quoi sert chaque fichier

Guide générique, sans rien de propre à un projet : les noms, le registre et le domaine sont des repères entre chevrons (`<APP>`, `<REGISTRE>`, `<DOMAINE>`, `<PORT>`) à remplacer. Il sert de modèle pour déployer une autre application client + serveur de la même façon. Le déploiement de ce dépôt est décrit dans [`DEPLOY.md`](../../DEPLOY.md).

## Principe

```
git push main
   └─ GitHub Actions : lint, type-check, tests, puis docker build + docker push
         └─ registre privé (image :latest)
               └─ Keel (sur le VPS) voit :latest changer et relance le pod
                     └─ K3s : Deployment → Service → IngressRoute (Traefik, HTTPS)
```

Deux images indépendantes : le **client** (fichiers statiques servis par nginx) et le **serveur** (API Node). Un seul domaine : Traefik envoie `/api` au serveur et le reste au client.

## Ce qui vit dans le dépôt

| Fichier | Rôle |
| --- | --- |
| `client/docker/Dockerfile` | Construit le client (Node), puis le sert avec nginx (image finale légère). |
| `client/docker/nginx.conf` | Repli sur `index.html` (routes du navigateur), cache des ressources, 502 sur `/api/` (arriver là signifie que la route Traefik manque). |
| `client/.dockerignore` | Garde `node_modules`, `dist`, `.env` hors du contexte de build. |
| `server/Dockerfile` | Compile le serveur (TypeScript), puis image d'exécution avec les seules dépendances de production. |
| `server/.dockerignore` | Idem pour le serveur (et la base locale `data/`). |
| `.github/workflows/deploy-client.yml` | Vérifie, construit et pousse l'image client quand `client/**` change. |
| `.github/workflows/deploy-server.yml` | Idem pour le serveur avec `server/**`. |

Les workflows lisent l'adresse du registre, l'utilisateur et le mot de passe dans des **secrets GitHub** (`REGISTRY_URL`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`) : le dépôt peut être public sans révéler le registre.

## Ce qui vit sur le VPS (hors dépôt)

Un dossier par application, par exemple `/home/deploy/apps-k3s/<APP>-client/` et `<APP>-server/`. Les modèles sont dans `client/` et `server/` à côté de ce fichier.

| Fichier | Rôle |
| --- | --- |
| `deployment.yaml` | Décrit le pod : image à tirer, port, ressources, sondes de santé, volume. Les annotations **Keel** y déclenchent la mise à jour automatique. `imagePullSecrets` donne l'accès au registre privé. |
| `service.yaml` | Adresse interne stable vers le pod (nom + port) que Traefik vise. |
| `ingressroute.yaml` | Règles Traefik : domaine, chemin (`/api` pour le serveur), HTTPS (certificat Let's Encrypt) et version HTTP qui redirige vers HTTPS. |
| [`middleware.yaml`](middleware.yaml) | Redirection HTTP → HTTPS (`https-redirect`). **Commun** à tous les projets d'un namespace : à créer une seule fois. |
| `data/` (serveur) | Dossier monté dans le pod pour la base de données. À sauvegarder : sans lui, tout disparaît à chaque mise à jour. |

## Mettre en place une nouvelle application

1. Copier les modèles du dépôt (`Dockerfile`, `nginx.conf`, `.dockerignore`, workflows) et adapter les commandes (`npm run …`) et les ports.
2. Créer les trois secrets GitHub du registre.
3. Sur le VPS, copier les modèles de `client/` et `server/`, remplacer les repères entre chevrons, puis `kubectl apply -f .` dans chaque dossier.
4. Pousser sur `main` : les workflows construisent les images, Keel relance les pods en environ une minute.
5. Contrôler (voir ci-dessous).

## Points d'attention

- **Noms uniques par namespace** : copier les manifests d'un autre projet sans renommer écrase ce projet. Faire `grep -rn <ancien-nom> .` avant `kubectl apply`.
- **Même nom, même `app:`** : le `selector` du Service et le label du Deployment doivent être identiques, sinon le Service n'atteint aucun pod.
- **Ports** : `containerPort` (Deployment), `targetPort` et `port` (Service), `port` (IngressRoute) doivent correspondre.
- **Pas de `stripPrefix`** sur `/api` si le serveur attend `/api` dans l'URL.
- **Une seule réplique** pour un serveur à base SQLite (`strategy: Recreate`).
- **DNS** : le domaine doit pointer vers le VPS avant la première demande de certificat.
- Ne pas faire `kubectl delete -f .` dans un dossier contenant `middleware.yaml` : il est partagé.

## Contrôler un déploiement

```bash
# Pods : STATUS Running, READY 1/1
kubectl -n dev get pods

# Détail et événements (erreur d'image, de sonde, de volume…)
kubectl -n dev describe pod <nom-du-pod>

# Journaux
kubectl -n dev logs deployment/<APP>-server
kubectl -n dev logs deployment/<APP>-client

# Service : ENDPOINTS non vide
kubectl -n dev get svc,endpoints <APP>-server <APP>-client

# Routes Traefik
kubectl -n dev get ingressroute

# Depuis l'extérieur
curl -i https://<DOMAINE>/api/health   # 200 {"status":"ok"}
curl -I https://<DOMAINE>/             # 200 (le client)
curl -I http://<DOMAINE>/              # 301/308 vers https
```

Lecture des états : `ErrImagePull` / `ImagePullBackOff` (image absente ou accès au registre refusé : `describe pod` dit lequel), `CrashLoopBackOff` (le conteneur plante : `logs`), `Running` mais `0/1` (la sonde échoue), `ENDPOINTS <none>` (le `selector` du Service ne correspond pas au label du pod).
