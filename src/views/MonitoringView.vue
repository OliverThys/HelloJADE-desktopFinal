<template>
  <div class="monitoring-page">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Monitoring Système</h1>
            <p class="text-sm text-gray-600 mt-1">Surveillance des services et performance</p>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 rounded-full" :class="systemStatus === 'healthy' ? 'bg-success-500' : 'bg-danger-500'"></div>
              <span class="text-sm font-medium" :class="systemStatus === 'healthy' ? 'text-success-600' : 'text-danger-600'">
                {{ systemStatus === 'healthy' ? 'Système opérationnel' : 'Problème détecté' }}
              </span>
            </div>
            <button 
              @click="refreshMonitoring"
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

    <!-- Contenu -->
    <div class="px-6 py-6">
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Statut des services</h2>
          <p class="text-gray-500">Fonctionnalité en cours de développement...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

const isLoading = ref(false)
const systemStatus = ref('healthy')

function refreshMonitoring() {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}
</script>

<style scoped>
.monitoring-page {
  @apply min-h-screen bg-gray-50;
}
</style>
