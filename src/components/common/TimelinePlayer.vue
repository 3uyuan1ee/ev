<script setup>
import { computed } from 'vue'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 2010 },
  max: { type: Number, default: 2025 },
  isPlaying: { type: Boolean, default: false },
  speed: { type: Number, default: 1 },
  label: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'play', 'pause', 'speed-change'])

const step = computed(() => 1)
const progress = computed(() => {
  if (props.max === props.min) return 0
  return ((props.modelValue - props.min) / (props.max - props.min)) * 100
})

function onSliderInput(e) {
  emit('update:modelValue', Number(e.target.value))
}

function togglePlay() {
  if (props.isPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

function goToStart() {
  emit('update:modelValue', props.min)
}

function goToEnd() {
  emit('update:modelValue', props.max)
}

function cycleSpeed() {
  const speeds = [0.5, 1, 2, 3]
  const idx = speeds.indexOf(props.speed)
  const next = speeds[(idx + 1) % speeds.length]
  emit('speed-change', next)
}
</script>

<template>
  <div class="timeline-player">
    <div class="timeline-header">
      <span v-if="label" class="timeline-label">{{ label }}</span>
      <span class="timeline-year">{{ modelValue }}</span>
    </div>

    <div class="timeline-controls">
      <button class="timeline-btn" @click="goToStart" title="Go to start">
        <SkipBack :size="16" />
      </button>
      <button class="timeline-btn timeline-btn-play" @click="togglePlay" :title="isPlaying ? 'Pause' : 'Play'">
        <Pause v-if="isPlaying" :size="18" />
        <Play v-else :size="18" />
      </button>
      <button class="timeline-btn" @click="goToEnd" title="Go to end">
        <SkipForward :size="16" />
      </button>

      <div class="timeline-slider-wrap">
        <input
          type="range"
          class="timeline-slider"
          :min="min"
          :max="max"
          :step="step"
          :value="modelValue"
          @input="onSliderInput"
        />
        <div class="timeline-progress" :style="{ width: progress + '%' }"></div>
      </div>

      <button class="timeline-btn timeline-speed" @click="cycleSpeed" title="Playback speed">
        {{ speed }}x
      </button>
    </div>
  </div>
</template>

<style scoped>
.timeline-player {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2);
}

.timeline-label {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.timeline-year {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-mono);
  color: var(--color-text-primary);
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.timeline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.timeline-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.timeline-btn-play {
  width: 38px;
  height: 38px;
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.timeline-btn-play:hover {
  opacity: 0.9;
  color: white;
}

.timeline-slider-wrap {
  flex: 1;
  position: relative;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  margin: 0 var(--space-2);
}

.timeline-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
  margin: 0;
}

.timeline-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  pointer-events: none;
}

.timeline-speed {
  font-size: var(--font-size-small);
  font-family: var(--font-mono);
  width: auto;
  padding: 0 8px;
}
</style>
