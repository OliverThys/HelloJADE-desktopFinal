<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <TestNavigation />
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from './stores/app'
import TestNavigation from './components/TestNavigation.vue'

const appStore = useAppStore()

onMounted(() => {
  appStore.initialize()
})
</script>
