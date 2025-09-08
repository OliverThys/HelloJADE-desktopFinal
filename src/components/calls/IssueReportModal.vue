<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-gray-900">
          Signaler un problème
        </h3>
        <button @click="$emit('close')" class="btn btn-sm btn-circle btn-ghost">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="submitIssue" class="space-y-6">
        <!-- Informations de l'appel -->
        <div class="card bg-base-100 shadow-sm">
          <div class="card-body">
            <h4 class="card-title text-lg">Appel concerné</h4>
            <div class="grid grid-cols-2 gap-4">
              <p><span class="font-semibold">Patient:</span> {{ call?.patientFirstName }} {{ call?.patientName }}</p>
              <p><span class="font-semibold">Date:</span> {{ formatDate(call?.scheduledCallDate || '') }}</p>
              <p><span class="font-semibold">Statut:</span> {{ getStatusText(call?.callStatus || '') }}</p>
              <p><span class="font-semibold">Score:</span> {{ call?.medicalScore || 'N/A' }}/100</p>
            </div>
          </div>
        </div>

        <!-- Catégorie du problème -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Catégorie du problème *</span>
          </label>
          <select v-model="issueForm.category" class="select select-bordered" required>
            <option value="">Sélectionner une catégorie</option>
            <option value="technical">Problème technique</option>
            <option value="audio">Qualité audio</option>
            <option value="transcription">Erreur de transcription</option>
            <option value="dialogue">Problème de dialogue</option>
            <option value="score">Erreur de score</option>
            <option value="data">Données manquantes</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <!-- Gravité -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Gravité *</span>
          </label>
          <div class="flex gap-4">
            <label class="label cursor-pointer">
              <input 
                v-model="issueForm.severity" 
                type="radio" 
                value="low" 
                class="radio radio-success" 
              />
              <span class="label-text ml-2">Faible</span>
            </label>
            <label class="label cursor-pointer">
              <input 
                v-model="issueForm.severity" 
                type="radio" 
                value="medium" 
                class="radio radio-warning" 
              />
              <span class="label-text ml-2">Moyenne</span>
            </label>
            <label class="label cursor-pointer">
              <input 
                v-model="issueForm.severity" 
                type="radio" 
                value="high" 
                class="radio radio-error" 
              />
              <span class="label-text ml-2">Élevée</span>
            </label>
          </div>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Description du problème *</span>
          </label>
          <textarea 
            v-model="issueForm.description"
            class="textarea textarea-bordered h-32" 
            placeholder="Décrivez le problème rencontré en détail..."
            required
          ></textarea>
        </div>

        <!-- Email de contact (optionnel) -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Email de contact (optionnel)</span>
          </label>
          <input 
            v-model="issueForm.email"
            type="email" 
            class="input input-bordered" 
            placeholder="votre.email@exemple.com"
          />
        </div>

        <!-- Informations système -->
        <div class="collapse collapse-arrow bg-base-200">
          <input type="checkbox" />
          <div class="collapse-title text-sm font-medium">
            Informations système (pour le support technique)
          </div>
          <div class="collapse-content">
            <div class="text-xs text-gray-600 space-y-1">
              <p><strong>ID Appel:</strong> {{ call?.id }}</p>
              <p><strong>Navigateur:</strong> {{ userAgent }}</p>
              <p><strong>Date:</strong> {{ new Date().toISOString() }}</p>
              <p><strong>Version:</strong> HelloJADE v2.0.0</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" @click="$emit('close')" class="btn btn-ghost">
            Annuler
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting" class="loading loading-spinner loading-sm mr-2"></span>
            {{ isSubmitting ? 'Envoi en cours...' : 'Signaler le problème' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Call } from '../../stores/calls'

interface Props {
  call: Call | null
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', issue: {
    callId: string
    category: string
    description: string
    severity: 'low' | 'medium' | 'high'
    email?: string
  }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isSubmitting = ref(false)

const issueForm = ref({
  category: '',
  description: '',
  severity: 'low' as 'low' | 'medium' | 'high',
  email: ''
})

const userAgent = computed(() => {
  return navigator.userAgent
})

function formatDate(date: string) {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
}

function getStatusText(status: string) {
  switch (status) {
    case 'pending': return 'À appeler'
    case 'in_progress': return 'En cours'
    case 'completed': return 'Appelé'
    case 'failed': return 'Échec'
    default: return status
  }
}

async function submitIssue() {
  if (!props.call) return

  isSubmitting.value = true

  try {
    const issue = {
      callId: props.call.id,
      category: issueForm.value.category,
      description: issueForm.value.description,
      severity: issueForm.value.severity,
      email: issueForm.value.email || undefined
    }

    emit('submit', issue)
    
    // Réinitialiser le formulaire
    issueForm.value = {
      category: '',
      description: '',
      severity: 'low',
      email: ''
    }
    
    emit('close')
  } catch (error) {
    console.error('Erreur lors du signalement:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>