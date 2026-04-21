<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  title: { type: String, required: true },
  badge: { type: String, default: '' },
  defaultOpen: { type: Boolean, default: false },
  icon: { type: Object, default: null },
})

const isOpen = ref(props.defaultOpen)
const hasRendered = ref(props.defaultOpen)
const headerRef = ref(null)

function toggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    hasRendered.value = true
  }
}

// Lazy render: only render content after first open
const shouldRender = computed(() => hasRendered.value)
</script>

<template>
  <div class="collapsible-section" :class="{ 'is-open': isOpen }">
    <button
      ref="headerRef"
      class="collapsible-header"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span class="collapsible-header-left">
        <component :is="icon" v-if="icon" :size="18" class="collapsible-icon" />
        <span class="collapsible-title">{{ title }}</span>
        <span v-if="badge" class="collapsible-badge">{{ badge }}</span>
      </span>
      <ChevronDown :size="18" class="collapsible-chevron" />
    </button>

    <!-- Summary slot: always visible when collapsed -->
    <div v-if="!isOpen" class="collapsible-summary">
      <slot name="summary" />
    </div>

    <!-- Content: grid-template-rows animation -->
    <div class="collapsible-content-wrapper" :class="{ 'is-open': isOpen }">
      <div class="collapsible-content-inner">
        <div v-if="shouldRender" class="collapsible-content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collapsible-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  overflow: hidden;
  transition: box-shadow var(--duration-content) var(--ease-out);
}

.collapsible-section.is-open {
  box-shadow: var(--shadow-card);
}

/* Header button */
.collapsible-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-4) var(--space-5);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--color-text-primary);
  font-family: inherit;
  transition: background-color var(--duration-micro) ease;
}

.collapsible-header:hover {
  background-color: rgba(142, 141, 186, 0.04);
}

.collapsible-header:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: -2px;
  border-radius: var(--radius-lg);
}

.collapsible-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.collapsible-icon {
  flex-shrink: 0;
  color: var(--color-accent);
}

.collapsible-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  line-height: 1.4;
}

.collapsible-badge {
  font-size: var(--font-size-micro);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: rgba(142, 141, 186, 0.1);
  color: var(--color-info);
}

/* Chevron */
.collapsible-chevron {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform var(--duration-content) cubic-bezier(0.16, 1, 0.3, 1);
}

.is-open .collapsible-chevron {
  transform: rotate(180deg);
}

/* Summary: visible when collapsed */
.collapsible-summary {
  padding: 0 var(--space-5) var(--space-3);
  font-size: var(--font-size-small);
  color: var(--color-text-tertiary);
  line-height: var(--line-height-small);
}

/* Content wrapper: grid-template-rows animation */
.collapsible-content-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.collapsible-content-wrapper.is-open {
  grid-template-rows: 1fr;
}

.collapsible-content-inner {
  overflow: hidden;
}

.collapsible-content {
  padding: var(--space-3) var(--space-5) var(--space-5);
}

/* Dark mode adjustments */
:global([data-theme='dark']) .collapsible-header:hover {
  background-color: rgba(142, 141, 186, 0.08);
}

:global([data-theme='dark']) .collapsible-badge {
  background: rgba(142, 141, 186, 0.2);
}
</style>
