# 🚀 GUIDE DE DÉPLOIEMENT WBOT (Pour Utilisateurs)

Ce guide explique comment déployer VOTRE propre version du WBOT sur Render.

## 📋 Prérequis
1. Un compte **Render** (https://render.com)
2. Votre **WhatsApp** connecté au site WBOT
3. Le bloc de configuration reçu sur WhatsApp après le scan

---

## 🛠️ Étape 1 : Obtenir vos Identifiants
1. Allez sur le Dashboard WBOT et scannez le QR Code.
2. Une fois connecté, vous recevrez un message sur WhatsApp contenant :
   ```
   SESSION_ID=...
   OWNER_ID=...
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   PREFIXE=...
   NOM_OWNER=...
   ```
3. **Copiez tout le contenu de ce message.**

---

## ☁️ Étape 2 : Déployer sur Render
1. Connectez-vous sur [Render.com](https://render.com).
2. Cliquez sur **New +** → **Web Service**.
3. Dans "Public Git repository", collez ce lien :
   👉 `https://github.com/luis-orvann/wbot`
   *(Ce dépôt contient le code du WBOT prêt à l'emploi)*
4. Cliquez sur **Continue**.

---

## ⚙️ Étape 3 : Configuration Render
Remplissez le formulaire comme suit :
* **Name** : Choisissez un nom (ex: `mon-wbot-perso`)
* **Region** : Frankfurt (ou au choix)
* **Branch** : `main`
* **Runtime** : `Node`
* **Build Command** : `npm install`
* **Start Command** : `npm run server`
* **Plan** : Free (Gratuit)

---

## 🔑 Étape 4 : Ajouter vos Variables
1. Descendez jusqu'à la section **Environment Variables**.
2. Cliquez sur le bouton **"Add from .env"**.
3. Une grande zone de texte apparaît.
4. **COLLEZ** le bloc que vous avez copié depuis WhatsApp (Étape 1).
5. Cliquez sur **"Add Variables"**.

---

## 🚀 Étape 5 : Lancer !
1. Cliquez sur le bouton bleu **"Deploy Web Service"** tout en bas.
2. Patientez quelques minutes...
3. Render va installer et démarrer votre bot.
4. Une fois terminé, vous verrez `Your service is live`.

✅ **Bravo ! Votre WBOT est en ligne 24h/24 !**
Il répondra désormais même si votre ordinateur est éteint.
