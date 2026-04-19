<script setup>
import { defineAsyncComponent } from 'vue'
import { useActiveAct } from '@/composables/useActiveAct'
import ProgressTracker from '@/components/common/ProgressTracker.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import ScenarioBoard from '@/components/common/ScenarioBoard.vue'

// Lazy-load act sections for code splitting
const Act1Section = defineAsyncComponent(() => import('@/components/act1/Act1Section.vue'))
const Act2Section = defineAsyncComponent(() => import('@/components/act2/Act2Section.vue'))
const Act3Section = defineAsyncComponent(() => import('@/components/act3/Act3Section.vue'))
const Act4Section = defineAsyncComponent(() => import('@/components/act4/Act4Section.vue'))

const { activeAct, setRef, scrollToAct } = useActiveAct()
</script>

<template>
  <ProgressTracker
    :active-act="activeAct"
    @navigate="scrollToAct"
  />
  <ThemeToggle class="theme-toggle-btn" />
  <ScenarioBoard />

  <!-- Hero / Title -->
  <header class="hero-section" role="banner">
    <div class="section-inner">
      <h1 class="hero-title">电动化十字路口</h1>
      <p class="hero-subtitle">
        电动车 vs 燃油车：成本、产业、政策、环保——四维数据驱动的交互式探索
      </p>
    </div>
  </header>

  <!-- Act 1 -->
  <section :ref="setRef(0)" id="act-1" class="act-section" aria-label="Act 1: TCO Calculator">
    <div class="act-header">
      <div class="section-inner">
        <span class="act-number act-1" aria-hidden="true">第一幕</span>
        <h2>电动车真的便宜吗？</h2>
        <p class="act-subtitle">从总拥有成本的视角，算清电动车和燃油车的经济账</p>
      </div>
    </div>
    <Act1Section />
  </section>

  <!-- Act 2 -->
  <section :ref="setRef(1)" id="act-2" class="act-section" aria-label="Act 2: Battery and Market">
    <div class="act-header">
      <div class="section-inner">
        <span class="act-number act-2" aria-hidden="true">第二幕</span>
        <h2>电池和研发如何重塑产业？</h2>
        <p class="act-subtitle">电池成本下降、市场竞争格局与中国市场结构变迁</p>
      </div>
    </div>
    <Act2Section />
  </section>

  <!-- Act 3 -->
  <section :ref="setRef(2)" id="act-3" class="act-section" aria-label="Act 3: Policy Explorer">
    <div class="act-header">
      <div class="section-inner">
        <span class="act-number act-3" aria-hidden="true">第三幕</span>
        <h2>谁在推动，谁在阻碍？</h2>
        <p class="act-subtitle">全球政策力度、市场渗透率与基础设施的博弈</p>
      </div>
    </div>
    <Act3Section />
  </section>

  <!-- Act 4 -->
  <section :ref="setRef(3)" id="act-4" class="act-section" aria-label="Act 4: Carbon Race">
    <div class="act-header">
      <div class="section-inner">
        <span class="act-number act-4" aria-hidden="true">第四幕</span>
        <h2>蓝天之下，谁更干净？</h2>
        <p class="act-subtitle">全生命周期碳排放对比——从电池制造到上路行驶</p>
      </div>
    </div>
    <Act4Section />
  </section>

  <!-- Footer -->
  <footer class="footer-section" role="contentinfo">
    <div class="section-inner">
      <div class="footer-grid">
        <div class="footer-col">
          <h3 class="footer-heading">电动化十字路口</h3>
          <p class="footer-text">
            一个关于全球电动汽车 vs 燃油车的交互式数据文档项目。
            通过四幕结构，从经济、产业、政策、环保四个维度探索电动化的真相。
          </p>
        </div>
        <div class="footer-col">
          <h3 class="footer-heading">数据来源</h3>
          <ul class="footer-list">
            <li>IEA Global EV Data Explorer 2025</li>
            <li>Woody et al. 2026 — Lifecycle Emissions</li>
            <li>Washington State Dept. of Transportation</li>
            <li>World Bank Open Data</li>
          </ul>
        </div>
        <div class="footer-col">
          <h3 class="footer-heading">方法论</h3>
          <ul class="footer-list">
            <li>TCO 模型：逐年累积折旧 + 城市加权能源成本</li>
            <li>电池预测：指数衰减模型 (R²=0.96)</li>
            <li>政策沙盘：OLS 多元线性回归 (R²=0.65, n=400)</li>
            <li>碳排竞速：Woody 2026 全生命周期参数</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p class="text-caption">
          Built with Vue 3 + ECharts + D3.js | Data as of April 2026
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

.hero-section {
  padding-top: calc(60px + var(--space-12));
  padding-bottom: var(--space-10);
  text-align: center;
}

.hero-title {
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-display);
  margin-bottom: var(--space-4);
  color: var(--color-primary);
}

.hero-subtitle {
  font-size: var(--font-size-h3);
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: var(--line-height-h3);
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
