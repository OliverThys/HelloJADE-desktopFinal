<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Tableau de bord</h1>
            <p class="text-sm text-gray-600 mt-1">Vue d'ensemble de l'activité HelloJADE</p>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-500">
              Dernière mise à jour: {{ lastUpdate }}
            </div>
            <button 
              @click="refreshData"
              :disabled="isLoading"
              class="btn btn-secondary"
            >
              <RefreshCw :class="{ 'animate-spin': isLoading }" class="w-4 h-4 mr-2" />
              Actualiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistiques principales -->
    <div class="px-6 py-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Phone class="w-4 h-4 text-primary-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Appels aujourd'hui</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.todayCalls }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle class="w-4 h-4 text-success-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Taux de réussite</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.successRate }}%</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                <Clock class="w-4 h-4 text-warning-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">En attente</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.pendingCalls }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm border p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center">
                <AlertTriangle class="w-4 h-4 text-danger-600" />
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Urgences</p>
              <p class="text-2xl font-semibold text-gray-900">{{ stats.emergencies }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Graphiques et tableaux -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Graphique des appels -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Évolution des appels (7 derniers jours)</h3>
          <div class="h-64">
            <canvas ref="callsChart"></canvas>
          </div>
        </div>

        <!-- Répartition par site -->
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Répartition par site</h3>
          <div class="h-64">
            <canvas ref="sitesChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Appels récents et urgences -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Appels récents -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Appels récents</h3>
          </div>
          <div class="divide-y divide-gray-200">
            <div
              v-for="call in recentCalls"
              :key="call.id"
              class="px-6 py-4 hover:bg-gray-50"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User class="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">
                      {{ call.patientFirstName }} {{ call.patientName }}
                    </p>
                    <p class="text-sm text-gray-500">{{ call.hospitalSite }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="badge" :class="getStatusBadgeClass(call.callStatus)">
                    {{ getStatusText(call.callStatus) }}
                  </span>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ formatTime(call.actualCallDate || call.scheduledCallDate) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-3 bg-gray-50 border-t">
            <router-link
              to="/calls"
              class="text-sm text-primary-600 hover:text-primary-800 font-medium"
            >
              Voir tous les appels →
            </router-link>
          </div>
        </div>

        <!-- Alertes et urgences -->
        <div class="bg-white rounded-lg shadow-sm border">
          <div class="px-6 py-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Alertes et urgences</h3>
          </div>
          <div class="divide-y divide-gray-200">
            <div
              v-for="alert in alerts"
              :key="alert.id"
              class="px-6 py-4"
            >
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div 
                    class="w-2 h-2 rounded-full mt-2"
                    :class="getAlertColor(alert.type)"
                  ></div>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ alert.title }}</p>
                  <p class="text-sm text-gray-500">{{ alert.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatTime(alert.timestamp) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  Phone, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  RefreshCw 
} from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Chart, registerables } from 'chart.js'
import { useCallsStore } from '../stores/calls'

Chart.register(...registerables)

const callsStore = useCallsStore()

const isLoading = ref(false)
const callsChart = ref<HTMLCanvasElement>()
const sitesChart = ref<HTMLCanvasElement>()

const stats = ref({
  todayCalls: 0,
  successRate: 0,
  pendingCalls: 0,
  emergencies: 0
})

const recentCalls = ref([])
const alerts = ref([])

const lastUpdate = computed(() => {
  return format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })
})

onMounted(async () => {
  await loadDashboardData()
  await callsStore.fetchCalls()
  createCharts()
})

async function loadDashboardData() {
  isLoading.value = true
  try {
    // Simulation de données
    stats.value = {
      todayCalls: 24,
      successRate: 87,
      pendingCalls: 8,
      emergencies: 2
    }

    recentCalls.value = [
      {
        id: '1',
        patientFirstName: 'Marie',
        patientName: 'Dupont',
        hospitalSite: 'Mons',
        callStatus: 'completed',
        actualCallDate: new Date().toISOString()
      },
      {
        id: '2',
        patientFirstName: 'Jean',
        patientName: 'Martin',
        hospitalSite: 'Lille',
        callStatus: 'in_progress',
        scheduledCallDate: new Date().toISOString()
      }
    ]

    alerts.value = [
      {
        id: '1',
        type: 'emergency',
        title: 'Urgence détectée',
        message: 'Patient signalant des douleurs importantes',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'warning',
        title: 'Appel échoué',
        message: 'Impossible de joindre le patient après 3 tentatives',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  } finally {
    isLoading.value = false
  }
}

async function refreshData() {
  await loadDashboardData()
  await callsStore.fetchCalls()
}

function createCharts() {
  // Graphique des appels
  if (callsChart.value) {
    new Chart(callsChart.value, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Appels réussis',
          data: [12, 19, 15, 25, 22, 18, 24],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4
        }, {
          label: 'Appels échoués',
          data: [2, 3, 1, 4, 2, 1, 3],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }

  // Graphique des sites
  if (sitesChart.value) {
    new Chart(sitesChart.value, {
      type: 'doughnut',
      data: {
        labels: ['Mons', 'Lille', 'Tournai'],
        datasets: [{
          data: [45, 35, 20],
          backgroundColor: [
            'rgb(59, 130, 246)',
            'rgb(34, 197, 94)',
            'rgb(245, 158, 11)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    })
  }
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

function getAlertColor(type: string) {
  switch (type) {
    case 'emergency':
      return 'bg-danger-500'
    case 'warning':
      return 'bg-warning-500'
    case 'info':
      return 'bg-primary-500'
    default:
      return 'bg-gray-500'
  }
}

function formatTime(date: string) {
  return format(parseISO(date), 'HH:mm', { locale: fr })
}
</script>

<style scoped>
.dashboard {
  @apply min-h-screen bg-gray-50;
}
</style>
