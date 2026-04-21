<script setup>
defineProps({
  survey: { type: Object, required: true },
  getLabel: { type: Function, required: true },
  getQuestion: { type: Function, required: true },
})
</script>

<template>
  <div class="survey-results">
    <p class="results-question">{{ getQuestion(survey) }}</p>
    <div class="results-list">
      <div v-for="opt in survey.options" :key="opt.id" class="result-row">
        <div class="result-header">
          <span class="result-label">{{ getLabel(opt) }}</span>
          <span class="result-stat">
            <span class="result-count">{{ opt.voteCount }}</span>
            <span class="result-pct">
              {{ survey.totalVotes ? ((opt.voteCount / survey.totalVotes) * 100).toFixed(0) : 0 }}%
            </span>
          </span>
        </div>
        <div class="result-bar-track">
          <div
            class="result-bar-fill"
            :style="{
              width: survey.totalVotes ? `${(opt.voteCount / survey.totalVotes) * 100}%` : '0%'
            }"
          />
        </div>
      </div>
    </div>
    <p class="results-total">
      {{ survey.totalVotes }} {{ $locale === 'zh' ? '人参与' : 'votes' }}
    </p>
  </div>
</template>

<style scoped>
.survey-results {
  width: 100%;
}

.results-question {
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-semibold);
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--space-3);
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.result-row {
  width: 100%;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
}

.result-label {
  font-size: var(--font-size-small);
  color: rgba(255, 255, 255, 0.7);
}

.result-stat {
  display: flex;
  gap: var(--space-2);
  align-items: baseline;
}

.result-count {
  font-family: var(--font-mono);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  color: var(--color-coral);
}

.result-pct {
  font-size: var(--font-size-caption);
  color: rgba(255, 255, 255, 0.4);
  min-width: 32px;
  text-align: right;
}

.result-bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.result-bar-fill {
  height: 100%;
  background: var(--color-coral);
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 0;
}

.results-total {
  margin-top: var(--space-3);
  font-size: var(--font-size-caption);
  color: rgba(255, 255, 255, 0.35);
  text-align: right;
}
</style>
