# Configuration pour le déploiement Netlify

## Variables d'environnement à ajouter sur Netlify

```
VITE_SERVER_URL=https://wbot-5.onrender.com
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

## Étapes de déploiement

1. **Build le projet** :
   ```bash
   npm run build
   ```

2. **Sur Netlify** :
   - Connectez votre repo GitHub
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Ajoutez les variables d'environnement ci-dessus

3. **Modifier ConnectionModule.tsx** :
   - Changez `SERVER_URL` de `http://localhost:3000` à `import.meta.env.VITE_SERVER_URL || 'http://localhost:3000'`

## Flow utilisateur final

1. Utilisateur va sur votre-site.netlify.app
2. Crée un compte
3. Va dans Dashboard → Connexion WhatsApp
4. Scanne le QR Code
5. Copie le SESSION_ID affiché
6. Va sur Render → Colle SESSION_ID dans les variables
7. Bot se connecte automatiquement
