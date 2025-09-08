<template>
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
    <div class="bg-white rounded-lg p-4 shadow-sm border">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <Phone class="w-4 h-4 text-primary-600" />
          </div>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-500">Total</p>
          <p class="text-2xl font-semibold text-gray-900">{{ stats.total }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg p-4 shadow-sm border">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock class="w-4 h-4 text-blue-600" />
          </div>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-500">En attente</p>
          <p class="text-2xl font-semibold text-gray-900">{{ stats.pending }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg p-4 shadow-sm border">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Activity class="w-4 h-4 text-orange-600 animate-pulse" />
          </div>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-500">En cours</p>
          <p class="text-2xl font-semibold text-gray-900">{{ stats.inProgress }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg p-4 shadow-sm border">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
            <CheckCircle class="w-4 h-4 text-success-600" />
          </div>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-500">Réussis</p>
          <p class="text-2xl font-semibold text-gray-900">{{ stats.completed }}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg p-4 shadow-sm border">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-danger-100 rounded-full flex items-center justify-center">
            <XCircle class="w-4 h-4 text-danger-600" />
          </div>
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-gray-500">Échecs</p>
          <p class="text-2xl font-semibold text-gray-900">{{ stats.failed }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Taux de réussite -->
  <div class="mt-4 bg-white rounded-lg p-4 shadow-sm border">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-500">Taux de réussite</p>
        <p class="text-2xl font-semibold text-gray-900">{{ stats.successRate }}%</p>
      </div>
      <div class="flex-1 ml-4">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="h-2 rounded-full transition-all duration-300"
            :class="getSuccessRateColor(stats.successRate)"
            :style="{ width: `${stats.successRate}%` }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Phone, Clock, Activity, CheckCircle, XCircle } from 'lucide-vue-next'

interface Props {
  stats: {
    total: number
    pending: number
    completed: number
    failed: number
    inProgress: number
    successRate: number
  }
}

defineProps<Props>()

function getSuccessRateColor(rate: number) {
  if (rate >= 80) return 'bg-success-500'
  if (rate >= 60) return 'bg-warning-500'
  return 'bg-danger-500'
}
</script>
