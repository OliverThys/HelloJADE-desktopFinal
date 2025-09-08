<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <div 
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out',
        appStore.sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="flex items-center justify-between h-16 px-6 border-b">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Heart class="w-5 h-5 text-white" />
          </div>
          <span class="text-xl font-bold text-gray-900">HelloJADE</span>
        </div>
        <button
          @click="appStore.toggleSidebar"
          class="text-gray-400 hover:text-gray-600"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <nav class="mt-6 px-3">
        <div class="space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              $route.path === item.href
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <component
              :is="item.icon"
              :class="[
                'mr-3 h-5 w-5 flex-shrink-0',
                $route.path === item.href ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
              ]"
            />
            {{ item.name }}
          </router-link>
        </div>
      </nav>

      <!-- User info -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User class="w-4 h-4 text-gray-600" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
            </p>
            <p class="text-xs text-gray-500 truncate">
              {{ authStore.user?.role }}
            </p>
          </div>
          <button
            @click="handleLogout"
            class="text-gray-400 hover:text-gray-600"
            title="Déconnexion"
          >
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Overlay pour mobile -->
    <div
      v-if="appStore.sidebarOpen"
      @click="appStore.toggleSidebar"
      class="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
    ></div>

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top bar -->
      <div class="sticky top-0 z-30 bg-white shadow-sm border-b">
        <div class="flex items-center justify-between h-16 px-6">
          <div class="flex items-center space-x-4">
            <button
              @click="appStore.toggleSidebar"
              class="text-gray-400 hover:text-gray-600 lg:hidden"
            >
              <Menu class="w-6 h-6" />
            </button>
            <h1 class="text-xl font-semibold text-gray-900">
              {{ currentPageTitle }}
            </h1>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Notifications -->
            <div class="relative">
              <button class="p-2 text-gray-400 hover:text-gray-600 relative">
                <Bell class="w-5 h-5" />
                <span v-if="unreadNotifications > 0" class="absolute -top-1 -right-1 w-3 h-3 bg-danger-500 rounded-full"></span>
              </button>
            </div>

            <!-- Theme toggle -->
            <button
              @click="appStore.toggleTheme"
              class="p-2 text-gray-400 hover:text-gray-600"
            >
              <Sun v-if="appStore.isDark" class="w-5 h-5" />
              <Moon v-else class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Page content -->
      <main class="flex-1">
        <RouterView />
      </main>
    </div>

    <!-- Notifications toast -->
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        v-for="notification in appStore.notifications"
        :key="notification.id"
        :class="[
          'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden',
          'transform transition-all duration-300 ease-in-out'
        ]"
      >
        <div class="p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <component
                :is="getNotificationIcon(notification.type)"
                :class="getNotificationIconClass(notification.type)"
              />
            </div>
            <div class="ml-3 w-0 flex-1 pt-0.5">
              <p class="text-sm font-medium text-gray-900">
                {{ notification.title }}
              </p>
              <p class="mt-1 text-sm text-gray-500">
                {{ notification.message }}
              </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
              <button
                @click="appStore.removeNotification(notification.id)"
                class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Heart, 
  X, 
  User, 
  LogOut, 
  Menu, 
  Bell, 
  Sun, 
  Moon,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info
} from 'lucide-vue-next'
import { useAppStore } from '../../stores/app'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: 'Home' },
  { name: 'Appels', href: '/calls', icon: 'Phone' },
  { name: 'Patients', href: '/patients', icon: 'Users' },
  { name: 'Monitoring', href: '/monitoring', icon: 'Activity' },
  { name: 'Administration', href: '/admin', icon: 'Settings' }
]

const currentPageTitle = computed(() => {
  const currentRoute = navigation.find(route => route.href === router.currentRoute.value.path)
  return currentRoute?.name || 'HelloJADE'
})

const unreadNotifications = computed(() => {
  return appStore.notifications.length
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return AlertTriangle
    case 'warning':
      return AlertCircle
    case 'info':
    default:
      return Info
  }
}

function getNotificationIconClass(type: string) {
  switch (type) {
    case 'success':
      return 'h-5 w-5 text-success-400'
    case 'error':
      return 'h-5 w-5 text-danger-400'
    case 'warning':
      return 'h-5 w-5 text-warning-400'
    case 'info':
    default:
      return 'h-5 w-5 text-primary-400'
  }
}
</script>

<style scoped>
.app-layout {
  @apply min-h-screen bg-gray-50;
}
</style>
