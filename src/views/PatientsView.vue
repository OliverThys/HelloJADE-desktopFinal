<template>
  <div class="patients-page">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Gestion des Patients</h1>
            <p class="text-sm text-gray-600 mt-1">Dossiers patients et historique des appels</p>
          </div>
          <div class="flex items-center space-x-4">
            <button class="btn btn-primary">
              <Plus class="w-4 h-4 mr-2" />
              Nouveau patient
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu -->
    <div class="px-6 py-6">
      <div class="bg-white rounded-lg shadow-sm border">
        <div class="p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Liste des patients</h2>
          <p class="text-gray-500">Fonctionnalité en cours de développement...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
</script>

<style scoped>
.patients-page {
  @apply min-h-screen bg-gray-50;
}
</style>
