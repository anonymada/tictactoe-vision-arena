# TicTacToe Vision Arena

Petit serveur pour organiser une partie de TicTacToe entre plusieurs smartphones ou clients du même réseau local.

Le but est simple :
- un serveur central garde l'état du jeu,
- les clients envoient leurs coups via API ou WebSocket,
- une interface web permet de suivre la partie en temps réel.

Cette image Docker est pensée pour être lancée facilement sur un poste local et utilisée depuis un smartphone connecté au même réseau Wi‑Fi.

## À quoi sert ce projet ?

Ce projet ne fait ni vision, ni IA. Il sert uniquement à :
- gérer l'état du plateau,
- enregistrer les joueurs,
- accepter les coups,
- diffuser les mises à jour via Socket.IO,
- exposer une interface de monitoring simple.

Il est conçu pour être utilisé dans un cadre pédagogique ou de démonstration.

## Démarrage rapide

### 1) Récupérer l'image

```bash
docker pull anonymada/tictactoevisionarena:latest
```

### 2) Vérifier votre adresse IP locale

Sur votre machine hôte :

```bash
hostname -I
```

Par exemple, cela peut afficher :

```bash
192.168.1.25 172.17.0.1
```

La bonne adresse à utiliser pour un smartphone sur le même réseau local est souvent la première IP non Docker, ici :

```bash
192.168.1.25
```

### 3) Créer un fichier .env

```env
SERVER_HOST=192.168.1.25
PORT=3000
```

### 4) Lancer le conteneur

```bash
docker run --rm -d --env-file .env -p 3000:3000 anonymada/tictactoevisionarena:latest
```

### 5) Ouvrir l'application

Dans le navigateur du téléphone ou de l'ordinateur du même réseau :

```text
http://192.168.1.25:3000
```

## Important : pourquoi ne pas utiliser 172.x.x.x ?

Les adresses `172.x.x.x` proviennent souvent du réseau Docker interne (`docker0`, bridge, etc.).

Elles ne correspondent pas à l'IP de votre machine sur le réseau local.

Si vous voyez une IP en `172.x`, cela signifie en général que le conteneur est sur un réseau Docker interne, et non sur votre Wi‑Fi LAN.

C'est pourquoi il est important de fournir explicitement `SERVER_HOST` avec l'IP réelle de votre hôte.

## Variables d'environnement

| Variable | Description | Exemple |
| --- | --- | --- |
| `SERVER_HOST` | IP du host sur le réseau local, accessible depuis les clients | `192.168.1.25` |
| `PORT` | Port exposé par le conteneur | `3000` |

## Endpoints disponibles

### Interface web

```text
http://<HOST_IP>:3000/
```

### API

- `GET /state` : état actuel de la partie
- `POST /register` : enregistrement d'un joueur
- `POST /move` : jouer un coup
- `GET /host` : renvoie l'URL du serveur

### WebSocket

Le serveur expose un flux Socket.IO sur le même host/port.

### API DOCS

Find the `API Document` here [`docs/api.md`](docs/api.md).

## Exemple de lancement avec un hôte Linux

```bash
HOST_IP=$(hostname -I | tr ' ' '\n' | grep -v '^127\.' | grep -v '^172\.' | head -n 1)

echo "SERVER_HOST=$HOST_IP" > .env
echo "PORT=3000" >> .env

docker run --rm -d --env-file .env -p 3000:3000 anonymada/tictactoevisionarena:latest
```

## Notes

- Le serveur est livré en HTTP simple par défaut.
- Pour un usage réel de caméra dans le navigateur, il faudra généralement passer en HTTPS.
- Le but de ce projet est surtout la démonstration et l'usage local sur le réseau.

## Licence

Projet pédagogique et de démonstration.
