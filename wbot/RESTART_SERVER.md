# Redémarrage du serveur backend

## Étapes

1. **Arrêter le serveur actuel** :
   - Va dans le terminal où `npm run server` tourne (celui qui tourne depuis 11h49m)
   - Appuie sur `Ctrl+C`

2. **Redémarrer le serveur** :
   ```bash
   npm run server
   ```

3. **Tester** :
   - Va dans le dashboard
   - Clique sur "Déconnecter"
   - Rescanne le QR Code
   - Vérifie le message WhatsApp

## Message attendu sur WhatsApp

```
WBOT CONFIGURATION (Render)

Copiez le bloc ci-dessous et collez-le dans "Add from .env" sur Render :

```
PORT=10000
SESSION_ID=WBOT-MD_V4_203a2c58-4314-4369-9bbd-cc7468516e89
OWNER_ID=203a2c58-4314-4369-9bbd-cc7468516e89
SUPABASE_URL=https://kgwrlutwqnfhqizeftgb.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
PREFIXE=1
NOM_OWNER=Moi
```

✅ Configuration prête pour déploiement.
```

Si le message ne contient toujours pas `PORT=10000`, c'est que le serveur n'a pas été redémarré.
