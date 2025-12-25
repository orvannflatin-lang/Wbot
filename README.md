# WBOT - WhatsApp Bot Multi-Device

WBOT est un bot WhatsApp avancé, conçu pour la confidentialité et l'automatisation. Il inclut des fonctionnalités comme l'Anti-View Once, l'Anti-Delete, le téléchargement de statuts et de médias sociaux, et un mode fantôme.

## 🚀 Déploiement Rapide sur Render

Vous pouvez déployer votre propre instance de WBOT gratuitement sur Render.

### Pré-requis
1.  Un compte [GitHub](https://github.com).
2.  Un compte [Render](https://render.com).
3.  Un projet Supabase (URL et Anon Key).

### Étapes de Déploiement

1.  **Forkez ce dépôt** : Cliquez sur "Fork" en haut à droite de cette page.
2.  **Scanner le QR Code** :
    - Lancez le projet localement ou utilisez une instance temporaire.
    - Connectez votre WhatsApp via le Dashboard.
    - **IMPORTANT** : Une fois connecté, le bot vous enverra un message sur WhatsApp commençant par `WBOT-MD_V2_...`.
    - Copiez tout le bloc de texte de ce message (Session ID).
3.  **Déployer sur Render** :
    - Créez un nouveau "Web Service" sur Render à partir de votre fork.
    - Ou cliquez sur le bouton ci-dessous (si configuré) :
    
    [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

4.  **Configuration des Variables** :
    Ajoutez les variables d'environnement suivantes dans Render :
    - `SUPABASE_URL` : Votre URL Supabase.
    - `SUPABASE_ANON_KEY` : Votre clé Anon Supabase.
    - `SESSION_ID` : Collez ici TOUT le texte (Base64) reçu par message WhatsApp.

Le bot démarrera automatiquement avec votre session restaurée !

## 🛠️ Installation Locale

1.  Cloner le repo :
    ```bash
    git clone https://github.com/votre-username/wbot.git
    cd wbot
    ```
2.  Installer les dépendances :
    ```bash
    npm install
    ```
3.  Configurer `.env` :
    ```env
    SUPABASE_URL=votre_url
    SUPABASE_ANON_KEY=votre_cle
    ```
4.  Lancer le serveur :
    ```bash
    npm run dev
    ```

## ✨ Fonctionnalités

- **Anti-View Once** : Sauvegardez les médias à vue unique en répondant avec `1` (configurable).
- **Anti-Delete** : Capturez les messages supprimés.
- **Statut Saver** : Sauvegardez les statuts en répondant avec `*`.
- **Mode Fantôme** : Lisez les messages sans envoyer de "Vu".
- **Downloader** : Téléchargez vidéos TikTok, Instagram, Facebook avec `dl <lien>`.
