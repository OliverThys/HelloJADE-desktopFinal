# 🚀 Guide FreeSWITCH + Zadarma pour HelloJADE

## 🎯 **Votre Solution Complète**

Vous avez maintenant une **solution complète** pour vos appels médicaux automatisés avec :
- ✅ **FreeSWITCH** comme moteur téléphonique
- ✅ **Zadarma** comme fournisseur SIP
- ✅ **API REST** pour l'intégration
- ✅ **Scripts médicaux** prédéfinis
- ✅ **Enregistrement** automatique
- ✅ **Multi-fournisseur** (extensible)

## 🚀 **Démarrage Rapide**

### **1. Installation (Une seule fois)**
```powershell
# Exécuter en tant qu'administrateur
.\install-freeswitch.ps1
```

### **2. Configuration Zadarma**
```powershell
# Configurer avec vos vraies clés Zadarma
.\configure-freeswitch-zadarma.ps1
```

### **3. Démarrage Complet**
```powershell
# Démarrer tout l'environnement
.\start-hellojade-freeswitch.ps1
```

### **4. Test Complet**
```powershell
# Tester toute la chaîne
.\test-freeswitch-zadarma-complet.ps1
```

## 📞 **Utilisation de l'API**

### **Initier un Appel Médical**
```bash
POST http://localhost:3000/api/medical-calls/initiate
Content-Type: application/json

{
  "patientPhone": "0471034785",
  "scriptType": "post_hospital_followup",
  "hospitalId": "zadarma",
  "patientId": "PATIENT001",
  "patientName": "Jean Dupont"
}
```

### **Réponse**
```json
{
  "success": true,
  "data": {
    "callId": "uuid-1234-5678",
    "patientPhone": "0471034785",
    "hospitalId": "zadarma",
    "status": "initiated",
    "scriptName": "Suivi post-hospitalier"
  }
}
```

## 🏥 **Scripts Médicaux Disponibles**

### **1. Suivi Post-Hospitalier**
- **ID**: `post_hospital_followup`
- **Questions**: État général, douleurs, médicaments, respiration
- **Durée**: ~3-4 minutes
- **Usage**: Patients sortis de l'hôpital

### **2. Vérification d'Urgence**
- **ID**: `emergency_check`
- **Questions**: Situation d'urgence
- **Durée**: ~1-2 minutes
- **Usage**: Situations critiques

## 🔧 **Configuration Multi-Fournisseur**

### **Ajouter un Nouveau Fournisseur SIP**

1. **Créer le profil SIP** :
```xml
<!-- /etc/freeswitch/sip_profiles/nouveau-fournisseur.xml -->
<profile name="nouveau-fournisseur">
  <settings>
    <param name="username" value="votre_username"/>
    <param name="password" value="votre_password"/>
    <param name="realm" value="sip.nouveau-fournisseur.fr"/>
    <param name="register" value="true"/>
  </settings>
</profile>
```

2. **Modifier l'API** :
```javascript
// Dans freeswitch-service.js
async initiateMedicalCall(patientPhone, script, hospitalId) {
    const gateway = hospitalId; // Utilise l'ID comme nom de gateway
    const command = `originate sofia/gateway/${gateway}/${patientPhone} &park()`;
    // ...
}
```

3. **Utiliser l'API** :
```json
{
  "patientPhone": "0471034785",
  "hospitalId": "nouveau-fournisseur",
  "scriptType": "post_hospital_followup"
}
```

## 📊 **Monitoring et Logs**

### **Logs FreeSWITCH**
```powershell
# Voir les logs en temps réel
Get-Content "C:\Program Files\FreeSWITCH\log\freeswitch.log" -Tail 20 -Wait
```

### **Statut des Services**
```powershell
# Vérifier FreeSWITCH
Get-Process -Name "freeswitch"

# Vérifier les services Docker
docker-compose ps

# Tester l'API
Invoke-RestMethod -Uri "http://localhost:3000/api/medical-calls/test" -Method POST
```

## 🎙️ **Enregistrements**

### **Localisation des Fichiers**
```
C:\Program Files\FreeSWITCH\recordings\
├── medical_zadarma_0471034785_2024-01-15T10-30-00.wav
├── response_general_state_uuid-1234.wav
├── response_pain_level_uuid-1234.wav
└── response_medication_uuid-1234.wav
```

### **Traitement des Enregistrements**
```javascript
// Dans votre backend
const recordingPath = "C:\\Program Files\\FreeSWITCH\\recordings\\medical_zadarma_0471034785_2024-01-15T10-30-00.wav";

// Transcription avec Whisper
const transcription = await whisperService.transcribe(recordingPath);

// Analyse médicale avec Rasa
const analysis = await rasaService.analyze(transcription);
```

## 🔒 **Sécurité et HDS**

### **Pour la Production HDS**
1. **Serveur français** certifié HDS
2. **Chiffrement** des enregistrements
3. **Accès restreint** aux logs
4. **Sauvegarde** sécurisée
5. **Audit** des appels

### **Configuration Sécurisée**
```xml
<!-- Configuration sécurisée -->
<param name="tls" value="true"/>
<param name="tls-verify" value="true"/>
<param name="tls-verify-depth" value="2"/>
<param name="sip-trace" value="false"/>
<param name="sip-capture" value="false"/>
```

## 🚨 **Dépannage**

### **Problèmes Courants**

#### **FreeSWITCH ne démarre pas**
```powershell
# Vérifier les logs
Get-Content "C:\Program Files\FreeSWITCH\log\freeswitch.log" -Tail 50

# Redémarrer
Stop-Process -Name "freeswitch" -Force
Start-Process -FilePath "C:\Program Files\FreeSWITCH\freeswitch.exe"
```

#### **Connexion SIP échoue**
```powershell
# Vérifier la configuration
Get-Content "C:\Program Files\FreeSWITCH\conf\hellojade\zadarma.xml"

# Tester la connectivité
Test-NetConnection -ComputerName "sip.zadarma.com" -Port 5060
```

#### **API non accessible**
```powershell
# Vérifier le backend
docker-compose logs backend

# Redémarrer le backend
docker-compose restart backend
```

## 📈 **Performance et Scalabilité**

### **Optimisations**
- **Pool de connexions** ESL
- **Cache** des configurations SIP
- **Compression** des enregistrements
- **Load balancing** pour plusieurs instances

### **Monitoring**
```javascript
// Métriques importantes
const metrics = {
    activeCalls: freeswitchService.getActiveCalls(),
    successRate: freeswitchService.getSuccessRate(),
    averageDuration: freeswitchService.getAverageDuration(),
    errorRate: freeswitchService.getErrorRate()
};
```

## 🎯 **Prochaines Étapes**

### **1. Intégration IA**
- **Whisper** pour la transcription
- **Rasa** pour l'analyse médicale
- **Scoring** automatique de l'état de santé

### **2. Interface Web**
- **Dashboard** de monitoring
- **Gestion** des patients
- **Historique** des appels

### **3. Déploiement Production**
- **Infrastructure HDS**
- **Monitoring** avancé
- **Sauvegarde** automatique

## 🆘 **Support**

### **Logs Importants**
- **FreeSWITCH**: `C:\Program Files\FreeSWITCH\log\freeswitch.log`
- **Backend**: `docker-compose logs backend`
- **API**: Logs dans la console Node.js

### **Commandes de Diagnostic**
```powershell
# Test complet
.\test-freeswitch-zadarma-complet.ps1

# Test de connexion
.\test-freeswitch-zadarma.ps1

# Statut des services
docker-compose ps
```

---

## 🎉 **Félicitations !**

Vous avez maintenant un **système complet** d'appels médicaux automatisés avec FreeSWITCH + Zadarma ! 

**Votre système peut :**
- ✅ Appeler des patients sortis de l'hôpital
- ✅ Exécuter des dialogues médicaux scriptés
- ✅ Enregistrer les réponses
- ✅ S'adapter à différents fournisseurs SIP
- ✅ Être étendu avec de l'IA médicale

**Prêt pour la production !** 🚀
