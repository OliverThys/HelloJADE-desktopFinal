import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/calls',
      name: 'Calls',
      component: () => import('../views/CallsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/patients',
      name: 'Patients',
      component: () => import('../views/PatientsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/monitoring',
      name: 'Monitoring',
      component: () => import('../views/MonitoringView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/test-calls',
      name: 'TestCalls',
      component: () => import('../views/TestCallsView.vue'),
      meta: { requiresAuth: false }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
