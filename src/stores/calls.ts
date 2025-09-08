import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface Call {
  id: string
  patientId: string
  patientNumber: string
  patientName: string
  patientFirstName: string
  patientBirthDate: string
  phoneNumber: string
  hospitalSite: string
  dischargeDate: string
  scheduledCallDate: string
  callStatus: 'pending' | 'in_progress' | 'completed' | 'failed'
  doctorName: string
  service: string
  actualCallDate?: string
  callDuration?: number
  callSummary?: string
  medicalScore?: number
  responses?: Record<string, any>
  recordingPath?: string
  attempts: number
  maxAttempts: number
  createdAt: string
  updatedAt: string
  // Données du dialogue JADE
  jadeData?: {
    patient_confirme: boolean
    identite_verifiee: boolean
    douleur_niveau: number
    douleur_localisation: string
    traitement_suivi: boolean
    transit_normal: boolean
    probleme_transit: string
    moral_niveau: number
    moral_details: string
    fievre: boolean
    temperature: number
    autres_plaintes: string
  }
  transcript?: string
  audioFile?: string
}

export interface CallFilters {
  search: string
  dateFrom?: string
  dateTo?: string
  status?: string
  hospitalSite?: string
  service?: string
}

export const useCallsStore = defineStore('calls', () => {
  const calls = ref<Call[]>([])
  const isLoading = ref(false)
  const filters = ref<CallFilters>({
    search: '',
    dateFrom: undefined,
    dateTo: undefined,
    status: undefined,
    hospitalSite: undefined,
    service: undefined
  })
  const selectedCall = ref<Call | null>(null)
  const activeCall = ref<Call | null>(null)

  const filteredCalls = computed(() => {
    let result = calls.value

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      result = result.filter(call => 
        call.patientName.toLowerCase().includes(search) ||
        call.patientFirstName.toLowerCase().includes(search) ||
        call.patientNumber.toLowerCase().includes(search) ||
        call.phoneNumber.includes(search) ||
        call.doctorName.toLowerCase().includes(search)
      )
    }

    if (filters.value.status) {
      result = result.filter(call => call.callStatus === filters.value.status)
    }

    if (filters.value.hospitalSite) {
      result = result.filter(call => call.hospitalSite === filters.value.hospitalSite)
    }

    if (filters.value.service) {
      result = result.filter(call => call.service === filters.value.service)
    }

    if (filters.value.dateFrom) {
      result = result.filter(call => 
        new Date(call.scheduledCallDate) >= new Date(filters.value.dateFrom!)
      )
    }

    if (filters.value.dateTo) {
      result = result.filter(call => 
        new Date(call.scheduledCallDate) <= new Date(filters.value.dateTo!)
      )
    }

    return result.sort((a, b) => 
      new Date(b.scheduledCallDate).getTime() - new Date(a.scheduledCallDate).getTime()
    )
  })

  const callsStats = computed(() => {
    const total = calls.value.length
    const pending = calls.value.filter(c => c.callStatus === 'pending').length
    const completed = calls.value.filter(c => c.callStatus === 'completed').length
    const failed = calls.value.filter(c => c.callStatus === 'failed').length
    const inProgress = calls.value.filter(c => c.callStatus === 'in_progress').length

    return {
      total,
      pending,
      completed,
      failed,
      inProgress,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  })

  function formatDate(date: string) {
    return format(parseISO(date), 'dd/MM/yyyy HH:mm', { locale: fr })
  }

  function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'pending':
        return 'badge-info'
      case 'in_progress':
        return 'badge-warning animate-pulse'
      case 'completed':
        return 'badge-success'
      case 'failed':
        return 'badge-danger'
      default:
        return 'badge-info'
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'pending':
        return 'À appeler'
      case 'in_progress':
        return 'En cours'
      case 'completed':
        return 'Appelé'
      case 'failed':
        return 'Échec'
      default:
        return status
    }
  }

  // Calcul du score médical JADE
  function calculateJadeScore(jadeData: Call['jadeData']): number {
    if (!jadeData) return 0

    let score = 100

    // Pénalités selon l'algorithme JADE
    if (jadeData.douleur_niveau > 5) score -= 20
    if (!jadeData.traitement_suivi) score -= 15
    if (!jadeData.transit_normal) score -= 10
    if (jadeData.moral_niveau < 5) score -= 15
    if (jadeData.fievre) score -= 20

    // Mots-clés d'urgence
    const emergencyKeywords = ['urgence', 'ambulance', 'hôpital', 'douleur forte', 'sang', 'difficulté respiratoire']
    if (jadeData.autres_plaintes) {
      const hasEmergency = emergencyKeywords.some(keyword => 
        jadeData!.autres_plaintes.toLowerCase().includes(keyword)
      )
      if (hasEmergency) score -= 20
    }

    return Math.max(0, score)
  }

  async function fetchCalls() {
    isLoading.value = true
    try {
      const response = await fetch('/api/calls')
      if (response.ok) {
        calls.value = await response.json()
      }
    } catch (error) {
      console.error('Erreur lors du chargement des appels:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function startCall(callId: string) {
    try {
      const response = await fetch(`/api/calls/${callId}/start`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchCalls()
        return true
      }
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'appel:', error)
    }
    return false
  }

  async function hangupCall(callId: string) {
    try {
      const response = await fetch(`/api/calls/${callId}/hangup`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchCalls()
        return true
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'appel:', error)
    }
    return false
  }

  async function retryCall(callId: string) {
    try {
      const response = await fetch(`/api/calls/${callId}/retry`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchCalls()
        return true
      }
    } catch (error) {
      console.error('Erreur lors de la relance:', error)
    }
    return false
  }

  function setFilters(newFilters: Partial<CallFilters>) {
    filters.value = { ...filters.value, ...newFilters }
  }

  function clearFilters() {
    filters.value = {
      search: '',
      dateFrom: undefined,
      dateTo: undefined,
      status: undefined,
      hospitalSite: undefined,
      service: undefined
    }
  }

  function selectCall(call: Call) {
    selectedCall.value = call
  }

  async function exportCalls(format: 'csv' | 'excel') {
    try {
      const response = await fetch('/api/calls/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          format, 
          filters: filters.value
        })
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `appels_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
    }
  }

  async function reportIssue(callId: string, issue: {
    category: string
    description: string
    severity: 'low' | 'medium' | 'high'
    email?: string
  }) {
    try {
      const response = await fetch('/api/calls/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          ...issue
        })
      })
      
      if (response.ok) {
        console.log('Problème signalé avec succès')
        return true
      }
    } catch (error) {
      console.error('Erreur lors du signalement:', error)
    }
    return false
  }

  return {
    calls,
    isLoading,
    filters,
    selectedCall,
    activeCall,
    filteredCalls,
    callsStats,
    formatDate,
    formatDuration,
    getStatusBadgeClass,
    getStatusText,
    calculateJadeScore,
    fetchCalls,
    startCall,
    hangupCall,
    retryCall,
    setFilters,
    clearFilters,
    selectCall,
    exportCalls,
    reportIssue
  }
})
