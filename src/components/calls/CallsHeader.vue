<template>
  <div class="bg-white border-b shadow-sm">
    <div class="px-6 py-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <!-- Barre de recherche -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              v-model="localFilters.search"
              @input="updateFilters"
              type="text"
              placeholder="Rechercher par nom, prénom, téléphone..."
              class="input pl-10 w-full"
            />
          </div>
        </div>

        <!-- Filtres -->
        <div class="flex flex-wrap items-center gap-4">
          <!-- Filtre par statut -->
          <div class="min-w-[140px]">
            <select
              v-model="localFilters.status"
              @change="updateFilters"
              class="input"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">À appeler</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Appelé</option>
              <option value="failed">Échec</option>
            </select>
          </div>

          <!-- Filtre par site -->
          <div class="min-w-[140px]">
            <select
              v-model="localFilters.hospitalSite"
              @change="updateFilters"
              class="input"
            >
              <option value="">Tous les sites</option>
              <option value="Mons">Mons</option>
              <option value="Lille">Lille</option>
              <option value="Tournai">Tournai</option>
            </select>
          </div>

          <!-- Filtre par service -->
          <div class="min-w-[140px]">
            <select
              v-model="localFilters.service"
              @change="updateFilters"
              class="input"
            >
              <option value="">Tous les services</option>
              <option value="Cardiologie">Cardiologie</option>
              <option value="Chirurgie">Chirurgie</option>
              <option value="Médecine interne">Médecine interne</option>
              <option value="Pneumologie">Pneumologie</option>
            </select>
          </div>

          <!-- Filtre par date -->
          <div class="flex items-center space-x-2">
            <input
              v-model="localFilters.dateFrom"
              @change="updateFilters"
              type="date"
              class="input"
              placeholder="Date début"
            />
            <span class="text-gray-500">à</span>
            <input
              v-model="localFilters.dateTo"
              @change="updateFilters"
              type="date"
              class="input"
              placeholder="Date fin"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-2">
            <button
              @click="clearFilters"
              class="btn btn-secondary"
            >
              <X class="w-4 h-4 mr-2" />
              Effacer
            </button>
            
            <div class="relative">
              <button
                @click="toggleExportMenu"
                class="btn btn-primary"
              >
                <Download class="w-4 h-4 mr-2" />
                Exporter
              </button>
              
              <div
                v-if="showExportMenu"
                class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border"
              >
                <div class="py-1">
                  <button
                    @click="exportData('csv')"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileText class="w-4 h-4 inline mr-2" />
                    Export CSV
                  </button>
                  <button
                    @click="exportData('excel')"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileSpreadsheet class="w-4 h-4 inline mr-2" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Résumé des filtres actifs -->
      <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap gap-2">
        <span class="text-sm text-gray-600">Filtres actifs:</span>
        <span
          v-if="localFilters.search"
          class="badge badge-info"
        >
          Recherche: "{{ localFilters.search }}"
        </span>
        <span
          v-if="localFilters.status"
          class="badge badge-info"
        >
          Statut: {{ getStatusText(localFilters.status) }}
        </span>
        <span
          v-if="localFilters.hospitalSite"
          class="badge badge-info"
        >
          Site: {{ localFilters.hospitalSite }}
        </span>
        <span
          v-if="localFilters.service"
          class="badge badge-info"
        >
          Service: {{ localFilters.service }}
        </span>
        <span
          v-if="localFilters.dateFrom || localFilters.dateTo"
          class="badge badge-info"
        >
          Période: {{ formatDateRange() }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, X, Download, FileText, FileSpreadsheet } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { CallFilters } from '../../stores/calls'

interface Props {
  filters: CallFilters
}

interface Emits {
  (e: 'filter', filters: Partial<CallFilters>): void
  (e: 'export', format: 'csv' | 'excel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localFilters = ref<CallFilters>({ ...props.filters })
const showExportMenu = ref(false)

const hasActiveFilters = computed(() => {
  return !!(
    localFilters.value.search ||
    localFilters.value.status ||
    localFilters.value.hospitalSite ||
    localFilters.value.service ||
    localFilters.value.dateFrom ||
    localFilters.value.dateTo
  )
})

watch(() => props.filters, (newFilters) => {
  localFilters.value = { ...newFilters }
}, { deep: true })

function updateFilters() {
  emit('filter', localFilters.value)
}

function clearFilters() {
  localFilters.value = {
    search: '',
    dateFrom: undefined,
    dateTo: undefined,
    status: undefined,
    hospitalSite: undefined,
    service: undefined
  }
  updateFilters()
}

function toggleExportMenu() {
  showExportMenu.value = !showExportMenu.value
}

function exportData(format: 'csv' | 'excel') {
  emit('export', format)
  showExportMenu.value = false
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    pending: 'À appeler',
    in_progress: 'En cours',
    completed: 'Appelé',
    failed: 'Échec'
  }
  return statusMap[status] || status
}

function formatDateRange() {
  if (localFilters.value.dateFrom && localFilters.value.dateTo) {
    return `${format(new Date(localFilters.value.dateFrom), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(localFilters.value.dateTo), 'dd/MM/yyyy', { locale: fr })}`
  } else if (localFilters.value.dateFrom) {
    return `À partir du ${format(new Date(localFilters.value.dateFrom), 'dd/MM/yyyy', { locale: fr })}`
  } else if (localFilters.value.dateTo) {
    return `Jusqu'au ${format(new Date(localFilters.value.dateTo), 'dd/MM/yyyy', { locale: fr })}`
  }
  return ''
}

// Fermer le menu d'export en cliquant ailleurs
document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('.relative')) {
    showExportMenu.value = false
  }
})
</script>
