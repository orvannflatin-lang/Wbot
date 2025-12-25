# Dockerfile pour WBOT (Racine)
# Ce fichier permet de déployer le projet sur Render sans configurer le "Root Directory".
# Il copie automatiquement le contenu du dossier 'wbot' dans l'image Docker.

FROM node:20-slim

# Installation des dépendances système (ffmpeg est requis pour WhatsApp)
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances (depuis le dossier wbot)
COPY wbot/package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code source (depuis le dossier wbot)
COPY wbot/ .

# Port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Démarrage
CMD ["npm", "run", "server"]
