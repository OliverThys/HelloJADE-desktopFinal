import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const sidebarOpen = ref(true)
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'warning' | 'error' | 'info'
    title: string
    message: string
    timestamp: Date
  }>>([])

  const isDark = computed(() => theme.value === 'dark')

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value
  }

  function addNotification(notification: Omit<typeof notifications.value[0], 'id' | 'timestamp'>) {
    const id = Math.random().toString(36).substr(2, 9)
    notifications.value.push({
      ...notification,
      id,
      timestamp: new Date()
    })
  }

  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  function initialize() {
    // Initialisation de l'application
    console.log('HelloJADE initialisé')
  }

  return {
    isLoading,
    theme,
    sidebarOpen,
    notifications,
    isDark,
    setLoading,
    toggleTheme,
    toggleSidebar,
    addNotification,
    removeNotification,
    initialize
  }
})
