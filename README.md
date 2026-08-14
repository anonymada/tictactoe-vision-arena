TicTacToe Vision Arena
======================

Petit serveur pédagogique pour organiser des parties TicTacToe entre deux smartphones exécutant une IA/vision locale.

Important: le serveur n'exécute AUCUNE IA et AUCUNE vision. Les smartphones sont considérés comme des joueurs autonomes qui POSTENT leurs coups.

Structure
---------

server/
  server.js       - serveur HTTP + Socket.IO (HTTPS optionnel)
  api.js          - routes REST (register, move, state)
  gameManager.js  - logique de gestion de partie (règles, grille, détection victoire)

public/
  index.html      - interface de monitoring (1 page)
  app.js          - client JS (Socket.IO)
  style.css       - styles

cert/
  cert.pem        - certificat auto-signé (non fourni)
  key.pem         - clé privée (non fournie)

Fonctionnement
--------------

API REST (très simple)

POST /register
Body: { "name": "Equipe Alpha" }
Returns: { "player": "X" }

POST /move
Body: { "player": "X", "row": 1, "col": 2 }
Returns: { success: true, board: [...], nextPlayer: "O", winner: null }

GET /state
Returns full state: plateau, joueur courant, vainqueur, statistiques, journal

WebSocket (Socket.IO)
---------------------
Toutes les modifications de l'état sont immédiatement diffusées via Socket.IO sur l'événement 'state'. L'UI publique s'abonne pour suivre la partie en temps réel.

HTTPS / HTTP
-------------
Par défaut ce serveur fonctionne en HTTP pour simplifier le développement local (http://localhost:3000).

Important : l'accès à la caméra via getUserMedia dans un navigateur moderne est généralement restreint aux pages servies en HTTPS.

Options :
- Développement local sans HTTPS : ouvrir http://localhost:3000 et, selon le navigateur, activer l'option "Allow insecure localhost" pour autoriser getUserMedia sur localhost.
- Utiliser HTTPS (recommandé pour tests caméra réels) : générer un certificat auto-signé et démarrer le serveur en HTTPS. Pour cela, créer cert/key et adapter server.js pour charger les certificats (le projet fournit la logique pour HTTPS dans une version alternative).

Générer un certificat auto-signé (OpenSSL)
-----------------------------------------

Sur un poste de développement (Linux / macOS / Windows avec OpenSSL installé), exécuter :

openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout key.pem -out cert.pem -subj "/CN=localhost"

Puis mettre les fichiers key.pem et cert.pem dans le dossier cert/ à la racine du projet si tu veux démarrer en HTTPS.

Démarrage
---------

1. Installer les dépendances (express, socket.io) :
   npm init -y
   npm install express socket.io

2. Lancer le serveur :
   node server/server.js

3. Ouvrir le navigateur à :
   http://localhost:3000/ (ou https://localhost:3443 si tu as configuré et démarré le serveur en HTTPS)

Vision (explication pour les smartphones)
----------------------------------------
Le serveur NE fait PAS de vision.

Recommandation de plateau (A4 imprimé) :
- Fond blanc
- Grille 3x3 avec traits noirs épais
- Quatre marqueurs ArUco (un dans chaque coin) pour la détection d'orientation
- Grandes cases (chaque case suffisamment grande pour que la caméra et le modèle OCR/vision puissent reconnaître X/O)

Le smartphone doit :
- détecter la feuille et corriger la perspective (grâce aux ArUco)
- découper les 9 cases
- déterminer l'état du plateau
- décider son prochain coup
- appeler POST /move sur le serveur pour jouer

Règles appliquées par le serveur
-------------------------------
Le serveur est l'autorité :
- Refuse les coups hors-tour
- Refuse de jouer sur une case occupée
- Refuse les coups après la fin de la partie

Conception pédagogique
----------------------
Le code est volontairement simple et commenté pour être utilisé en TP ou en cours. L'architecture est modulaire pour faciliter des extensions futures (plusieurs parties, tournois, historique) sans changer l'API actuelle.

Extensibilité (bonus)
----------------------
- gameManager.js est centralisé pour permettre de gérer plusieurs instances (une par match) ultérieurement
- API actuelle peut être étendue pour supporter plusieurs parties sans modifier les endpoints existants (même signature, ajout d'un paramètre matchId)

Licence
-------
Projet d'exemple éducatif.
