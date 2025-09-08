<template>
  <div class="calls-page">
    <!-- Header avec navigation -->
    <div class="bg-white shadow-sm border-b">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Appels Médicaux JADE</h1>
            <p class="text-sm text-gray-600 mt-1">Suivi des appels médicaux automatisés avec dialogue JADE</p>
          </div>
          <div class="flex items-center space-x-4">
            <CallStats :stats="callsStore.callsStats" />
            <button 
              @click="refreshCalls"
              :disabled="callsStore.isLoading"
              class="btn btn-secondary"
            >
              <RefreshCw :class="{ 'animate-spin': callsStore.isLoading }" class="w-4 h-4 mr-2" />
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtres et recherche -->
    <CallsHeader 
      :filters="callsStore.filters"
      @filter="handleFilter"
      @export="handleExport"
    />

    <!-- Tableau des appels -->
    <div class="px-6 py-4">
      <CallsTable 
        :calls="callsStore.filteredCalls"
        :loading="callsStore.isLoading"
        @view-summary="openSummary"
        @start-call="startCall"
        @hangup-call="hangupCall"
        @retry-call="retryCall"
        @report-issue="reportIssue"
      />
    </div>

    <!-- Modal résumé d'appel -->
    <CallSummaryModal 
      v-if="callsStore.selectedCall"
      :call="callsStore.selectedCall"
      @close="closeSummary"
    />

    <!-- Modal signalement problème -->
    <IssueReportModal 
      v-if="showIssueModal"
      :call="selectedCallForIssue"
      @close="closeIssueModal"
      @submit="submitIssue"
    />

    <!-- Indicateur d'appel en cours -->
    <CallInProgressIndicator 
      v-if="callsStore.activeCall"
      :call="callsStore.activeCall"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useCallsStore } from '../stores/calls'
import { useAppStore } from '../stores/app'
import { RefreshCw } from 'lucide-vue-next'
import CallsHeader from '../components/calls/CallsHeader.vue'
import CallsTable from '../components/calls/CallsTable.vue'
import CallStats from '../components/calls/CallStats.vue'
import CallSummaryModal from '../components/calls/CallSummaryModal.vue'
import IssueReportModal from '../components/calls/IssueReportModal.vue'
import CallInProgressIndicator from '../components/calls/CallInProgressIndicator.vue'
import type { Call, CallFilters } from '../stores/calls'

const callsStore = useCallsStore()
const appStore = useAppStore()

const showIssueModal = ref(false)
const selectedCallForIssue = ref<Call | null>(null)

onMounted(async () => {
  await callsStore.fetchCalls()
})

async function refreshCalls() {
  await callsStore.fetchCalls()
}

function handleFilter(filters: Partial<CallFilters>) {
  callsStore.setFilters(filters)
}

async function handleExport(format: 'csv' | 'excel') {
  try {
    const response = await fetch(`/api/calls/export?format=${format}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(callsStore.filters)
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appels_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      appStore.addNotification({
        type: 'success',
        title: 'Export réussi',
        message: `Fichier ${format.toUpperCase()} téléchargé avec succès`
      })
    }
  } catch (error) {
    appStore.addNotification({
      type: 'error',
      title: 'Erreur d\'export',
      message: 'Impossible d\'exporter les données'
    })
  }
}

function openSummary(call: Call) {
  callsStore.selectCall(call)
}

function closeSummary() {
  callsStore.selectCall(null as any)
}

async function startCall(call: Call) {
  const success = await callsStore.startCall(call.id)
  if (success) {
    appStore.addNotification({
      type: 'success',
      title: 'Appel démarré',
      message: `Appel vers ${call.patientFirstName} ${call.patientName} en cours`
    })
  } else {
    appStore.addNotification({
      type: 'error',
      title: 'Erreur',
      message: 'Impossible de démarrer l\'appel'
    })
  }
}

async function hangupCall(call: Call) {
  const success = await callsStore.hangupCall(call.id)
  if (success) {
    appStore.addNotification({
      type: 'success',
      title: 'Appel terminé',
      message: 'L\'appel a été raccroché'
    })
  }
}

async function retryCall(call: Call) {
  const success = await callsStore.retryCall(call.id)
  if (success) {
    appStore.addNotification({
      type: 'success',
      title: 'Relance programmée',
      message: 'L\'appel sera relancé automatiquement'
    })
  }
}

function reportIssue(call: Call) {
  selectedCallForIssue.value = call
  showIssueModal.value = true
}

function closeIssueModal() {
  showIssueModal.value = false
  selectedCallForIssue.value = null
}

async function submitIssue(issue: { category: string; description: string }) {
  try {
    const response = await fetch('/api/calls/issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        callId: selectedCallForIssue.value?.id,
        ...issue
      })
    })
    
    if (response.ok) {
      appStore.addNotification({
        type: 'success',
        title: 'Problème signalé',
        message: 'Votre signalement a été transmis à l\'équipe technique'
      })
      closeIssueModal()
    }
  } catch (error) {
    appStore.addNotification({
      type: 'error',
      title: 'Erreur',
      message: 'Impossible de signaler le problème'
    })
  }
}
</script>

<style scoped>
.calls-page {
  @apply min-h-screen bg-gray-50;
}
</style>
