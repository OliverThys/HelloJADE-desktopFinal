<template>
  <div class="fixed bottom-4 right-4 z-50">
    <div class="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
      <div class="flex items-center space-x-3">
        <!-- Indicateur d'appel -->
        <div class="relative">
          <div class="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
            <Phone class="w-6 h-6 text-success-600" />
          </div>
          <div class="absolute -top-1 -right-1 w-4 h-4 bg-success-500 rounded-full animate-pulse"></div>
        </div>

        <!-- Informations de l'appel -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">
            Appel en cours
          </p>
          <p class="text-sm text-gray-500 truncate">
            {{ call.patientFirstName }} {{ call.patientName }}
          </p>
          <p class="text-xs text-gray-400">
            {{ formatDuration(elapsedTime) }}
          </p>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-2">
          <button
            @click="toggleMute"
            :class="[
              'p-2 rounded-full transition-colors',
              isMuted ? 'bg-danger-100 text-danger-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            ]"
            :title="isMuted ? 'Activer le micro' : 'Couper le micro'"
          >
            <Mic v-if="!isMuted" class="w-4 h-4" />
            <MicOff v-else class="w-4 h-4" />
          </button>

          <button
            @click="hangupCall"
            class="p-2 bg-danger-100 text-danger-600 rounded-full hover:bg-danger-200 transition-colors"
            title="Raccrocher"
          >
            <PhoneOff class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Barre de progression du dialogue -->
      <div class="mt-3">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progression du dialogue</span>
          <span>{{ currentStep }}/{{ totalSteps }}</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-primary-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- État actuel du dialogue -->
      <div class="mt-3 text-xs text-gray-600">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
          <span>{{ currentDialogueState }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Phone, PhoneOff, Mic, MicOff } from 'lucide-vue-next'
import type { Call } from '../../stores/calls'

interface Props {
  call: Call
}

interface Emits {
  (e: 'hangup'): void
  (e: 'mute', muted: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const elapsedTime = ref(0)
const isMuted = ref(false)
const currentStep = ref(1)
const totalSteps = ref(6)
const currentDialogueState = ref('Vérification d\'identité...')

let timer: NodeJS.Timeout | null = null

const dialogueSteps = [
  'Vérification d\'identité...',
  'Questions sur la douleur...',
  'Vérification du traitement...',
  'Questions sur le transit...',
  'Évaluation du moral...',
  'Questions sur la fièvre...',
  'Finalisation...'
]

onMounted(() => {
  // Démarrer le timer
  timer = setInterval(() => {
    elapsedTime.value++
  }, 1000)

  // Simuler la progression du dialogue
  simulateDialogue()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function toggleMute() {
  isMuted.value = !isMuted.value
  emit('mute', isMuted.value)
}

function hangupCall() {
  emit('hangup')
}

function simulateDialogue() {
  let stepIndex = 0
  
  const stepInterval = setInterval(() => {
    if (stepIndex < dialogueSteps.length - 1) {
      stepIndex++
      currentStep.value = stepIndex + 1
      currentDialogueState.value = dialogueSteps[stepIndex]
    } else {
      clearInterval(stepInterval)
    }
  }, 10000) // Chaque étape dure 10 secondes
}
</script>
