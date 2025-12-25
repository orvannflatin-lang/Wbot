# 🚀 Guide de Déploiement WBOT sur Render

## ✅ Prérequis
Avant de déployer sur Render, assurez-vous d'avoir :
1. Un compte GitHub avec votre code pushé
2. Un compte Render (gratuit)
3. Un compte Supabase (gratuit) avec les tables créées

---

## 📋 Étape 1 : Préparer Supabase

### 1.1 Créer les Tables
Exécutez ces scripts SQL dans l'ordre sur Supabase :

1. `supabase_schema.sql` - Tables de base
2. `supabase_settings.sql` - Table user_settings
3. `update_schema_v4.sql` - Colonne session_dump

### 1.2 Noter vos Credentials
Allez dans **Settings > API** et copiez :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## 📋 Étape 2 : Scanner Localement (Important !)

**Pourquoi ?** Pour sauvegarder votre session WhatsApp dans Supabase AVANT le déploiement.

### 2.1 Lancer le Backend
```powershell
npm run server
```

### 2.2 Lancer le Frontend (nouveau terminal)
```powershell
npm run dev
```

### 2.3 Scanner le QR Code
1. Ouvrez `http://localhost:8080`
2. Scannez le QR Code avec WhatsApp
3. Attendez le message de confirmation
4. **Gardez la fenêtre du terminal `npm run server` visible** pour voir votre `SESSION_ID`

---

## 📋 Étape 3 : Déployer sur Render

### 3.1 Créer le Service
1. Allez sur [render.com](https://render.com)
2. Cliquez **New > Web Service**
3. Connectez votre repo GitHub : `orvannflatin-lang/Wbot`
4. Configuration automatique :
   - **Environment**: Docker ✅
   - **Branch**: main
   - **Plan**: Free

### 3.2 Ajouter les Variables d'Environnement

Cliquez sur **Environment > Add from .env** et collez :

```env
PORT=10000
SESSION_ID=votre_session_id_v4_ici
OWNER_ID=votre_numero_whatsapp_ici
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_cle_anon_ici
PREFIXE=1
NOM_OWNER=Votre Nom
```

**Important** :
- `SESSION_ID` : Le V4 que vous avez vu dans le terminal après le scan
- `OWNER_ID` : Votre numéro WhatsApp (format: `22507xxxxxxxx`)

### 3.3 Lancer le Déploiement
Cliquez sur **Create Web Service**

---

## 🔍 Étape 4 : Vérifier le Déploiement

### 4.1 Logs
Allez dans l'onglet **Logs** et vérifiez :
```
[SERVER] Running on port 10000
[WBOT] ✅ V4 Session Dump retrieved from whatsapp_sessions
[WBOT] 🔗 Connected successfully
```

### 4.2 Tester
Envoyez un message à votre bot : `.ping`

---

## 🛠️ Dépannage

### Le bot ne se connecte pas
- Vérifiez que `SESSION_ID` est bien un V4 (commence par `WBOT-MD_V4_`)
- Vérifiez que Supabase contient bien la session dans `whatsapp_sessions`

### "Session dump not found"
- Re-scannez localement avec `npm run server`
- Attendez le message de sauvegarde : `✅ Session saved to Supabase`
- Redéployez sur Render

### Le service crash
- Vérifiez les logs Render
- Assurez-vous que toutes les variables d'environnement sont définies

---

## 📝 Guide pour vos Utilisateurs

Envoyez-leur ce guide simplifié :

### Guide Rapide WBOT

1. **Supabase** : Créez un projet et exécutez les 3 scripts SQL
2. **Local** : 
   ```bash
   npm run server
   npm run dev
   ```
   Scannez le QR Code
3. **Render** : 
   - Créez un Web Service Docker
   - Ajoutez vos variables d'environnement
   - Déployez

**C'est tout !** Votre bot sera en ligne 24/7.

---

## ⚙️ Features Actives par Défaut

✅ Mode Fantôme (Ghost Mode)  
✅ Anti-Delete  
✅ Anti-Vue Unique  
✅ Sauvegarde Statuts  
✅ Downloader  

Modifiez dans Supabase > `user_settings` si besoin.

---

*Créé avec ❤️ par WBOT Team*
