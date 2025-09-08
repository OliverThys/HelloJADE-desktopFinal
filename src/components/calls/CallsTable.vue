<template>
  <div class="card">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Patient
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Hospitalisation
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Appel
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Score JADE
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Résumé
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading" class="animate-pulse">
            <td colspan="7" class="px-6 py-12 text-center">
              <div class="flex items-center justify-center">
                <Loader2 class="w-6 h-6 animate-spin mr-2" />
                Chargement des appels...
              </div>
            </td>
          </tr>
          
          <tr v-else-if="calls.length === 0" class="text-center">
            <td colspan="7" class="px-6 py-12 text-gray-500">
              <PhoneOff class="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p class="text-lg font-medium">Aucun appel trouvé</p>
              <p class="text-sm">Ajustez vos filtres pour voir plus de résultats</p>
            </td>
          </tr>

          <tr
            v-else
            v-for="call in calls"
            :key="call.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <!-- Patient -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="flex-shrink-0 h-10 w-10">
                  <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User class="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">
                    {{ call.patientFirstName }} {{ call.patientName }}
                  </div>
                  <div class="text-sm text-gray-500">
                    N° {{ call.patientNumber }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ formatDate(call.patientBirthDate) }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Contact -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                <Phone class="w-4 h-4 inline mr-1" />
                {{ call.phoneNumber }}
              </div>
            </td>

            <!-- Hospitalisation -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">{{ call.hospitalSite }}</div>
              <div class="text-sm text-gray-500">{{ call.service }}</div>
              <div class="text-xs text-gray-400">
                Sortie: {{ formatDate(call.dischargeDate) }}
              </div>
              <div class="text-xs text-gray-400">
                Dr. {{ call.doctorName }}
              </div>
            </td>

            <!-- Appel -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex flex-col space-y-1">
                <span class="badge" :class="getStatusBadgeClass(call.callStatus)">
                  {{ getStatusText(call.callStatus) }}
                </span>
                <div class="text-sm text-gray-900">
                  Prévu: {{ formatDate(call.scheduledCallDate) }}
                </div>
                <div v-if="call.actualCallDate" class="text-sm text-gray-500">
                  Réel: {{ formatDate(call.actualCallDate) }}
                </div>
                <div v-if="call.callDuration" class="text-sm text-gray-500">
                  Durée: {{ formatDuration(call.callDuration) }}
                </div>
                <div v-if="call.attempts > 0" class="text-xs text-gray-400">
                  Tentatives: {{ call.attempts }}/{{ call.maxAttempts }}
                </div>
              </div>
            </td>

            <!-- Score JADE -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div v-if="call.medicalScore !== undefined" class="flex items-center">
                <div class="flex items-center">
                  <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      class="h-2 rounded-full"
                      :class="getScoreColor(call.medicalScore)"
                      :style="{ width: `${call.medicalScore}%` }"
                    ></div>
                  </div>
                  <span class="text-sm font-medium">{{ call.medicalScore }}/100</span>
                </div>
              </div>
              <div v-else class="text-gray-400 text-sm">-</div>
            </td>

            <!-- Résumé -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex flex-col space-y-1">
                <button
                  v-if="call.jadeData || call.transcript"
                  @click="$emit('view-summary', call)"
                  class="text-primary-600 hover:text-primary-800 text-sm flex items-center"
                >
                  <FileText class="w-4 h-4 mr-1" />
                  Voir résumé
                </button>
                <button
                  v-if="call.audioFile"
                  @click="playRecording(call)"
                  class="text-primary-600 hover:text-primary-800 text-sm flex items-center"
                >
                  <Play class="w-4 h-4 mr-1" />
                  Écouter
                </button>
                <div v-if="!call.jadeData && !call.transcript && !call.audioFile" class="text-gray-400 text-sm">
                  -
                </div>
              </div>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex items-center space-x-2">
                <button
                  v-if="call.callStatus === 'pending'"
                  @click="$emit('start-call', call)"
                  class="text-success-600 hover:text-success-900"
                  title="Démarrer l'appel"
                >
                  <Phone class="w-4 h-4" />
                </button>
                
                <button
                  v-if="call.callStatus === 'in_progress'"
                  @click="$emit('hangup-call', call)"
                  class="text-danger-600 hover:text-danger-900"
                  title="Raccrocher"
                >
                  <PhoneOff class="w-4 h-4" />
                </button>
                
                <button
                  v-if="call.callStatus === 'failed' && call.attempts < call.maxAttempts"
                  @click="$emit('retry-call', call)"
                  class="text-warning-600 hover:text-warning-900"
                  title="Relancer l'appel"
                >
                  <RotateCcw class="w-4 h-4" />
                </button>
                
                <button
                  @click="$emit('report-issue', call)"
                  class="text-gray-600 hover:text-gray-900"
                  title="Signaler un problème"
                >
                  <AlertTriangle class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="calls.length > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div class="flex-1 flex justify-between sm:hidden">
        <button class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Précédent
        </button>
        <button class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Suivant
        </button>
      </div>
      <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Affichage de <span class="font-medium">1</span> à <span class="font-medium">{{ calls.length }}</span>
            sur <span class="font-medium">{{ calls.length }}</span> résultats
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Phone, 
  PhoneOff, 
  User, 
  FileText, 
  Play, 
  RotateCcw, 
  AlertTriangle,
  Loader2
} from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Call } from '../../stores/calls'

interface Props {
  calls: Call[]
  loading: boolean
}

interface Emits {
  (e: 'view-summary', call: Call): void
  (e: 'start-call', call: Call): void
  (e: 'hangup-call', call: Call): void
  (e: 'retry-call', call: Call): void
  (e: 'report-issue', call: Call): void
}

defineProps<Props>()
defineEmits<Emits>()

function formatDate(date: string) {
  return format(parseISO(date), 'dd/MM/yyyy', { locale: fr })
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'pending':
      return 'badge-info'
    case 'in_progress':
      return 'badge-warning animate-pulse'
    case 'completed':
      return 'badge-success'
    case 'failed':
      return 'badge-danger'
    default:
      return 'badge-info'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending':
      return 'À appeler'
    case 'in_progress':
      return 'En cours'
    case 'completed':
      return 'Appelé'
    case 'failed':
      return 'Échec'
    default:
      return status
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-success-500'
  if (score >= 60) return 'bg-warning-500'
  return 'bg-danger-500'
}

function playRecording(call: Call) {
  // Implémentation de la lecture audio
  console.log('Lecture de l\'enregistrement:', call.recordingPath)
}
</script>
