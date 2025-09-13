# 🚀 Démarrage Rapide - HelloJADE avec Zadarma

## ⚡ Configuration en 3 étapes

### 1️⃣ **Configuration des clés API**

```powershell
# Exécuter le script de configuration
.\setup-zadarma-config.ps1
```

**Entrez vos clés Zadarma :**
- API Key (depuis votre panel Zadarma)
- API Secret (depuis votre panel Zadarma)
- URL Webhook (ex: https://votre-domaine.com/api/webhooks/zadarma)

### 2️⃣ **Démarrage du système**

```powershell
# Démarrer tous les services
docker-compose up -d
```

### 3️⃣ **Test immédiat**

```powershell
# Test rapide de la configuration
.\test-zadarma-quick.ps1

# Test complet de l'intégration
.\test-zadarma-integration.ps1
```

## 📞 Test avec le numéro 0471034785

Le système est configuré pour appeler ce numéro avec le dialogue médical complet :

1. **Message d'accueil** : "Bonjour, ici le système médical HelloJADE"
2. **Questions médicales séquentielles** :
   - Vérification d'identité
   - Description des symptômes
   - Niveau de douleur (1-10)
   - Difficultés respiratoires
   - Médicaments pris
   - Présence de fièvre
   - Autres plaintes
3. **Enregistrement** de chaque réponse (max 30 sec)
4. **Transcription** via Whisper
5. **Analyse** via Ollama
6. **Calcul du score** d'urgence (0-100)
7. **Action appropriée** :
   - Score < 30 : Transfert urgence
   - Score ≥ 30 : Conseils médicaux

## 🔧 Configuration Webhook dans Zadarma

Dans votre panel Zadarma, configurez l'URL webhook :

```
https://votre-domaine.com/api/webhooks/zadarma
```

**Événements à activer :**
- `call_answered`
- `recording_completed`
- `call_ended`
- `call_failed`
- `tts_completed`

## 🧪 Tests de validation

### Test de connexion API
```powershell
curl http://localhost:3000/api/calls/test-zadarma-connection
```

### Test d'appel
```powershell
$body = @{
    patientId = "TEST001"
    patientName = "Test"
    patientFirstName = "Patient"
    patientNumber = "0471034785"
    hospitalId = "HOPITAL_TEST"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/calls/initiate" -Method POST -Body $body -ContentType "application/json"
```

### Test des webhooks
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/zadarma/test" -Method POST
```

## 🌐 URLs d'accès

- **API Backend** : http://localhost:3000
- **Health Check** : http://localhost:3000/health
- **Frontend** : http://localhost:1420
- **Whisper** : http://localhost:9000
- **Ollama** : http://localhost:11434
- **Rasa** : http://localhost:5005

## 📊 Monitoring

### Vérifier le statut des services
```powershell
docker-compose ps
```

### Voir les logs
```powershell
# Logs du backend
docker-compose logs backend

# Logs de tous les services
docker-compose logs
```

### Statut du service Zadarma
```powershell
curl http://localhost:3000/api/calls/status
```

## 🚨 Dépannage

### Problème : Connexion API échouée
- ✅ Vérifiez vos clés API dans le fichier `.env`
- ✅ Vérifiez que vos clés sont correctes dans votre panel Zadarma

### Problème : Webhooks non reçus
- ✅ Vérifiez l'URL webhook dans votre panel Zadarma
- ✅ Assurez-vous que l'URL est accessible depuis Internet

### Problème : Appel non initié
- ✅ Vérifiez le solde de votre compte Zadarma
- ✅ Vérifiez que le numéro de destination est valide

### Problème : Services non démarrés
```powershell
# Redémarrer tous les services
docker-compose down
docker-compose up -d
```

## ✅ Checklist de validation

- [ ] Fichier `.env` créé avec vos vraies clés API
- [ ] Services Docker démarrés (`docker-compose ps`)
- [ ] API HelloJADE accessible (http://localhost:3000/health)
- [ ] Connexion Zadarma OK (test API)
- [ ] Webhooks configurés dans votre panel Zadarma
- [ ] Test d'appel vers 0471034785 réussi
- [ ] Transcription Whisper fonctionnelle
- [ ] Analyse Ollama fonctionnelle
- [ ] Calcul du score d'urgence correct

## 🎉 Félicitations !

Si tous les tests passent, votre système HelloJADE utilise maintenant l'API Zadarma au lieu d'Asterisk !

**Avantages de la migration :**
- ✅ Plus simple à configurer
- ✅ Plus fiable
- ✅ Infrastructure professionnelle
- ✅ Support technique Zadarma
- ✅ Scalabilité automatique

## 📞 Support

- **Documentation complète** : `GUIDE_MIGRATION_ASTERISK_ZADARMA.md`
- **Logs du système** : `docker-compose logs`
- **Test de diagnostic** : `.\test-zadarma-integration.ps1`

---

**🚀 Le système est prêt à fonctionner avec Zadarma API !**
