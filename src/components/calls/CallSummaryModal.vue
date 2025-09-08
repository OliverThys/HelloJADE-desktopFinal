<template>
  <div v-if="call" class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-gray-900">
          Résumé d'appel - {{ call.patientFirstName }} {{ call.patientName }}
        </h3>
        <button @click="$emit('close')" class="btn btn-sm btn-circle btn-ghost">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Informations générales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h4 class="card-title text-lg">Informations patient</h4>
            <div class="space-y-2">
              <p><span class="font-semibold">Nom:</span> {{ call.patientFirstName }} {{ call.patientName }}</p>
              <p><span class="font-semibold">Téléphone:</span> {{ call.phoneNumber }}</p>
              <p><span class="font-semibold">Date de naissance:</span> {{ formatDate(call.patientBirthDate) }}</p>
              <p><span class="font-semibold">Médecin:</span> {{ call.doctorName }}</p>
              <p><span class="font-semibold">Service:</span> {{ call.service }}</p>
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h4 class="card-title text-lg">Détails de l'appel</h4>
            <div class="space-y-2">
              <p><span class="font-semibold">Date prévue:</span> {{ formatDate(call.scheduledCallDate) }}</p>
              <p v-if="call.actualCallDate"><span class="font-semibold">Date réelle:</span> {{ formatDate(call.actualCallDate) }}</p>
              <p v-if="call.callDuration"><span class="font-semibold">Durée:</span> {{ formatDuration(call.callDuration) }}</p>
              <p><span class="font-semibold">Statut:</span> 
                <span :class="getStatusBadgeClass(call.callStatus)" class="badge">
                  {{ getStatusText(call.callStatus) }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Score médical JADE -->
      <div v-if="call.jadeData" class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body">
          <div class="flex items-center justify-between mb-4">
            <h4 class="card-title text-lg">Score médical JADE</h4>
            <div class="flex items-center gap-2">
              <div class="radial-progress" :class="getScoreColor(call.medicalScore || 0)" 
                   :style="`--value:${call.medicalScore || 0}; --size:4rem;`">
                {{ call.medicalScore || 0 }}
              </div>
              <span class="text-sm text-gray-600">/ 100</span>
            </div>
          </div>
          
          <!-- Détail du score -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Douleur ({{ call.jadeData.douleur_niveau }}/10):</span>
                <span :class="call.jadeData.douleur_niveau > 5 ? 'text-red-600' : 'text-green-600'">
                  {{ call.jadeData.douleur_niveau > 5 ? '-20' : '0' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Traitement suivi:</span>
                <span :class="call.jadeData.traitement_suivi ? 'text-green-600' : 'text-red-600'">
                  {{ call.jadeData.traitement_suivi ? '0' : '-15' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Transit normal:</span>
                <span :class="call.jadeData.transit_normal ? 'text-green-600' : 'text-red-600'">
                  {{ call.jadeData.transit_normal ? '0' : '-10' }}
                </span>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Moral ({{ call.jadeData.moral_niveau }}/10):</span>
                <span :class="call.jadeData.moral_niveau < 5 ? 'text-red-600' : 'text-green-600'">
                  {{ call.jadeData.moral_niveau < 5 ? '-15' : '0' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Fièvre:</span>
                <span :class="call.jadeData.fievre ? 'text-red-600' : 'text-green-600'">
                  {{ call.jadeData.fievre ? '-20' : '0' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Urgences détectées:</span>
                <span :class="hasEmergencyKeywords ? 'text-red-600' : 'text-green-600'">
                  {{ hasEmergencyKeywords ? '-20' : '0' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Données structurées JADE -->
      <div v-if="call.jadeData" class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body">
          <h4 class="card-title text-lg mb-4">Données médicales collectées</h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Douleur -->
            <div class="space-y-3">
              <h5 class="font-semibold text-gray-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Douleur
              </h5>
              <div class="pl-7 space-y-1">
                <p><span class="font-medium">Niveau:</span> {{ call.jadeData.douleur_niveau }}/10</p>
                <p v-if="call.jadeData.douleur_localisation">
                  <span class="font-medium">Localisation:</span> {{ call.jadeData.douleur_localisation }}
                </p>
              </div>
            </div>

            <!-- Traitement -->
            <div class="space-y-3">
              <h5 class="font-semibold text-gray-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Traitement
              </h5>
              <div class="pl-7">
                <p>
                  <span class="font-medium">Suivi:</span> 
                  <span :class="call.jadeData.traitement_suivi ? 'text-green-600' : 'text-red-600'">
                    {{ call.jadeData.traitement_suivi ? 'Oui' : 'Non' }}
                  </span>
                </p>
              </div>
            </div>

            <!-- Transit -->
            <div class="space-y-3">
              <h5 class="font-semibold text-gray-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Transit
              </h5>
              <div class="pl-7 space-y-1">
                <p>
                  <span class="font-medium">Normal:</span> 
                  <span :class="call.jadeData.transit_normal ? 'text-green-600' : 'text-red-600'">
                    {{ call.jadeData.transit_normal ? 'Oui' : 'Non' }}
                  </span>
                </p>
                <p v-if="call.jadeData.probleme_transit">
                  <span class="font-medium">Problème:</span> {{ call.jadeData.probleme_transit }}
                </p>
              </div>
            </div>

            <!-- Moral -->
            <div class="space-y-3">
              <h5 class="font-semibold text-gray-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Moral
              </h5>
              <div class="pl-7 space-y-1">
                <p><span class="font-medium">Niveau:</span> {{ call.jadeData.moral_niveau }}/10</p>
                <p v-if="call.jadeData.moral_details">
                  <span class="font-medium">Détails:</span> {{ call.jadeData.moral_details }}
                </p>
              </div>
            </div>

            <!-- Fièvre -->
            <div class="space-y-3">
              <h5 class="font-semibold text-gray-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Fièvre
              </h5>
              <div class="pl-7 space-y-1">
                <p>
                  <span class="font-medium">Présente:</span> 
                  <span :class="call.jadeData.fievre ? 'text-red-600' : 'text-green-600'">
                    {{ call.jadeData.fievre ? 'Oui' : 'Non' }}
                  </span>
                </p>
                <p v-if="call.jadeData.fievre && call.jadeData.temperature">
                  <span class="font-medium">Température:</span> {{ call.jadeData.temperature }}°C
                </p>
              </div>
            </div>

            <!-- Autres plaintes -->
            <div class="space-y-3">
              <h5 class="font-semibold text-gray-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Autres plaintes
              </h5>
              <div class="pl-7">
                <p v-if="call.jadeData.autres_plaintes" class="text-gray-700">
                  {{ call.jadeData.autres_plaintes }}
                </p>
                <p v-else class="text-gray-500 italic">Aucune plainte supplémentaire</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transcript de l'appel -->
      <div v-if="call.transcript" class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body">
          <h4 class="card-title text-lg mb-4">Transcript de l'appel</h4>
          <div class="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
            <pre class="whitespace-pre-wrap text-sm text-gray-700">{{ call.transcript }}</pre>
          </div>
        </div>
      </div>

      <!-- Player audio -->
      <div v-if="call.audioFile" class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body">
          <h4 class="card-title text-lg mb-4">Enregistrement audio</h4>
          <audio controls class="w-full">
            <source :src="call.audioFile" type="audio/wav">
            Votre navigateur ne supporte pas l'élément audio.
          </audio>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button @click="exportToPDF" class="btn btn-primary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter en PDF
        </button>
        <button @click="reportIssue" class="btn btn-warning">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Signaler un problème
        </button>
        <button @click="$emit('close')" class="btn">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Call } from '../../stores/calls'

interface Props {
  call: Call | null
}

interface Emits {
  (e: 'close'): void
  (e: 'export-pdf', call: Call): void
  (e: 'report-issue', call: Call): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const hasEmergencyKeywords = computed(() => {
  if (!props.call?.jadeData?.autres_plaintes) return false
  
  const emergencyKeywords = ['urgence', 'ambulance', 'hôpital', 'douleur forte', 'sang', 'difficulté respiratoire']
  return emergencyKeywords.some(keyword => 
    props.call!.jadeData!.autres_plaintes.toLowerCase().includes(keyword)
  )
})

function formatDate(date: string) {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending': return 'badge-info'
    case 'in_progress': return 'badge-warning animate-pulse'
    case 'completed': return 'badge-success'
    case 'failed': return 'badge-error'
    default: return 'badge-info'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending': return 'À appeler'
    case 'in_progress': return 'En cours'
    case 'completed': return 'Appelé'
    case 'failed': return 'Échec'
    default: return status
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

function exportToPDF() {
  if (props.call) {
    emit('export-pdf', props.call)
  }
}

function reportIssue() {
  if (props.call) {
    emit('report-issue', props.call)
  }
}
</script>