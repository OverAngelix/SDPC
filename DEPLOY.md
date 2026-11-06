# Déploiement — OVH

## Infrastructure

- **Serveur** : VPS OVH, **K3s** (Kubernetes léger), namespace `dev`
- **Reverse proxy** : Traefik (fourni par K3s), une `IngressRoute` par application, TLS Let's Encrypt (`certResolver: letsencrypt`)
- **Keel** : met à jour les déploiements quand l'image `latest` change dans le registre
- **Registre privé** : adresse dans le secret `REGISTRY_URL` (elle n'est écrite nulle part dans le dépôt), accès du cluster par le secret `registry-pull-secret`
- **Domaine** : à renseigner

## Images Docker

| Image | Description |
| --- | --- |
| `<registre>/sdpc-client:latest` | nginx + build Vue |
| `<registre>/sdpc-server:latest` | API Node.js + SQLite |

Construites et poussées par GitHub Actions sur push `main`, après lint, type-check et tests :

- `deploy-client.yml` : déclenché si `client/**` change
- `deploy-server.yml` : déclenché si `server/**` change

Secrets du dépôt GitHub : `REGISTRY_URL`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`.

Les workflows ne touchent pas au VPS : ils s'arrêtent au `docker push`.

## Mise à jour des images

Chaque `Deployment` porte les annotations Keel (`keel.sh/policy: force`, `keel.sh/trigger: poll`, `keel.sh/pollSchedule: "@every 1m"`) et `imagePullPolicy: Always`. Keel interroge le registre toutes les minutes ; quand `latest` a changé, il relance le pod, qui tire la nouvelle image. Le serveur est en `strategy: Recreate` : une seule réplique (SQLite est sur disque local), jamais deux pods en même temps.

Pour forcer une mise à jour sans attendre :

```bash
kubectl -n dev rollout restart deployment/sdpc-server
kubectl -n dev rollout restart deployment/sdpc-client
```

## Routage

L'image client appelle `/api` en relatif (`VITE_API_URL` par défaut). L'`IngressRoute` du client route `/api` du domaine vers le serveur, **sans `stripPrefix`** (le serveur attend `/api` dans l'URL) ; le reste va au client. Traefik donne la priorité à la règle la plus longue, donc `/api` part bien vers le serveur. Sans cette route, nginx répond 502 sur `/api/`.

## Manifests

Les manifests K3s ne sont **pas dans le dépôt** : ils vivent sur le VPS, dans :

```
/home/deploy/apps-k3s/
├── sdpc-client/
│   ├── deployment.yaml
│   ├── ingressroute.yaml
│   ├── middleware.yaml
│   └── service.yaml
└── sdpc-server/
    ├── deployment.yaml
    ├── ingressroute.yaml
    ├── service.yaml
    └── data/               ← sdpc.db (SQLite), à sauvegarder
```

Application (et à chaque modification d'un manifest) :

```bash
cd /home/deploy/apps-k3s/sdpc-server && kubectl apply -f .
cd /home/deploy/apps-k3s/sdpc-client && kubectl apply -f .
```

Points à respecter dans ces manifests :

- Annotations Keel et `imagePullPolicy: Always` sur les deux `Deployment` ; serveur en `strategy: Recreate`, une seule réplique.
- Serveur : port 4000, sonde sur `/api/health`, `data/` monté sur `/app/data` (`hostPath`, `DirectoryOrCreate`). Sans ce volume, comptes et boutons disparaissent à chaque mise à jour de l'image.
- Client : port 80.
- `IngressRoute` du **client** : deux routes sur le domaine, plus la version HTTP avec `https-redirect`. La route `/api` utilise `PathPrefix` et ne doit pas avoir de `stripPrefix` :

  ```yaml
  routes:
    - match: Host(`<domaine>`) && PathPrefix(`/api`)
      services:
        - name: sdpc-server
          port: 4000
    - match: Host(`<domaine>`)
      services:
        - name: sdpc-client
          port: 80
  ```

- `IngressRoute` du **serveur** : son sous-domaine d'API seul, sans `PathPrefix` :

  ```yaml
  routes:
    - match: Host(`<domaine-api>`)
      services:
        - name: sdpc-server
          port: 4000
  ```

## Sauvegarde

```bash
rsync -av root@vps:/home/deploy/apps-k3s/sdpc-server/data/ ./backup/data/
```

## Commandes utiles

```bash
kubectl -n dev get pods | grep sdpc
kubectl -n dev logs deployment/sdpc-server
curl https://<domaine>/api/health
kubectl -n dev rollout restart deployment/sdpc-server
```
