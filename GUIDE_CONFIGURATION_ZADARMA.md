# 🔑 Guide de Configuration Zadarma pour HelloJADE

## 📋 Prérequis

1. **Compte Zadarma actif** avec des crédits
2. **Numéro de téléphone** Zadarma configuré
3. **Accès au panel** Zadarma (https://zadarma.com)

## 🚀 Configuration Rapide

### **Méthode 1 : Script Automatique (Recommandé)**

```powershell
.\configure-zadarma-keys.ps1
```

Le script vous guidera étape par étape pour :
- Saisir vos clés API
- Configurer le fichier `.env`
- Tester la connexion
- Redémarrer les services

### **Méthode 2 : Configuration Manuelle**

1. **Obtenez vos clés API** :
   - Connectez-vous à https://zadarma.com
   - Allez dans : **Paramètres → API**
   - Générez ou récupérez :
     - **API Key** (clé publique)
     - **API Secret** (clé privée)
     - **SIP ID** (votre numéro SIP)

2. **Modifiez le fichier `.env`** :
   ```env
   # Remplacez les valeurs de test par vos vraies clés
   ZADARMA_API_KEY=votre_vraie_api_key
   ZADARMA_API_SECRET=votre_vraie_api_secret
   ZADARMA_PHONE_NUMBER=+33123456789
   ZADARMA_SIP_ID=382400
   ZADARMA_WEBHOOK_URL=https://votre-domaine.com/api/webhooks/zadarma
   ```

3. **Redémarrez les services** :
   ```powershell
   docker-compose restart backend
   ```

## 🔧 Configuration Détaillée

### **1. Obtenir les Clés API Zadarma**

#### **Étape 1 : Connexion au Panel**
1. Allez sur https://zadarma.com
2. Connectez-vous avec vos identifiants
3. Naviguez vers **Paramètres → API**

#### **Étape 2 : Génération des Clés**
1. **API Key** : Clé publique (visible)
2. **API Secret** : Clé privée (à garder secrète)
3. **SIP ID** : Identifiant de votre numéro SIP
4. **Numéro** : Votre numéro de téléphone Zadarma

#### **Étape 3 : Vérification**
- Vérifiez que votre compte a des crédits
- Testez la connexion API dans le panel Zadarma

### **2. Configuration du Webhook**

#### **URL du Webhook**
```
https://votre-domaine.com/api/webhooks/zadarma
```

#### **Événements à Activer**
- `call_answered` - Appel décroché
- `call_ended` - Appel terminé
- `call_failed` - Appel échoué
- `tts_completed` - TTS terminé
- `recording_completed` - Enregistrement terminé

#### **Configuration dans le Panel Zadarma**
1. Allez dans **Paramètres → Webhooks**
2. Ajoutez l'URL : `https://votre-domaine.com/api/webhooks/zadarma`
3. Activez les événements listés ci-dessus
4. Testez le webhook

### **3. Configuration du Domaine WebRTC**

#### **Pour les Tests Locaux**
```
127.0.0.1
```

#### **Pour la Production**
```
https://votre-domaine.com
```

#### **Configuration dans le Panel Zadarma**
1. Allez dans **Intégrations → WebRTC**
2. Ajoutez votre domaine
3. Configurez le widget si nécessaire

## 🧪 Tests de Configuration

### **Test 1 : Connexion API**
```powershell
# Test de la connexion Zadarma
Invoke-RestMethod -Uri "http://localhost:3000/api/calls/test-zadarma-connection" -Method GET
```

**Résultat attendu** :
```json
{
  "success": true,
  "balance": "10.50 EUR"
}
```

### **Test 2 : Appel Complet**
```powershell
# Test d'appel avec dialogue médical
.\test-medical-dialogue-zadarma.ps1 -PhoneNumber "0471034785"
```

### **Test 3 : Interface Web**
1. Ouvrez : `http://localhost:8080/test-call-simple.html`
2. Entrez votre numéro de test
3. Cliquez sur "Appeler"

## 🔍 Dépannage

### **Erreur 401 : Not Authorized**
- ✅ Vérifiez vos clés API
- ✅ Vérifiez que votre compte a des crédits
- ✅ Vérifiez que l'API est activée

### **Erreur 403 : Forbidden**
- ✅ Vérifiez les permissions de votre compte
- ✅ Contactez le support Zadarma

### **Webhook non reçu**
- ✅ Vérifiez l'URL du webhook
- ✅ Vérifiez que votre serveur est accessible
- ✅ Vérifiez les logs du backend

### **WebRTC ne fonctionne pas**
- ✅ Vérifiez la configuration du domaine
- ✅ Utilisez HTTPS en production
- ✅ Vérifiez les certificats SSL

## 📊 Monitoring

### **Logs du Backend**
```powershell
docker-compose logs backend -f
```

### **Statut des Services**
```powershell
docker-compose ps
```

### **Statistiques API**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/calls/stats" -Method GET
```

## 🔒 Sécurité

### **Protection des Clés**
- ❌ **NE JAMAIS** committer le fichier `.env` dans Git
- ✅ Ajoutez `.env` au `.gitignore`
- ✅ Utilisez des variables d'environnement en production
- ✅ Changez vos clés régulièrement

### **Sauvegarde**
```powershell
# Sauvegarder la configuration
Copy-Item ".env" ".env.backup.$(Get-Date -Format 'yyyyMMdd')"
```

### **Rotation des Clés**
1. Générez de nouvelles clés dans le panel Zadarma
2. Mettez à jour le fichier `.env`
3. Redémarrez les services
4. Testez la nouvelle configuration

## 📞 Support

### **Support Zadarma**
- **Email** : support@zadarma.com
- **Documentation** : https://zadarma.com/support/api/
- **Panel** : https://zadarma.com

### **Support HelloJADE**
- **Logs** : `docker-compose logs backend`
- **Tests** : Utilisez les scripts de test fournis
- **Interface** : Vérifiez l'interface web

## 🎯 Checklist de Configuration

- [ ] Compte Zadarma actif avec crédits
- [ ] Clés API générées et configurées
- [ ] Fichier `.env` mis à jour
- [ ] Backend redémarré
- [ ] Connexion API testée
- [ ] Webhook configuré
- [ ] Domaine WebRTC configuré
- [ ] Test d'appel réussi
- [ ] Interface web fonctionnelle
- [ ] Logs vérifiés

## 🚀 Prochaines Étapes

1. **Testez** avec vos vraies clés
2. **Configurez** le webhook en production
3. **Intégrez** dans votre workflow
4. **Formez** votre équipe
5. **Surveillez** les performances

---

**🎉 Félicitations !** Votre système HelloJADE est maintenant configuré avec les vraies clés API Zadarma et prêt pour des appels réels !

