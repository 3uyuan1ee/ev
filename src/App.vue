<script setup>
import { defineAsyncComponent } from 'vue'
import { useActiveAct } from '@/composables/useActiveAct'
import { useI18n } from '@/i18n/useI18n'
import ProgressTracker from '@/components/common/ProgressTracker.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import LangToggle from '@/components/common/LangToggle.vue'
import ScenarioBoard from '@/components/common/ScenarioBoard.vue'
import HeroCover from '@/components/common/HeroCover.vue'

// Lazy-load act sections for code splitting
const Act1Section = defineAsyncComponent(() => import('@/components/act1/Act1Section.vue'))
const Act2Section = defineAsyncComponent(() => import('@/components/act2/Act2Section.vue'))
const Act3Section = defineAsyncComponent(() => import('@/components/act3/Act3Section.vue'))
const Act4Section = defineAsyncComponent(() => import('@/components/act4/Act4Section.vue'))

const { activeAct, setRef, scrollToAct } = useActiveAct()
const { t } = useI18n()
</script>

<template>
  <ProgressTracker
    :active-act="activeAct"
    @navigate="scrollToAct"
  />
  <ThemeToggle class="theme-toggle-btn" />
  <LangToggle class="lang-toggle-btn" />
  <ScenarioBoard />

  <!-- Hero Cover -->
  <HeroCover />

  <!-- Act 1 -->
  <section :ref="setRef(0)" id="act-1" class="act-section" :aria-label="t('app.ariaAct1')">
    <div class="act-header">
      <div class="section-inner">
        <span class="act-number act-1" aria-hidden="true">{{ t('app.act1Number') }}</span>
        <h2>{{ t('app.act1Title') }}</h2>
        <p class="act-subtitle">{{ t('app.act1Subtitle') }}</p>
      </div>
    </div>
    <Act1Section />
  </section>

  <!-- Act 2 -->
  <section :ref="setRef(1)" id="act-2" class="act-section" :aria-label="t('app.ariaAct2')">
    <div class="act-header">
      <div class="section-inner">
        <span class="act-number act-2" aria-hidden="true">{{ t('app.act2Number') }}</span>
        <h2>{{ t('app.act2Title') }}</h2>
        <p class="act-subtitle">{{ t('app.act2Subtitle') }}</p>
      </div>
    </div>
    <Act2Section />
  </section>

  <!-- Act 3 -->
  <section :ref="setRef(2)" id="act-3" class="act-section" :aria-label="t('app.ariaAct3')">
    <div class="act-header">
      <div class="section-inner">
        <span class="act-number act-3" aria-hidden="true">{{ t('app.act3Number') }}</span>
        <h2>{{ t('app.act3Title') }}</h2>
        <p class="act-subtitle">{{ t('app.act3Subtitle') }}</p>
      </div>
    </div>
    <Act3Section />
  </section>

  <!-- Act 4 -->
  <section :ref="setRef(3)" id="act-4" class="act-section" :aria-label="t('app.ariaAct4')">
    <div class="act-header">
      <div class="section-inner">
        <span class="act-number act-4" aria-hidden="true">{{ t('app.act4Number') }}</span>
        <h2>{{ t('app.act4Title') }}</h2>
        <p class="act-subtitle">{{ t('app.act4Subtitle') }}</p>
      </div>
    </div>
    <Act4Section />
  </section>

  <!-- Footer -->
  <footer class="footer-section" role="contentinfo">
    <div class="section-inner">
      <div class="footer-grid">
        <div class="footer-col">
          <h3 class="footer-heading">{{ t('app.footerHeading') }}</h3>
          <p class="footer-text">
            {{ t('app.footerText') }}
          </p>
        </div>
        <div class="footer-col">
          <h3 class="footer-heading">{{ t('app.footerDataSources') }}</h3>
          <ul class="footer-list">
            <li>{{ t('app.footerDataSource1') }}</li>
            <li>{{ t('app.footerDataSource2') }}</li>
            <li>{{ t('app.footerDataSource3') }}</li>
            <li>{{ t('app.footerDataSource4') }}</li>
          </ul>
        </div>
        <div class="footer-col">
          <h3 class="footer-heading">{{ t('app.footerMethodology') }}</h3>
          <ul class="footer-list">
            <li>{{ t('app.footerMethod1') }}</li>
            <li>{{ t('app.footerMethod2') }}</li>
            <li>{{ t('app.footerMethod3') }}</li>
            <li>{{ t('app.footerMethod4') }}</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="text-caption">
          {{ t('app.footerBottom') }}
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.theme-toggle-btn {
  position: fixed;
  top: var(--space-3);
  right: var(--space-4);
  z-index: var(--z-progress);
}

.lang-toggle-btn {
  position: fixed;
  top: var(--space-3);
  right: calc(var(--space-4) + 44px);
  z-index: var(--z-progress);
}

.footer-section {
  padding: var(--space-10) 0 var(--space-6);
  border-top: 1px solid var(--color-border);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

@media (min-width: 768px) {
  .footer-grid {
    grid-template-columns: 2fr 1fr 1fr;
  }
}

.footer-heading {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.footer-text {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.footer-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-list li {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
  padding: 2px 0;
  position: relative;
  padding-left: 12px;
}

.footer-list li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: var(--color-text-tertiary);
}

.footer-bottom {
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  text-align: center;
}
</style>
