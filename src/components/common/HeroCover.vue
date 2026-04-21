<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from '@/i18n/useI18n'

const { locale } = useI18n()

const sentinelRef = ref(null)
const coverRef = ref(null)
const currentQuote = ref(-1)
const showScrollHint = ref(false)
const progress = ref(0) // 0 = cover fully visible, 1 = fully flipped

const quotes = [
  {
    text: '"Clean cars are too important to leave to the auto industry."',
    source: 'David Freeman',
    context: 'Who Killed the Electric Car? (2006)',
  },
  {
    text: '"After the funeral in 2006, nobody expected this: the electric car was back — and this time, it wasn\'t planning on dying again."',
    source: 'Chris Paine',
    context: 'Revenge of the Electric Car (2011)',
  },
  {
    text: '"Since 1902 no electric vehicle — regardless of its battery or propulsion system — has been able to compete effectively with its internal-combustion contemporaries."',
    source: 'David A. Kirsch',
    context: 'The Electric Vehicle and the Burden of History (2000)',
  },
  {
    text: '"In 1881, when the Parisian engineer Charles Jeantaud powered a light carriage with a storage battery, the "invention of the automobile" by Benz and Daimler still lay five years in the future."',
    source: 'Gijs Mom',
    context: 'The Electric Vehicle: Technology and Expectations in the Automobile Age (2005)',
  },
  {
    text: '"The revival of the electric car is a saga of adventure, of people fixated on oil-fueled cars seeking something cleaner, simpler, and cheaper."',
    source: 'John J. Fialka',
    context: 'Car Wars (2017)',
  },
  {
    text: '"电动化、智能化是汽车产业百年一遇之大变局的方向，它们分别代表换道竞赛的\'上半场\'和\'下半场\'。"',
    source: '苗圩',
    context: '《换道赛车：中国新能源汽车的崛起》（2024）',
  },
  {
    text: '"In major markets accounting for about 70% of new passenger car sales worldwide, battery electric vehicles already have much lower life-cycle greenhouse gas emissions than internal combustion engine vehicles."',
    source: 'Georg Bieker / ICCT',
    context: 'A Global Comparison of Life-cycle GHG Emissions (2021)',
  },
  {
    text: '"在当前阶段，传统内燃机车辆的总拥有成本普遍较低，但随着技术的不断进步，电池电动车和燃料电池电动车在未来可能会达到甚至超越传统车辆的经济水平。"',
    source: '卢利霞',
    context: '《新能源汽车与传统燃油汽车的生命周期成本评估》（2018）',
  },
  {
    text: '"For a used 3-year-old midsize SUV, the battery electric vehicle has the lowest total cost of ownership compared to all new and used conventional and hybrid vehicles."',
    source: 'Woody et al. 2026',
    context: 'Environmental Research Letters 21 024022',
  },
  {
    text: '"Battery electric vehicles with solar off-grid chargers will have lower costs well before 2040 in most countries and segments — financing is identified as the key action point."',
    source: 'Noll et al. 2026',
    context: 'Nature Energy',
  },
]

let timer = null
let quoteIndex = 0

function startSequence() {
  const SHOW_MS = 3500
  const GAP_MS = 600

  function showNext() {
    currentQuote.value = quoteIndex
    quoteIndex = (quoteIndex + 1) % quotes.length

    timer = setTimeout(() => {
      currentQuote.value = -1
      timer = setTimeout(showNext, GAP_MS)
    }, SHOW_MS)
  }

  timer = setTimeout(showNext, 1200)
}

// Progress drives the "page lift" effect
const coverTransform = computed(() => {
  const p = progress.value
  // Lift up and scale down slightly as user scrolls
  const translateY = p * -100 // move up by up to 100vh
  const scale = 1 - p * 0.15 // slight shrink
  const rotateX = p * -15 // subtle 3D tilt for depth
  return `translateY(${translateY}vh) scale(${scale}) rotateX(${rotateX}deg)`
})
const coverOpacity = computed(() => 1 - progress.value * 0.8)

function onScroll() {
  if (!sentinelRef.value) return
  const rect = sentinelRef.value.getBoundingClientRect()
  const vh = window.innerHeight
  // progress 0 → 1 as sentinel scrolls from visible to off-screen top
  const raw = -rect.top / vh
  progress.value = Math.max(0, Math.min(1, raw))
}

onMounted(() => {
  startSequence()
  setTimeout(() => {
    showScrollHint.value = true
  }, 2000)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <!-- Sentinel: invisible spacer that drives the scroll progress.
       It occupies 100vh so the user has exactly one viewport-height of scroll
       distance to fully flip the cover. -->
  <div ref="sentinelRef" class="cover-sentinel" />

  <!-- The actual cover: stays fixed over the viewport, flips based on scroll -->
  <div
    ref="coverRef"
    class="hero-cover"
    :style="{
      transform: coverTransform,
      opacity: coverOpacity,
      pointerEvents: progress > 0.95 ? 'none' : 'auto',
    }"
  >
    <div class="cover-dark" />

    <div class="cover-content">
      <h1 class="cover-title">
        <span class="title-line">The EV</span>
        <span class="title-line accent">Crossroads</span>
      </h1>
      <div class="quote-stage">
        <Transition name="quote" mode="out-in">
          <div v-if="currentQuote >= 0" :key="currentQuote" class="quote-card">
            <blockquote class="quote-text">{{ quotes[currentQuote].text }}</blockquote>
            <div class="quote-meta">
              <span class="quote-source">— {{ quotes[currentQuote].source }}</span>
              <span class="quote-context">{{ quotes[currentQuote].context }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <Transition name="hint">
      <div v-if="showScrollHint && progress < 0.1" class="scroll-hint">
        <span class="scroll-arrow">&#8595;</span>
        <span class="scroll-label">Scroll to explore</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Scroll spacer: 100vh so user scrolls through it to flip the cover */
.cover-sentinel {
  height: 100vh;
  width: 100%;
  pointer-events: none;
}

/* Fixed cover that flips up */
.hero-cover {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 100;
  transform-origin: center top;
  transition: none;
  will-change: transform, opacity;
}

/* Dark background layer */
.cover-dark {
  position: absolute;
  inset: 0;
  background: #1a1918;
  z-index: 0;
}

.cover-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 800px;
  padding: 0 var(--space-6);
}

/* Title */
.cover-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-bottom: var(--space-4);
}

.title-line {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 200;
  line-height: 1;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.08em;
  animation: titleIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.title-line.accent {
  color: var(--color-coral);
  font-weight: 700;
  letter-spacing: 0.04em;
  animation-delay: 0.2s;
}

.cover-subtitle {
  font-size: var(--font-size-body);
  color: rgba(255, 255, 255, 0.4);
  font-weight: 300;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-10);
  animation: titleIn 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
}

@keyframes titleIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Quote stage */
.quote-stage {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quote-card {
  max-width: 680px;
  padding: var(--space-5) var(--space-6);
  border-left: 2px solid var(--color-coral);
  background: rgba(255, 255, 255, 0.03);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}

.quote-text {
  font-size: var(--font-size-body);
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.7;
  font-style: italic;
  font-weight: 300;
  margin: 0 0 var(--space-3) 0;
}

.quote-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quote-source {
  font-size: var(--font-size-small);
  color: var(--color-coral);
  font-weight: 500;
}

.quote-context {
  font-size: var(--font-size-caption);
  color: rgba(255, 255, 255, 0.3);
}

/* Quote transition */
.quote-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.quote-leave-active {
  transition: all 0.4s cubic-bezier(0.7, 0, 0.84, 0);
}
.quote-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.quote-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Scroll hint at bottom of cover */
.scroll-hint {
  position: absolute;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  animation: float 2.5s ease-in-out infinite;
  z-index: 2;
}

.scroll-arrow {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.25);
}

.scroll-label {
  font-size: var(--font-size-caption);
  color: rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(8px); }
}

.hint-enter-active {
  transition: opacity 0.8s ease;
}
.hint-enter-from {
  opacity: 0;
}

/* Responsive */
@media (max-width: 640px) {
  .title-line {
    font-size: clamp(2.2rem, 10vw, 3.5rem);
  }

  .quote-card {
    padding: var(--space-4);
  }

  .quote-text {
    font-size: var(--font-size-small);
  }

  .quote-stage {
    min-height: 200px;
  }
}
</style>
