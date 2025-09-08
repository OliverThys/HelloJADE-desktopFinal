import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'user' | 'nurse'
  hospitalId?: string
  permissions: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username: string, password: string) {
    try {
      // Simulation de connexion LDAP
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        throw new Error('Identifiants invalides')
      }

      const data = await response.json()
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      
      return true
    } catch (error) {
      console.error('Erreur de connexion:', error)
      throw error
    }
  }

  async function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  async function checkAuth() {
    if (!token.value) return false

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        user.value = data.user
        return true
      } else {
        await logout()
        return false
      }
    } catch (error) {
      console.error('Erreur de vérification auth:', error)
      await logout()
      return false
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    checkAuth
  }
})
