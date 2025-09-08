<template>
  <div class="fixed top-4 right-4 z-50">
    <div class="bg-white rounded-lg shadow-lg p-4 border">
      <h3 class="font-semibold text-gray-900 mb-2">🧪 Tests</h3>
      <div class="space-y-2">
        <router-link
          to="/test-calls"
          class="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-center text-sm font-medium"
        >
          Test Appels JADE
        </router-link>
        <router-link
          to="/dashboard"
          class="block w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-center text-sm font-medium"
        >
          Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Composant de navigation simple pour les tests
</script>
