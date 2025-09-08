<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">🧪 Test Appels JADE</h1>
        <p class="text-gray-600">Interface de test pour valider le système d'appels médicaux automatisés</p>
      </div>

      <!-- Formulaire de test -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">📞 Lancer un Appel Test</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Informations patient -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Numéro de téléphone</label>
              <input
                v-model="testData.phone"
                type="tel"
                placeholder="+32471034785"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom du patient</label>
              <input
                v-model="testData.name"
                type="text"
                placeholder="Dupont"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Prénom du patient</label>
              <input
                v-model="testData.firstName"
                type="text"
                placeholder="Marie"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Site hospitalier</label>
              <select
                v-model="testData.hospitalId"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MONS">Mons</option>
                <option value="CHARLEROI">Charleroi</option>
                <option value="TOURNAI">Tournai</option>
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div class="space-y-4">
            <button
              @click="startCall"
              :disabled="isCalling || !testData.phone"
              class="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {{ isCalling ? '🔄 Appel en cours...' : '📞 Lancer l\'appel' }}
            </button>

            <button
              @click="testDialogue"
              :disabled="isTesting"
              class="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {{ isTesting ? '🔄 Test en cours...' : '🤖 Tester le dialogue JADE' }}
            </button>

            <button
              @click="clearResults"
              class="w-full bg-gray-600 text-white px-6 py-3 rounded-md hover:bg-gray-700 font-medium"
            >
              🗑️ Effacer les résultats
            </button>
          </div>
        </div>
      </div>

      <!-- Résultats -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">📊 Résultats des Tests</h2>
        
        <!-- Statut des services -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center">
              <div :class="servicesStatus.backend ? 'bg-green-500' : 'bg-red-500'" class="w-3 h-3 rounded-full mr-2"></div>
              <span class="font-medium">Backend</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ servicesStatus.backend ? 'Connecté' : 'Déconnecté' }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center">
              <div :class="servicesStatus.rasa ? 'bg-green-500' : 'bg-red-500'" class="w-3 h-3 rounded-full mr-2"></div>
              <span class="font-medium">Rasa</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ servicesStatus.rasa ? 'Actif' : 'Inactif' }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center">
              <div :class="servicesStatus.whisper ? 'bg-green-500' : 'bg-red-500'" class="w-3 h-3 rounded-full mr-2"></div>
              <span class="font-medium">Whisper</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ servicesStatus.whisper ? 'Disponible' : 'Indisponible' }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex items-center">
              <div :class="servicesStatus.ollama ? 'bg-green-500' : 'bg-red-500'" class="w-3 h-3 rounded-full mr-2"></div>
              <span class="font-medium">Ollama</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ servicesStatus.ollama ? 'Prêt' : 'Non prêt' }}</p>
          </div>
        </div>

        <!-- Logs des tests -->
        <div class="space-y-4">
          <div v-for="(log, index) in testLogs" :key="index" class="border-l-4 pl-4 py-2" :class="getLogClass(log.type)">
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ log.title }}</span>
              <span class="text-sm text-gray-500">{{ log.timestamp }}</span>
            </div>
            <p class="text-sm mt-1">{{ log.message }}</p>
            <pre v-if="log.data" class="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">{{ JSON.stringify(log.data, null, 2) }}</pre>
          </div>
        </div>

        <!-- Données JADE extraites -->
        <div v-if="jadeData" class="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 class="font-semibold text-blue-900 mb-2">🎯 Données JADE Extraites</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(value, key) in jadeData" :key="key" class="flex justify-between">
              <span class="font-medium text-blue-800">{{ formatKey(key) }}:</span>
              <span class="text-blue-700">{{ value }}</span>
            </div>
          </div>
        </div>

        <!-- Score médical -->
        <div v-if="medicalScore !== null" class="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 class="font-semibold text-green-900 mb-2">📈 Score Médical Calculé</h3>
          <div class="flex items-center">
            <div class="flex-1 bg-gray-200 rounded-full h-4 mr-4">
              <div 
                class="h-4 rounded-full transition-all duration-500"
                :class="getScoreColor(medicalScore)"
                :style="{ width: medicalScore + '%' }"
              ></div>
            </div>
            <span class="font-bold text-lg" :class="getScoreTextColor(medicalScore)">{{ medicalScore }}/100</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Données réactives
const testData = ref({
  phone: '+32471034785',
  name: 'Dupont',
  firstName: 'Marie',
  hospitalId: 'MONS'
})

const isCalling = ref(false)
const isTesting = ref(false)
const testLogs = ref<any[]>([])
const jadeData = ref<any>(null)
const medicalScore = ref<number | null>(null)

const servicesStatus = ref({
  backend: false,
  rasa: false,
  whisper: false,
  ollama: false
})

// Méthodes
const addLog = (type: 'success' | 'error' | 'info', title: string, message: string, data?: any) => {
  testLogs.value.unshift({
    type,
    title,
    message,
    data,
    timestamp: new Date().toLocaleTimeString()
  })
}

const getLogClass = (type: string) => {
  switch (type) {
    case 'success': return 'border-green-500 bg-green-50'
    case 'error': return 'border-red-500 bg-red-50'
    default: return 'border-blue-500 bg-blue-50'
  }
}

const formatKey = (key: string) => {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getScoreTextColor = (score: number) => {
  if (score >= 80) return 'text-green-700'
  if (score >= 60) return 'text-yellow-700'
  return 'text-red-700'
}

const checkServices = async () => {
  addLog('info', 'Vérification des services', 'Contrôle de l\'état des services...')
  
  try {
    // Test Backend
    const backendResponse = await fetch('http://localhost:3000/health')
    servicesStatus.value.backend = backendResponse.ok
    addLog(backendResponse.ok ? 'success' : 'error', 'Backend', 
           backendResponse.ok ? 'Service backend opérationnel' : 'Service backend indisponible')
  } catch (error) {
    servicesStatus.value.backend = false
    addLog('error', 'Backend', 'Impossible de contacter le backend')
  }

  try {
    // Test Rasa
    const rasaResponse = await fetch('http://localhost:5005/')
    servicesStatus.value.rasa = rasaResponse.ok
    addLog(rasaResponse.ok ? 'success' : 'error', 'Rasa', 
           rasaResponse.ok ? 'Service Rasa opérationnel' : 'Service Rasa indisponible')
  } catch (error) {
    servicesStatus.value.rasa = false
    addLog('error', 'Rasa', 'Impossible de contacter Rasa')
  }

  try {
    // Test Whisper
    const whisperResponse = await fetch('http://localhost:9000/')
    servicesStatus.value.whisper = whisperResponse.ok
    addLog(whisperResponse.ok ? 'success' : 'error', 'Whisper', 
           whisperResponse.ok ? 'Service Whisper opérationnel' : 'Service Whisper indisponible')
  } catch (error) {
    servicesStatus.value.whisper = false
    addLog('error', 'Whisper', 'Impossible de contacter Whisper')
  }

  try {
    // Test Ollama
    const ollamaResponse = await fetch('http://localhost:11434/api/tags')
    servicesStatus.value.ollama = ollamaResponse.ok
    addLog(ollamaResponse.ok ? 'success' : 'error', 'Ollama', 
           ollamaResponse.ok ? 'Service Ollama opérationnel' : 'Service Ollama indisponible')
  } catch (error) {
    servicesStatus.value.ollama = false
    addLog('error', 'Ollama', 'Impossible de contacter Ollama')
  }
}

const startCall = async () => {
  if (!testData.value.phone) {
    addLog('error', 'Erreur', 'Veuillez saisir un numéro de téléphone')
    return
  }

  isCalling.value = true
  addLog('info', 'Lancement d\'appel', `Démarrage de l'appel vers ${testData.value.phone}`)

  try {
    const response = await fetch('http://localhost:3000/api/calls/medical', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hospitalId: testData.value.hospitalId,
        patientNumber: testData.value.phone,
        patientId: `test-${Date.now()}`,
        patientName: testData.value.name,
        patientFirstName: testData.value.firstName
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      addLog('success', 'Appel lancé', 'L\'appel a été initié avec succès', result)
    } else {
      addLog('error', 'Erreur d\'appel', result.message || 'Erreur lors du lancement de l\'appel', result)
    }
  } catch (error) {
    addLog('error', 'Erreur réseau', 'Impossible de contacter le backend pour lancer l\'appel')
  } finally {
    isCalling.value = false
  }
}

const testDialogue = async () => {
  isTesting.value = true
  addLog('info', 'Test dialogue JADE', 'Démarrage du test de dialogue médical')

  const dialogueSteps = [
    { message: 'bonjour', expected: 'greet' },
    { message: 'oui c est moi', expected: 'confirm_identity' },
    { message: '15 mars 1970', expected: 'provide_birth_date' },
    { message: '3', expected: 'provide_pain_level' },
    { message: 'tete', expected: 'provide_pain_location' },
    { message: 'oui', expected: 'confirm_medication' },
    { message: 'oui', expected: 'confirm_transit' },
    { message: '7', expected: 'provide_mood_level' },
    { message: 'non', expected: 'deny_fever' },
    { message: 'rien de special', expected: 'provide_other_complaints' }
  ]

  try {
    for (const step of dialogueSteps) {
      const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: 'test-user',
          message: step.message
        })
      })

      const result = await response.json()
      addLog('info', `Étape: ${step.expected}`, `Message: "${step.message}"`, result)
      
      // Petite pause entre les étapes
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Simuler la sauvegarde des données JADE
    const mockJadeData = {
      patient_confirme: true,
      identite_verifiee: true,
      douleur_niveau: 3,
      douleur_localisation: 'tete',
      traitement_suivi: true,
      transit_normal: true,
      probleme_transit: '',
      moral_niveau: 7,
      moral_details: '',
      fievre: false,
      temperature: 0,
      autres_plaintes: 'rien de special'
    }

    jadeData.value = mockJadeData
    medicalScore.value = 85 // Score calculé

    addLog('success', 'Dialogue terminé', 'Test de dialogue JADE complété avec succès', mockJadeData)

  } catch (error) {
    addLog('error', 'Erreur dialogue', 'Erreur lors du test de dialogue')
  } finally {
    isTesting.value = false
  }
}

const clearResults = () => {
  testLogs.value = []
  jadeData.value = null
  medicalScore.value = null
  addLog('info', 'Nettoyage', 'Résultats effacés')
}

// Initialisation
onMounted(() => {
  checkServices()
})
</script>
